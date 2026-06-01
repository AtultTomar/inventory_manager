from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    sku: str = Field(..., min_length=1, max_length=80)
    description: str | None = None
    price: Decimal = Field(..., ge=0)
    stock: int = Field(..., ge=0)

    @field_validator("sku")
    @classmethod
    def normalize_sku(cls, value: str) -> str:
        return value.strip().upper()


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    sku: str | None = Field(default=None, min_length=1, max_length=80)
    description: str | None = None
    price: Decimal | None = Field(default=None, ge=0)
    stock: int | None = Field(default=None, ge=0)

    @field_validator("sku")
    @classmethod
    def normalize_sku(cls, value: str | None) -> str | None:
        return value.strip().upper() if value else value


class ProductOut(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProductSummary(BaseModel):
    id: int
    name: str
    sku: str

    model_config = ConfigDict(from_attributes=True)


class CustomerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=40)
    address: str | None = None

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=40)
    address: str | None = None

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr | None) -> str | None:
        return str(value).strip().lower() if value else value


class CustomerOut(CustomerBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CustomerSummary(BaseModel):
    id: int
    name: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)


class OrderItemCreate(BaseModel):
    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0)


class OrderCreate(BaseModel):
    customer_id: int = Field(..., gt=0)
    items: list[OrderItemCreate] = Field(..., min_length=1)


class OrderItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    line_total: Decimal
    product: ProductSummary

    model_config = ConfigDict(from_attributes=True)


class OrderOut(BaseModel):
    id: int
    customer_id: int
    status: str
    total_amount: Decimal
    created_at: datetime
    customer: CustomerSummary
    items: list[OrderItemOut]

    model_config = ConfigDict(from_attributes=True)
