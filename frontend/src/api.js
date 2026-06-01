const API_BASE_URL =
  window.__APP_CONFIG__?.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const detail = data?.detail;
    let message = "Request failed.";
    if (typeof detail === "string") {
      message = detail;
    } else if (Array.isArray(detail)) {
      message = detail.map((item) => item.msg).join(", ");
    }
    throw new Error(message);
  }

  return data;
}

export const api = {
  listProducts: () => request("/products/"),
  createProduct: (payload) =>
    request("/products/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateProduct: (id, payload) =>
    request(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteProduct: (id) => request(`/products/${id}`, { method: "DELETE" }),

  listCustomers: () => request("/customers/"),
  createCustomer: (payload) =>
    request("/customers/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateCustomer: (id, payload) =>
    request(`/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteCustomer: (id) => request(`/customers/${id}`, { method: "DELETE" }),

  listOrders: () => request("/orders/"),
  createOrder: (payload) =>
    request("/orders/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  cancelOrder: (id) => request(`/orders/${id}/cancel`, { method: "PATCH" }),
};
