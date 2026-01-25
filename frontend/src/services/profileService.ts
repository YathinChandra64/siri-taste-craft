import { User, CartItem, Order, CartSummary, DashboardStats } from "@/types/profile";

const API_BASE = "http://localhost:5000/api";

// Get auth token
const getToken = () => localStorage.getItem("authToken");

const headers = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${getToken()}`
});

// ========== USER PROFILE ==========

export const getUserProfile = async (): Promise<User> => {
  const response = await fetch(`${API_BASE}/profile`, {
    headers: headers()
  });
  if (!response.ok) throw new Error("Failed to fetch profile");
  return response.json();
};

export const updateUserProfile = async (data: Partial<User>): Promise<User> => {
  const response = await fetch(`${API_BASE}/profile`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error("Failed to update profile");
  const result = await response.json();
  return result.user;
};

// ========== CART ==========

export const getCartSummary = async (): Promise<CartSummary> => {
  const response = await fetch(`${API_BASE}/profile/cart/summary`, {
    headers: headers()
  });
  if (!response.ok) throw new Error("Failed to fetch cart");
  return response.json();
};

export const addToCart = async (sareeId: string, quantity: number): Promise<CartItem> => {
  const response = await fetch(`${API_BASE}/cart`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ sareeId, quantity })
  });
  if (!response.ok) throw new Error("Failed to add to cart");
  const result = await response.json();
  return result.cartItem;
};

export const removeFromCart = async (cartItemId: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/cart/${cartItemId}`, {
    method: "DELETE",
    headers: headers()
  });
  if (!response.ok) throw new Error("Failed to remove from cart");
};

export const updateCartQuantity = async (cartItemId: string, quantity: number): Promise<CartItem> => {
  const response = await fetch(`${API_BASE}/cart/${cartItemId}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({ quantity })
  });
  if (!response.ok) throw new Error("Failed to update quantity");
  const result = await response.json();
  return result.cartItem;
};

export const clearCart = async (): Promise<void> => {
  const response = await fetch(`${API_BASE}/cart/clear/all`, {
    method: "DELETE",
    headers: headers()
  });
  if (!response.ok) throw new Error("Failed to clear cart");
};

// ========== ORDERS ==========

export const getOrderHistory = async (): Promise<Order[]> => {
  const response = await fetch(`${API_BASE}/profile/orders`, {
    headers: headers()
  });
  if (!response.ok) throw new Error("Failed to fetch orders");
  return response.json();
};

export const getOrderDetails = async (orderId: string): Promise<Order> => {
  const response = await fetch(`${API_BASE}/profile/orders/${orderId}`, {
    headers: headers()
  });
  if (!response.ok) throw new Error("Failed to fetch order details");
  return response.json();
};

// ========== ADMIN ==========

export const getAllOrders = async (filters?: { status?: string; userId?: string }): Promise<Order[]> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append("status", filters.status);
  if (filters?.userId) params.append("userId", filters.userId);

  const response = await fetch(`${API_BASE}/profile/admin/orders?${params}`, {
    headers: headers()
  });
  if (!response.ok) throw new Error("Failed to fetch orders");
  return response.json();
};

export const updateOrderStatus = async (orderId: string, status: string): Promise<Order> => {
  const response = await fetch(`${API_BASE}/profile/admin/orders/${orderId}/status`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({ status })
  });
  if (!response.ok) throw new Error("Failed to update order status");
  const result = await response.json();
  return result.order;
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await fetch(`${API_BASE}/profile/admin/stats`, {
    headers: headers()
  });
  if (!response.ok) throw new Error("Failed to fetch stats");
  return response.json();
};