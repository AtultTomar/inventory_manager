import {
  AlertCircle,
  BadgeDollarSign,
  Boxes,
  Check,
  ClipboardList,
  Edit3,
  Loader2,
  PackagePlus,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "./api";

const emptyProduct = { name: "", sku: "", description: "", price: "", stock: "" };
const emptyCustomer = { name: "", email: "", phone: "", address: "" };
const emptyOrderItem = { product_id: "", quantity: 1 };

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function App() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeView, setActiveView] = useState("products");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [search, setSearch] = useState("");

  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingProductId, setEditingProductId] = useState(null);
  const [customerForm, setCustomerForm] = useState(emptyCustomer);
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [orderForm, setOrderForm] = useState({ customer_id: "", items: [emptyOrderItem] });

  const loadData = async ({ keepNotice = false } = {}) => {
    setLoading(true);
    if (!keepNotice) {
      setNotice(null);
    }
    try {
      const [productData, customerData, orderData] = await Promise.all([
        api.listProducts(),
        api.listCustomers(),
        api.listOrders(),
      ]);
      setProducts(productData);
      setCustomers(customerData);
      setOrders(orderData);
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const productMap = useMemo(() => {
    return new Map(products.map((product) => [String(product.id), product]));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) =>
      [product.name, product.sku, product.description || ""].some((value) =>
        value.toLowerCase().includes(term),
      ),
    );
  }, [products, search]);

  const metrics = useMemo(() => {
    const activeOrders = orders.filter((order) => order.status !== "cancelled");
    return {
      products: products.length,
      stock: products.reduce((total, product) => total + Number(product.stock), 0),
      customers: customers.length,
      revenue: activeOrders.reduce((total, order) => total + Number(order.total_amount), 0),
      lowStock: products.filter((product) => Number(product.stock) <= 5).length,
    };
  }, [products, customers, orders]);

  const orderPreviewTotal = useMemo(() => {
    return orderForm.items.reduce((total, item) => {
      const product = productMap.get(String(item.product_id));
      return total + (product ? Number(product.price) * Number(item.quantity || 0) : 0);
    }, 0);
  }, [orderForm.items, productMap]);

  const showSuccess = (message) => setNotice({ type: "success", message });

  const handleProductSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const payload = {
        ...productForm,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
      };
      if (editingProductId) {
        await api.updateProduct(editingProductId, payload);
        showSuccess("Product updated.");
      } else {
        await api.createProduct(payload);
        showSuccess("Product added.");
      }
      setProductForm(emptyProduct);
      setEditingProductId(null);
      await loadData({ keepNotice: true });
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleCustomerSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      if (editingCustomerId) {
        await api.updateCustomer(editingCustomerId, customerForm);
        showSuccess("Customer updated.");
      } else {
        await api.createCustomer(customerForm);
        showSuccess("Customer added.");
      }
      setCustomerForm(emptyCustomer);
      setEditingCustomerId(null);
      await loadData({ keepNotice: true });
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleOrderSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      await api.createOrder({
        customer_id: Number(orderForm.customer_id),
        items: orderForm.items.map((item) => ({
          product_id: Number(item.product_id),
          quantity: Number(item.quantity),
        })),
      });
      setOrderForm({ customer_id: "", items: [emptyOrderItem] });
      showSuccess("Order created and stock updated.");
      await loadData({ keepNotice: true });
      setActiveView("orders");
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const editProduct = (product) => {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      sku: product.sku,
      description: product.description || "",
      price: product.price,
      stock: product.stock,
    });
    setActiveView("products");
  };

  const editCustomer = (customer) => {
    setEditingCustomerId(customer.id);
    setCustomerForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || "",
      address: customer.address || "",
    });
    setActiveView("customers");
  };

  const removeProduct = async (id) => {
    setSaving(true);
    try {
      await api.deleteProduct(id);
      showSuccess("Product deleted.");
      await loadData({ keepNotice: true });
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const removeCustomer = async (id) => {
    setSaving(true);
    try {
      await api.deleteCustomer(id);
      showSuccess("Customer deleted.");
      await loadData({ keepNotice: true });
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const cancelOrder = async (id) => {
    setSaving(true);
    try {
      await api.cancelOrder(id);
      showSuccess("Order cancelled and stock restored.");
      await loadData({ keepNotice: true });
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const updateOrderItem = (index, field, value) => {
    setOrderForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const addOrderItem = () => {
    setOrderForm((current) => ({ ...current, items: [...current.items, emptyOrderItem] }));
  };

  const removeOrderItem = (index) => {
    setOrderForm((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Inventory Operations</p>
          <h1>Inventory & Orders</h1>
        </div>
        <button className="icon-button" onClick={loadData} title="Refresh data" disabled={loading}>
          <RefreshCw size={18} />
        </button>
      </header>

      <section className="metric-grid" aria-label="Inventory summary">
        <Metric icon={Boxes} label="Products" value={metrics.products} tone="blue" />
        <Metric icon={PackagePlus} label="Units in Stock" value={metrics.stock} tone="green" />
        <Metric icon={Users} label="Customers" value={metrics.customers} tone="violet" />
        <Metric icon={BadgeDollarSign} label="Active Revenue" value={money.format(metrics.revenue)} tone="amber" />
        <Metric icon={AlertCircle} label="Low Stock" value={metrics.lowStock} tone="red" />
      </section>

      {notice && (
        <div className={`notice ${notice.type}`} role="status">
          {notice.type === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
          <span>{notice.message}</span>
          <button className="ghost-icon" onClick={() => setNotice(null)} title="Dismiss">
            <X size={16} />
          </button>
        </div>
      )}

      <nav className="view-tabs" aria-label="Application views">
        <TabButton active={activeView === "products"} icon={Boxes} label="Products" onClick={() => setActiveView("products")} />
        <TabButton active={activeView === "customers"} icon={Users} label="Customers" onClick={() => setActiveView("customers")} />
        <TabButton active={activeView === "orders"} icon={ClipboardList} label="Orders" onClick={() => setActiveView("orders")} />
      </nav>

      {loading ? (
        <div className="loading-state">
          <Loader2 className="spin" size={24} />
          <span>Loading</span>
        </div>
      ) : (
        <>
          {activeView === "products" && (
            <section className="workspace">
              <form className="panel form-panel" onSubmit={handleProductSubmit}>
                <div className="panel-title">
                  <PackagePlus size={20} />
                  <h2>{editingProductId ? "Edit Product" : "Add Product"}</h2>
                </div>
                <div className="form-grid">
                  <label>
                    Name
                    <input required value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} />
                  </label>
                  <label>
                    SKU
                    <input required value={productForm.sku} onChange={(event) => setProductForm({ ...productForm, sku: event.target.value })} />
                  </label>
                  <label>
                    Price
                    <input required min="0" step="0.01" type="number" value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} />
                  </label>
                  <label>
                    Stock
                    <input required min="0" step="1" type="number" value={productForm.stock} onChange={(event) => setProductForm({ ...productForm, stock: event.target.value })} />
                  </label>
                  <label className="span-all">
                    Description
                    <textarea rows="3" value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} />
                  </label>
                </div>
                <div className="form-actions">
                  {editingProductId && (
                    <button type="button" className="secondary-button" onClick={() => { setEditingProductId(null); setProductForm(emptyProduct); }}>
                      <X size={16} />
                      Cancel
                    </button>
                  )}
                  <button className="primary-button" disabled={saving}>
                    {editingProductId ? <Check size={16} /> : <Plus size={16} />}
                    {editingProductId ? "Update" : "Add"}
                  </button>
                </div>
              </form>

              <section className="panel list-panel">
                <div className="panel-toolbar">
                  <div className="panel-title">
                    <Boxes size={20} />
                    <h2>Products</h2>
                  </div>
                  <label className="search-box">
                    <Search size={16} />
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" />
                  </label>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>SKU</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product.id}>
                          <td>
                            <strong>{product.name}</strong>
                            <span>{product.description || "No description"}</span>
                          </td>
                          <td>{product.sku}</td>
                          <td>{money.format(Number(product.price))}</td>
                          <td>
                            <span className={Number(product.stock) <= 5 ? "stock low" : "stock"}>{product.stock}</span>
                          </td>
                          <td className="row-actions">
                            <button className="icon-button" onClick={() => editProduct(product)} title="Edit product">
                              <Edit3 size={16} />
                            </button>
                            <button className="icon-button danger" onClick={() => removeProduct(product.id)} title="Delete product">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!filteredProducts.length && (
                        <tr>
                          <td colSpan="5" className="empty-row">No products found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </section>
          )}

          {activeView === "customers" && (
            <section className="workspace">
              <form className="panel form-panel" onSubmit={handleCustomerSubmit}>
                <div className="panel-title">
                  <UserPlus size={20} />
                  <h2>{editingCustomerId ? "Edit Customer" : "Add Customer"}</h2>
                </div>
                <div className="form-grid">
                  <label>
                    Name
                    <input required value={customerForm.name} onChange={(event) => setCustomerForm({ ...customerForm, name: event.target.value })} />
                  </label>
                  <label>
                    Email
                    <input required type="email" value={customerForm.email} onChange={(event) => setCustomerForm({ ...customerForm, email: event.target.value })} />
                  </label>
                  <label>
                    Phone
                    <input value={customerForm.phone} onChange={(event) => setCustomerForm({ ...customerForm, phone: event.target.value })} />
                  </label>
                  <label className="span-all">
                    Address
                    <textarea rows="3" value={customerForm.address} onChange={(event) => setCustomerForm({ ...customerForm, address: event.target.value })} />
                  </label>
                </div>
                <div className="form-actions">
                  {editingCustomerId && (
                    <button type="button" className="secondary-button" onClick={() => { setEditingCustomerId(null); setCustomerForm(emptyCustomer); }}>
                      <X size={16} />
                      Cancel
                    </button>
                  )}
                  <button className="primary-button" disabled={saving}>
                    {editingCustomerId ? <Check size={16} /> : <Plus size={16} />}
                    {editingCustomerId ? "Update" : "Add"}
                  </button>
                </div>
              </form>

              <section className="panel list-panel">
                <div className="panel-title">
                  <Users size={20} />
                  <h2>Customers</h2>
                </div>
                <div className="customer-grid">
                  {customers.map((customer) => (
                    <article className="customer-card" key={customer.id}>
                      <div>
                        <h3>{customer.name}</h3>
                        <p>{customer.email}</p>
                        <span>{customer.phone || "No phone"}</span>
                      </div>
                      <div className="row-actions">
                        <button className="icon-button" onClick={() => editCustomer(customer)} title="Edit customer">
                          <Edit3 size={16} />
                        </button>
                        <button className="icon-button danger" onClick={() => removeCustomer(customer.id)} title="Delete customer">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </article>
                  ))}
                  {!customers.length && <p className="empty-copy">No customers yet.</p>}
                </div>
              </section>
            </section>
          )}

          {activeView === "orders" && (
            <section className="workspace">
              <form className="panel form-panel" onSubmit={handleOrderSubmit}>
                <div className="panel-title">
                  <ShoppingCart size={20} />
                  <h2>Create Order</h2>
                </div>
                <div className="form-grid">
                  <label className="span-all">
                    Customer
                    <select required value={orderForm.customer_id} onChange={(event) => setOrderForm({ ...orderForm, customer_id: event.target.value })}>
                      <option value="">Select customer</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>{customer.name} - {customer.email}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="line-items">
                  {orderForm.items.map((item, index) => {
                    const selectedProduct = productMap.get(String(item.product_id));
                    return (
                      <div className="line-item" key={`${index}-${item.product_id}`}>
                        <label>
                          Product
                          <select required value={item.product_id} onChange={(event) => updateOrderItem(index, "product_id", event.target.value)}>
                            <option value="">Select product</option>
                            {products.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name} ({product.sku}) - stock {product.stock}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Qty
                          <input required min="1" step="1" type="number" value={item.quantity} onChange={(event) => updateOrderItem(index, "quantity", event.target.value)} />
                        </label>
                        <div className="line-total">
                          <span>{selectedProduct ? money.format(Number(selectedProduct.price) * Number(item.quantity || 0)) : money.format(0)}</span>
                          <small>{selectedProduct ? `${selectedProduct.stock} available` : "Select item"}</small>
                        </div>
                        <button type="button" className="icon-button danger" onClick={() => removeOrderItem(index)} disabled={orderForm.items.length === 1} title="Remove item">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="order-footer">
                  <button type="button" className="secondary-button" onClick={addOrderItem}>
                    <Plus size={16} />
                    Item
                  </button>
                  <strong>{money.format(orderPreviewTotal)}</strong>
                </div>
                <div className="form-actions">
                  <button className="primary-button" disabled={saving || !products.length || !customers.length}>
                    <ShoppingCart size={16} />
                    Create
                  </button>
                </div>
              </form>

              <section className="panel list-panel">
                <div className="panel-title">
                  <ClipboardList size={20} />
                  <h2>Orders</h2>
                </div>
                <div className="orders-list">
                  {orders.map((order) => (
                    <article className="order-card" key={order.id}>
                      <div className="order-card-head">
                        <div>
                          <h3>Order #{order.id}</h3>
                          <p>{order.customer.name} - {new Date(order.created_at).toLocaleString()}</p>
                        </div>
                        <span className={`status-pill ${order.status}`}>{order.status}</span>
                      </div>
                      <div className="order-items">
                        {order.items.map((item) => (
                          <div key={item.id}>
                            <span>{item.product.name}</span>
                            <span>{item.quantity} x {money.format(Number(item.unit_price))}</span>
                          </div>
                        ))}
                      </div>
                      <div className="order-card-foot">
                        <strong>{money.format(Number(order.total_amount))}</strong>
                        {order.status !== "cancelled" && (
                          <button className="secondary-button" onClick={() => cancelOrder(order.id)} disabled={saving}>
                            <X size={16} />
                            Cancel
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                  {!orders.length && <p className="empty-copy">No orders yet.</p>}
                </div>
              </section>
            </section>
          )}
        </>
      )}
    </main>
  );
}

function Metric({ icon: Icon, label, value, tone }) {
  return (
    <article className={`metric ${tone}`}>
      <Icon size={20} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

function TabButton({ active, icon: Icon, label, onClick }) {
  return (
    <button className={`tab-button ${active ? "active" : ""}`} onClick={onClick}>
      <Icon size={17} />
      {label}
    </button>
  );
}

export default App;
