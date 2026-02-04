import { User, CartItem, Order, CartSummary, DashboardStats } from "@/types/profile";
import API from "@/lib/api"; // ✅ Use Axios instead of fetch

// ========== USER PROFILE ==========

export const getUserProfile = async (): Promise<User> => {
  try {
    const response = await API.get("/profile");
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch profile");
  }
};

export const updateUserProfile = async (data: Partial<User>): Promise<User> => {
  try {
    const response = await API.put("/profile", data);
    return response.data.user;
  } catch (error) {
    throw new Error("Failed to update profile");
  }
};

// ========== CART ==========

// ✅ FIXED: Changed from /profile/cart/summary to /cart
export const getCartSummary = async (): Promise<CartSummary> => {
  try {
    const response = await API.get("/cart");
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch cart");
  }
};

export const addToCart = async (sareeId: string, quantity: number): Promise<CartItem> => {
  try {
    const response = await API.post("/cart", { sareeId, quantity });
    return response.data.cartItem;
  } catch (error) {
    throw new Error("Failed to add to cart");
  }
};

export const removeFromCart = async (cartItemId: string): Promise<void> => {
  try {
    await API.delete(`/cart/${cartItemId}`);
  } catch (error) {
    throw new Error("Failed to remove from cart");
  }
};

export const updateCartQuantity = async (cartItemId: string, quantity: number): Promise<CartItem> => {
  try {
    const response = await API.put(`/cart/${cartItemId}`, { quantity });
    return response.data.cartItem;
  } catch (error) {
    throw new Error("Failed to update quantity");
  }
};

export const clearCart = async (): Promise<void> => {
  try {
    await API.delete("/cart");
  } catch (error) {
    throw new Error("Failed to clear cart");
  }
};

// ========== ORDERS ==========

// ✅ FIXED: Changed from /profile/orders to /orders/my-orders
export const getOrderHistory = async (): Promise<Order[]> => {
  try {
    const response = await API.get("/orders/my-orders");
    return response.data.orders;
  } catch (error) {
    throw new Error("Failed to fetch orders");
  }
};

// ✅ FIXED: Changed from /profile/orders/:id to /orders/details/:id
export const getOrderDetails = async (orderId: string): Promise<Order> => {
  try {
    const response = await API.get(`/orders/details/${orderId}`);
    return response.data.order;
  } catch (error) {
    throw new Error("Failed to fetch order details");
  }
};

// ========== ADMIN ==========

export const getAllOrders = async (filters?: { status?: string; userId?: string }): Promise<Order[]> => {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.userId) params.append("userId", filters.userId);

    const response = await API.get(`/orders/admin/all?${params}`);
    return response.data.orders;
  } catch (error) {
    throw new Error("Failed to fetch orders");
  }
};

export const updateOrderStatus = async (orderId: string, status: string): Promise<Order> => {
  try {
    const response = await API.put(`/orders/${orderId}/status`, { orderStatus: status });
    return response.data.order;
  } catch (error) {
    throw new Error("Failed to update order status");
  }
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const response = await API.get("/orders/admin/stats");
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch stats");
  }
};