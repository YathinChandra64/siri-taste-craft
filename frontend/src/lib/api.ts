import axios from "axios";

interface AxiosConfig {
  headers: {
    "Content-Type": string;
  };
}

interface LoginData {
  email: string;
  password: string;
}

interface SignupData {
  [key: string]: unknown;
}

interface OrderData {
  [key: string]: unknown;
}

interface ProfileData {
  [key: string]: unknown;
}

interface UpdateData {
  [key: string]: unknown;
}

interface PasswordChangeData {
  oldPassword: string;
  newPassword: string;
}

interface ContactData {
  [key: string]: unknown;
}

interface ChatData {
  [key: string]: unknown;
}

interface IssueData {
  [key: string]: unknown;
}

interface UserData {
  [key: string]: unknown;
}

interface PaymentData {
  [key: string]: unknown;
}

interface FilterParams {
  [key: string]: unknown;
}

interface ApiErrorResponse {
  message: string;
  status: number | null;
  data?: unknown;
}

interface ApiNoResponseError {
  message: string;
  status: null;
}

type ApiError = ApiErrorResponse | ApiNoResponseError;

// ======================================
// GENERIC API RESPONSE WRAPPER
// ======================================

export interface ApiResponseWrapper<T> {
  success: boolean;
  message?: string;
  data: T;
}

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 second timeout
});

// ✅ IMPROVED: Request interceptor with better logging
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("✅ Auth token attached for:", config.url);
    } else if (!config.url?.includes("/auth/") && !config.url?.includes("/products") && !config.url?.includes("/sarees")) {
      console.warn("⚠️ No auth token found for request to:", config.url);
    }
    
    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// ✅ IMPROVED: Response interceptor with better error handling
API.interceptors.response.use(
  (response) => {
    console.log("✅ Response received:", {
      status: response.status,
      url: response.config.url,
      dataKeys: Object.keys(response.data || {})
    });
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    
    // Don't log connection errors excessively
    if (error.code === "ECONNREFUSED") {
      console.error("❌ Backend Connection Error: Server not running on http://localhost:5000");
      console.error("📌 Start your backend with: npm run dev (in the backend directory)");
    } else {
      console.error("❌ Response Error:", {
        status,
        message,
        url: error.config?.url,
        data: error.response?.data,
        timestamp: new Date().toISOString()
      });
    }

    // ✅ Handle 401 (Unauthorized) with improved logic
    if (status === 401) {
      console.warn("🔐 Authentication failed:", {
        reason: message,
        token: localStorage.getItem("authToken") ? "exists" : "missing"
      });
      
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      
      // Prevent redirect loops
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        const isAuthPage = ["/login", "/signup"].includes(currentPath);
        
        if (!isAuthPage) {
          // Use a slight delay to avoid rapid redirects
          const redirectTimer = setTimeout(() => {
            window.location.href = "/login?reason=session_expired&from=" + encodeURIComponent(currentPath);
          }, 100);
          
          // Cleanup on unmount (if in React component)
          return Promise.reject(error);
        }
      }
    }
    
    // ✅ Handle 500 (Server Error) with logging
    if (status === 500) {
      console.error("💥 Server Error Details:", {
        status: 500,
        url: error.config?.url,
        method: error.config?.method,
        data: error.response?.data,
        timestamp: new Date().toISOString()
      });
    }
    
    // ✅ Handle 403 (Forbidden)
    if (status === 403) {
      console.error("🔒 Access Forbidden:", message);
    }
    
    return Promise.reject(error);
  }
);

// ======================================
// ✅ NEW: UPI PAYMENT TYPES
// ======================================

export interface UpiConfigData {
  upiId: string;
  merchantName: string;
  qrCodeImage?: string;
  instructions: string;
}

export interface ReceiptReferenceData {
  [key: string]: unknown;
}

export interface OcrResultData {
  text: string;
  confidence: number;
  lineCount: number;
  utr?: string;
  ocrConfidence?: number;
  utrDetected?: boolean;
}

export interface PaymentSubmissionResultData {
  paymentId: string;
  orderId: string;
  status: string;
  utrDetected: boolean;
  utr?: string;
  ocrConfidence: number;
  ocrData: {
    text: string;
    confidence: number;
    lineCount: number;
  };
}

export interface PaymentStatusData {
  hasPayment: boolean;
  paymentId?: string;
  status?: string;
  utr?: string;
  amount?: number;
  submittedAt?: Date;
  verifiedAt?: Date;
  adminNotes?: string;
  attempts?: number;
  expiresAt?: Date;
  isExpired?: boolean;
}

export interface PaymentVerificationData {
  [key: string]: unknown;
}

export interface PendingPaymentsData {
  [key: string]: unknown;
}

