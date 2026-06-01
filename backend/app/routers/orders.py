from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Customer, Order, OrderItem, Product
from app.schemas import OrderCreate, OrderOut


router = APIRouter()


def _order_options():
    return (
        selectinload(Order.customer),
        selectinload(Order.items).selectinload(OrderItem.product),
    )


def _load_order(db: Session, order_id: int) -> Order:
    order = db.execute(select(Order).options(*_order_options()).where(Order.id == order_id)).scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")
    return order


@router.get("/", response_model=list[OrderOut])
def list_orders(db: Session = Depends(get_db)):
    return (
        db.execute(select(Order).options(*_order_options()).order_by(Order.created_at.desc()))
        .scalars()
        .all()
    )


@router.post("/", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    customer = db.get(Customer, payload.customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found.")

    quantities: dict[int, int] = {}
    for item in payload.items:
        quantities[item.product_id] = quantities.get(item.product_id, 0) + item.quantity

    products = (
        db.execute(select(Product).where(Product.id.in_(quantities.keys())).with_for_update())
        .scalars()
        .all()
    )
    products_by_id = {product.id: product for product in products}
    missing_ids = sorted(set(quantities) - set(products_by_id))
    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Products not found: {', '.join(str(product_id) for product_id in missing_ids)}.",
        )

    for product_id, requested_quantity in quantities.items():
        product = products_by_id[product_id]
        if product.stock < requested_quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Insufficient stock for {product.sku}. "
                    f"Available {product.stock}, requested {requested_quantity}."
                ),
            )

    order = Order(customer_id=customer.id, status="created", total_amount=Decimal("0.00"))
    db.add(order)
    db.flush()

    total_amount = Decimal("0.00")
    for product_id, quantity in quantities.items():
        product = products_by_id[product_id]
        unit_price = Decimal(product.price).quantize(Decimal("0.01"))
        line_total = (unit_price * quantity).quantize(Decimal("0.01"))
        product.stock -= quantity
        total_amount += line_total
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=quantity,
                unit_price=unit_price,
                line_total=line_total,
            )
        )

    order.total_amount = total_amount.quantize(Decimal("0.01"))
    db.commit()

    return _load_order(db, order.id)


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    return _load_order(db, order_id)


@router.patch("/{order_id}/cancel", response_model=OrderOut)
def cancel_order(order_id: int, db: Session = Depends(get_db)):
    order = _load_order(db, order_id)
    if order.status == "cancelled":
        return order

    product_ids = [item.product_id for item in order.items]
    products = (
        db.execute(select(Product).where(Product.id.in_(product_ids)).with_for_update())
        .scalars()
        .all()
    )
    products_by_id = {product.id: product for product in products}

    for item in order.items:
        product = products_by_id.get(item.product_id)
        if product:
            product.stock += item.quantity

    order.status = "cancelled"
    db.commit()

    return _load_order(db, order.id)
