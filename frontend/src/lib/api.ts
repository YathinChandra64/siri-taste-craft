import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔐 Attach JWT automatically to all requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🚨 Handle expired token
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      // Optionally redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ======================================
// ✅ NEW: UPI PAYMENT ENDPOINTS
// ======================================

/**
 * Get UPI Configuration (public endpoint)
 */
export const getUpiConfig = async () => {
  const response = await API.get("/upi-payments/config");
  return response.data;
};

/**
 * Get Payment Receipt Reference Guide (public endpoint)
 */
export const getReceiptReference = async () => {
  const response = await API.get("/upi-payments/receipt-reference");
  return response.data;
};

/**
 * Upload Payment Screenshot and Extract UTR
 * @param {string} orderId - Order ID
 * @param {File} screenshot - Screenshot file
 * @returns {Promise} Payment submission result with UTR
 */
export const uploadPaymentScreenshot = async (
  orderId: string,
  screenshot: File
) => {
  const formData = new FormData();
  formData.append("orderId", orderId);
  formData.append("screenshot", screenshot);

  const response = await API.post("/upi-payments/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

/**
 * Get Payment Status
 * @param {string} orderId - Order ID
 * @returns {Promise} Payment status details
 */
export const getPaymentStatus = async (orderId: string) => {
  const response = await API.get(`/upi-payments/status/${orderId}`);
  return response.data;
};

/**
 * Resubmit Payment (retry with new screenshot)
 * @param {string} orderId - Order ID
 * @param {File} screenshot - New screenshot file
 * @returns {Promise} Updated payment result
 */
export const resubmitPayment = async (
  orderId: string,
  screenshot: File
) => {
  const formData = new FormData();
  formData.append("orderId", orderId);
  formData.append("screenshot", screenshot);

  const response = await API.post("/upi-payments/resubmit", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

/**
 * Verify Payment (Admin Only)
 * @param {string} paymentId - Payment ID to verify
 * @param {string} action - 'approve' or 'reject'
 * @param {string} notes - Verification notes
 * @returns {Promise} Verification result
 */
export const verifyPayment = async (
  paymentId: string,
  action: "approve" | "reject",
  notes?: string
) => {
  const response = await API.post("/upi-payments/verify", {
    paymentId,
    action,
    notes: notes || "",
  });
  return response.data;
};

/**
 * Get Pending Payments (Admin Only)
 * @param {number} limit - Results per page
 * @param {number} offset - Pagination offset
 * @returns {Promise} List of pending payments
 */
export const getPendingPayments = async (limit = 20, offset = 0) => {
  const response = await API.get(
    `/admin/payments/pending?limit=${limit}&offset=${offset}`
  );
  return response.data;
};

/**
 * Get Payment Statistics (Admin Only)
 * @returns {Promise} Payment statistics
 */
export const getPaymentStatistics = async () => {
  const response = await API.get("/admin/payments/statistics");
  return response.data;
};

// ======================================
// EXISTING: AUTHENTICATION ENDPOINTS
// ======================================

export const loginUser = async (email: string, password: string) => {
  const response = await API.post("/auth/login", { email, password });
  return response.data;
};

export const signupUser = async (userData: any) => {
  const response = await API.post("/auth/signup", userData);
  return response.data;
};

export const logoutUser = async () => {
  const response = await API.post("/auth/logout");
  return response.data;
};

export const verifyToken = async () => {
  const response = await API.get("/auth/verify");
  return response.data;
};

// ======================================
// EXISTING: PRODUCT ENDPOINTS
// ======================================

export const getProducts = async (filters?: any) => {
  const response = await API.get("/products", { params: filters });
  return response.data;
};

export const getProductById = async (id: string) => {
  const response = await API.get(`/products/${id}`);
  return response.data;
};

export const getSarees = async (filters?: any) => {
  const response = await API.get("/sarees", { params: filters });
  return response.data;
};

export const getSareeById = async (id: string) => {
  const response = await API.get(`/sarees/${id}`);
  return response.data;
};

// ======================================
// EXISTING: CART ENDPOINTS
// ======================================

export const getCart = async () => {
  const response = await API.get("/cart");
  return response.data;
};

export const addToCart = async (productId: string, quantity: number) => {
  const response = await API.post("/cart", { productId, quantity });
  return response.data;
};

export const updateCart = async (cartId: string, quantity: number) => {
  const response = await API.put(`/cart/${cartId}`, { quantity });
  return response.data;
};

export const removeFromCart = async (cartId: string) => {
  const response = await API.delete(`/cart/${cartId}`);
  return response.data;
};

export const clearCart = async () => {
  const response = await API.delete("/cart");
  return response.data;
};

// ======================================
// EXISTING: ORDER ENDPOINTS
// ======================================

export const createOrder = async (orderData: any) => {
  const response = await API.post("/orders", orderData);
  return response.data;
};

export const getOrders = async () => {
  const response = await API.get("/orders");
  return response.data;
};

export const getOrderById = async (id: string) => {
  const response = await API.get(`/orders/${id}`);
  return response.data;
};

export const updateOrder = async (id: string, updateData: any) => {
  const response = await API.put(`/orders/${id}`, updateData);
  return response.data;
};

export const cancelOrder = async (id: string) => {
  const response = await API.post(`/orders/${id}/cancel`);
  return response.data;
};

// ======================================
// EXISTING: PROFILE ENDPOINTS
// ======================================

export const getProfile = async () => {
  const response = await API.get("/profile");
  return response.data;
};

export const updateProfile = async (profileData: any) => {
  const response = await API.put("/profile", profileData);
  return response.data;
};

export const changePassword = async (oldPassword: string, newPassword: string) => {
  const response = await API.post("/profile/change-password", {
    oldPassword,
    newPassword,
  });
  return response.data;
};

// ======================================
// EXISTING: CONTACT ENDPOINTS
// ======================================

export const sendContactMessage = async (contactData: any) => {
  const response = await API.post("/contact", contactData);
  return response.data;
};

// ======================================
// EXISTING: CHAT ENDPOINTS
// ======================================

export const sendChatMessage = async (chatData: any) => {
  const response = await API.post("/chat", chatData);
  return response.data;
};

export const getChatMessages = async () => {
  const response = await API.get("/chat");
  return response.data;
};

// ======================================
// EXISTING: ISSUE ENDPOINTS
// ======================================

export const reportIssue = async (issueData: any) => {
  const response = await API.post("/issues", issueData);
  return response.data;
};

export const getIssues = async () => {
  const response = await API.get("/issues");
  return response.data;
};

// ======================================
// EXISTING: USER ENDPOINTS
// ======================================

export const getUsers = async () => {
  const response = await API.get("/users");
  return response.data;
};

export const getUserById = async (id: string) => {
  const response = await API.get(`/users/${id}`);
  return response.data;
};

export const updateUser = async (id: string, userData: any) => {
  const response = await API.put(`/users/${id}`, userData);
  return response.data;
};

// ======================================
// EXISTING: PAYMENT ENDPOINTS
// ======================================

export const processPayment = async (paymentData: any) => {
  const response = await API.post("/payments", paymentData);
  return response.data;
};

export const getPaymentHistory = async () => {
  const response = await API.get("/payments");
  return response.data;
};

// ======================================
// ERROR HANDLING UTILITY
// ======================================

export const handleApiError = (error: any) => {
  if (error.response) {
    // Server responded with error status
    return {
      message: error.response.data?.message || "An error occurred",
      status: error.response.status,
      data: error.response.data,
    };
  } else if (error.request) {
    // Request was made but no response
    return {
      message: "No response from server. Please check your connection.",
      status: null,
    };
  } else {
    // Error in request setup
    return {
      message: error.message || "An error occurred",
      status: null,
    };
  }
};

export default API;