export interface PaymentStatsData {
  [key: string]: unknown;
}

// ======================================
// ✅ NEW: UPI PAYMENT ENDPOINTS
// ======================================

/**
 * Get UPI Configuration (public endpoint)
 */
export const getUpiConfig = async (): Promise<
  ApiResponseWrapper<UpiConfigData>
> => {
  const response = await API.get("/upi-payments/config");
  return response.data;
};

/**
 * Get Payment Receipt Reference Guide (public endpoint)
 */
export const getReceiptReference = async (): Promise<
  ApiResponseWrapper<ReceiptReferenceData>
> => {
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
): Promise<ApiResponseWrapper<PaymentSubmissionResultData>> => {
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
export const getPaymentStatus = async (
  orderId: string
): Promise<ApiResponseWrapper<PaymentStatusData>> => {
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
): Promise<ApiResponseWrapper<PaymentSubmissionResultData>> => {
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
 * Verify Payment Manually (admin endpoint)
 * @param {string} paymentId - Payment ID
 * @param {boolean} approved - Approval status
 * @param {string} notes - Admin notes
 * @returns {Promise} Verification result
 */
export const verifyPaymentManually = async (
  paymentId: string,
  approved: boolean,
  notes?: string
): Promise<ApiResponseWrapper<PaymentVerificationData>> => {
  const response = await API.post(`/upi-payments/verify/${paymentId}`, {
    approved,
    notes,
  });
  return response.data;
};

/**
 * Get Pending Payments (admin endpoint)
 * @returns {Promise} List of pending payments
 */
export const getPendingPayments = async (): Promise<
  ApiResponseWrapper<PendingPaymentsData>
> => {
  const response = await API.get("/admin/payments/pending");
  return response.data;
};

/**
 * Get Payment Statistics (admin endpoint)
 * @returns {Promise} Payment statistics
 */
export const getPaymentStatistics = async (): Promise<
  ApiResponseWrapper<PaymentStatsData>
> => {
  const response = await API.get("/admin/payments/statistics");
  return response.data;
};

// ======================================
// EXISTING: AUTHENTICATION ENDPOINTS
// ======================================

export const loginUser = async (
  email: string,
  password: string
): Promise<unknown> => {
  const response = await API.post("/auth/login", { email, password });
  return response.data;
};

export const signupUser = async (userData: SignupData): Promise<unknown> => {
  const response = await API.post("/auth/signup", userData);
  return response.data;
};

export const logoutUser = async (): Promise<unknown> => {
  const response = await API.post("/auth/logout");
  return response.data;
};

export const verifyToken = async (): Promise<unknown> => {
  const response = await API.get("/auth/verify");
  return response.data;
};

// ======================================
// EXISTING: PRODUCT ENDPOINTS
// ======================================

export const getProducts = async (
  filters?: FilterParams
): Promise<unknown> => {
  const response = await API.get("/products", { params: filters });
  return response.data;
};

export const getProductById = async (id: string): Promise<unknown> => {
  const response = await API.get(`/products/${id}`);
  return response.data;
};

export const getSarees = async (filters?: FilterParams): Promise<unknown> => {
  const response = await API.get("/sarees", { params: filters });
  return response.data;
};

export const getSareeById = async (id: string): Promise<unknown> => {
  const response = await API.get(`/sarees/${id}`);
  return response.data;
};

// ======================================
// EXISTING: CART ENDPOINTS
// ======================================

/**
 * Get user's cart with token validation
 */
export const getCart = async (): Promise<unknown> => {
  const token = localStorage.getItem("authToken");
  
  if (!token) {
    console.warn("⚠️ No auth token found for cart request");
    throw new Error("Authentication required. Please login first.");
  }
  
  const response = await API.get("/cart");
  return response.data;
};

export const addToCart = async (
  productId: string,
  quantity: number
): Promise<unknown> => {
  const token = localStorage.getItem("authToken");
  
  if (!token) {
    throw new Error("Authentication required. Please login first.");
  }
  
  const response = await API.post("/cart", { productId, quantity });
  return response.data;
};

export const updateCart = async (
  cartId: string,
  quantity: number
): Promise<unknown> => {
  const response = await API.put(`/cart/${cartId}`, { quantity });
  return response.data;
};

export const removeFromCart = async (cartId: string): Promise<unknown> => {
  const response = await API.delete(`/cart/${cartId}`);
  return response.data;
};

export const clearCart = async (): Promise<unknown> => {
  const response = await API.delete("/cart");
  return response.data;
};

// ======================================
// EXISTING: ORDER ENDPOINTS
// ======================================

/**
 * Create a new order with proper validation
 */
export const createOrder = async (orderData: OrderData): Promise<unknown> => {
  const token = localStorage.getItem("authToken");
  
  if (!token) {
    console.error("❌ No auth token found for order creation");
    throw new Error("Authentication required. Please login first.");
  }
  
  // ✅ Validate order data structure
  if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
    throw new Error("Order must contain at least one item");
  }
  
  if (!orderData.totalAmount || typeof orderData.totalAmount !== "number" || orderData.totalAmount <= 0) {
    throw new Error("Order total amount must be a positive number");
  }
  
  if (!["COD", "UPI", "RAZORPAY"].includes(orderData.paymentMethod as string)) {
    throw new Error("Payment method must be either COD, UPI, or RAZORPAY");
  }
  
  console.log("📤 Creating order with validated data:", {
    itemCount: orderData.items.length,
    totalAmount: orderData.totalAmount,
    paymentMethod: orderData.paymentMethod
  });
  
  const response = await API.post("/orders", orderData);
  return response.data;
};

export const getOrders = async (): Promise<unknown> => {
  const response = await API.get("/orders");
  return response.data;
};

export const getOrderById = async (id: string): Promise<unknown> => {
  const response = await API.get(`/orders/${id}`);
  return response.data;
};

export const updateOrder = async (
  id: string,
  updateData: UpdateData
): Promise<unknown> => {
  const response = await API.put(`/orders/${id}`, updateData);
  return response.data;
};

export const cancelOrder = async (id: string): Promise<unknown> => {
  const response = await API.post(`/orders/${id}/cancel`);
  return response.data;
};

// ======================================
// EXISTING: PROFILE ENDPOINTS
// ======================================

export const getProfile = async (): Promise<unknown> => {
  const response = await API.get("/profile");
  return response.data;
};

export const updateProfile = async (
  profileData: ProfileData
): Promise<unknown> => {
  const response = await API.put("/profile", profileData);
  return response.data;
};

export const changePassword = async (
  oldPassword: string,
  newPassword: string
): Promise<unknown> => {
  const response = await API.post("/profile/change-password", {
    oldPassword,
    newPassword,
  });
  return response.data;
};

// ======================================
// EXISTING: CONTACT ENDPOINTS
// ======================================

export const sendContactMessage = async (
  contactData: ContactData
): Promise<unknown> => {
  const response = await API.post("/contact", contactData);
  return response.data;
};

// ======================================
// EXISTING: CHAT ENDPOINTS
// ======================================

export const sendChatMessage = async (chatData: ChatData): Promise<unknown> => {
  const response = await API.post("/chat", chatData);
  return response.data;
};

export const getChatMessages = async (): Promise<unknown> => {
  const response = await API.get("/chat");
  return response.data;
};

// ======================================
// EXISTING: ISSUE ENDPOINTS
// ======================================

export const reportIssue = async (issueData: IssueData): Promise<unknown> => {
  const response = await API.post("/issues", issueData);
  return response.data;
};

export const getIssues = async (): Promise<unknown> => {
  const response = await API.get("/issues");
  return response.data;
};

// ======================================
// EXISTING: USER ENDPOINTS
// ======================================

export const getUsers = async (): Promise<unknown> => {
  const response = await API.get("/users");
  return response.data;
};

export const getUserById = async (id: string): Promise<unknown> => {
  const response = await API.get(`/users/${id}`);
  return response.data;
};

export const updateUser = async (
  id: string,
  userData: UserData
): Promise<unknown> => {
  const response = await API.put(`/users/${id}`, userData);
  return response.data;
};

// ======================================
// EXISTING: PAYMENT ENDPOINTS
// ======================================

export const processPayment = async (
  paymentData: PaymentData
): Promise<unknown> => {
  const response = await API.post("/payments", paymentData);
  return response.data;
};

export const getPaymentHistory = async (): Promise<unknown> => {
  const response = await API.get("/payments");
  return response.data;
};

// ======================================
// ERROR HANDLING UTILITY
// ======================================

export const handleApiError = (error: unknown): ApiError => {
  if (
    error instanceof Error &&
    "response" in error &&
    error.response instanceof Object
  ) {
    const response = error.response as {
      status?: number;
      data?: { message?: string };
    };
    // Server responded with error status
    return {
      message: response.data?.message || "An error occurred",
      status: response.status || null,
      data: response.data,
    };
  } else if (
    error instanceof Error &&
    "request" in error &&
    error.request !== undefined
  ) {
    // Request was made but no response
    return {
      message: "No response from server. Please check your connection.",
      status: null,
    };
  } else if (error instanceof Error) {
    // Error in request setup
    return {
      message: error.message || "An error occurred",
      status: null,
    };
  } else {
    return {
      message: "An unknown error occurred",
      status: null,
    };
  }
};

export default API;