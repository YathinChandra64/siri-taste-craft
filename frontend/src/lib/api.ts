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

// ✅ IMPROVED: Request interceptor with better logging and token handling
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("✅ Token attached to request:", {
        url: config.url,
        method: config.method,
        hasToken: !!token,
        tokenLength: token.length
      });
    } else {
      // Check if this endpoint requires auth
      const publicEndpoints = ["/auth/login", "/auth/signup", "/sarees", "/products"];
      const isPublicEndpoint = publicEndpoints.some(endpoint => config.url?.includes(endpoint));
      
      if (!isPublicEndpoint) {
        console.warn("⚠️ NO AUTH TOKEN for protected endpoint:", {
          url: config.url,
          method: config.method,
          token: "NOT FOUND"
        });
      }
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
      hasData: !!response.data
    });
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    
    // Don't log connection errors excessively
    if (error.code === "ECONNREFUSED") {
      console.error("❌ BACKEND NOT RUNNING:", {
        message: "Cannot connect to http://localhost:5000",
        fix: "Start backend with: npm run dev (in backend directory)"
      });
    } else if (status === 401) {
      console.error("🔐 AUTHENTICATION FAILED:", {
        status: 401,
        message: message,
        url: error.config?.url,
        tokenExists: !!localStorage.getItem("authToken"),
        action: "Token may be expired or invalid"
      });
      
      console.warn("⚠️ 401 error on endpoint:", error.config?.url, "- NOT removing token");
    } else if (status === 500) {
      console.error("💥 SERVER ERROR (500):", {
        status: 500,
        url: error.config?.url,
        method: error.config?.method,
        message: message,
        data: error.response?.data
      });
    } else if (status === 403) {
      console.error("🔒 FORBIDDEN (403):", {
        status: 403,
        message: message,
        url: error.config?.url
      });
    } else if (status === 404) {
      console.warn("⚠️ NOT FOUND (404):", {
        status: 404,
        url: error.config?.url,
        message: message
      });
    } else {
      console.error("❌ Response Error:", {
        status: status || "unknown",
        message: message,
        url: error.config?.url,
        code: error.code
      });
    }
    
    return Promise.reject(error);
  }
);

// ======================================
// ✅ HELPER: Extract data from wrapped response
// ======================================

/**
 * Extract data array from API response
 * Handles both { data: [...] } and direct [...] responses
 */
const extractData = <T,>(response: unknown): T => {
  if (response && typeof response === "object") {
    // If response has a 'data' property, return it
    if ("data" in response) {
      return (response as Record<string, unknown>).data as T;
    }
    // If it's directly the data (array or object), return it
    return response as T;
  }
  return response as T;
};

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
// ✅ UPI PAYMENT ENDPOINTS - Keep all exports!
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
 */
export const getPaymentStatus = async (
  paymentId: string
): Promise<ApiResponseWrapper<PaymentStatusData>> => {
  const response = await API.get(`/upi-payments/status/${paymentId}`);
  return response.data;
};

/**
 * Verify Payment with Admin UTR
 */
export const verifyPaymentWithUtr = async (
  paymentId: string,
  verificationUtr: string
): Promise<ApiResponseWrapper<PaymentVerificationData>> => {
  const response = await API.post(
    `/upi-payments/${paymentId}/verify-utr`,
    { verificationUtr }
  );
  return response.data;
};

/**
 * Get Pending Payments (Admin)
 */
export const getPendingPayments = async (): Promise<
  ApiResponseWrapper<PendingPaymentsData>
> => {
  const response = await API.get("/upi-payments/pending");
  return response.data;
};

/**
 * Get Payment Stats (Admin)
 */
export const getPaymentStats = async (): Promise<
  ApiResponseWrapper<PaymentStatsData>
> => {
  const response = await API.get("/upi-payments/stats");
  return response.data;
};

/**
 * Mark Payment as Verified by Admin
 */
export const markPaymentAsVerified = async (
  paymentId: string,
  adminNotes?: string
): Promise<ApiResponseWrapper<PaymentStatusData>> => {
  const response = await API.put(`/upi-payments/${paymentId}/verify`, {
    adminNotes,
  });
  return response.data;
};

/**
 * Reject Payment (Admin)
 */
export const rejectPayment = async (
  paymentId: string,
  rejectionReason: string
): Promise<ApiResponseWrapper<PaymentStatusData>> => {
  const response = await API.put(`/upi-payments/${paymentId}/reject`, {
    rejectionReason,
  });
  return response.data;
};

/**
 * Retry Payment Upload (Customer)
 */
export const retryPaymentUpload = async (
  paymentId: string,
  newScreenshot: File
): Promise<ApiResponseWrapper<PaymentSubmissionResultData>> => {
  const formData = new FormData();
  formData.append("screenshot", newScreenshot);

  const response = await API.post(
    `/upi-payments/${paymentId}/retry`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

// ======================================
// ✅ NOTE: CART ENDPOINTS
// ======================================
// Cart operations are handled in profileService.ts
// Use profileService.addToCart(), getCartSummary(), etc.
// Do NOT use api.ts directly for cart - use profileService instead

export const getCart = async (): Promise<unknown> => {
  const token = localStorage.getItem("authToken");
  
  if (!token) {
    console.warn("⚠️ No auth token found for cart request");
    throw new Error("Authentication required. Please login first.");
  }
  
  const response = await API.get("/cart");
  return extractData(response.data);
};

export const updateCart = async (
  cartId: string,
  quantity: number
): Promise<unknown> => {
  const response = await API.put(`/cart/${cartId}`, { quantity });
  return extractData(response.data);
};

export const removeFromCart = async (cartId: string): Promise<unknown> => {
  const response = await API.delete(`/cart/${cartId}`);
  return extractData(response.data);
};

export const clearCart = async (): Promise<unknown> => {
  const response = await API.delete("/cart");
  return extractData(response.data);
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
  return extractData(response.data);
};

/**
 * Get orders with proper data extraction
 */
export const getOrders = async (): Promise<unknown> => {
  const response = await API.get("/orders");
  return extractData(response.data);
};

/**
 * Get order by ID with proper data extraction
 */
export const getOrderById = async (id: string): Promise<unknown> => {
  const response = await API.get(`/orders/${id}`);
  return extractData(response.data);
};

export const updateOrder = async (
  id: string,
  updateData: UpdateData
): Promise<unknown> => {
  const response = await API.put(`/orders/${id}`, updateData);
  return extractData(response.data);
};

export const cancelOrder = async (id: string): Promise<unknown> => {
  const response = await API.post(`/orders/${id}/cancel`);
  return extractData(response.data);
};

// ======================================
// EXISTING: PROFILE ENDPOINTS
// ======================================

/**
 * Get profile with proper data extraction
 */
export const getProfile = async (): Promise<unknown> => {
  const response = await API.get("/profile");
  return extractData(response.data);
};

export const updateProfile = async (
  profileData: ProfileData
): Promise<unknown> => {
  const response = await API.put("/profile", profileData);
  return extractData(response.data);
};

export const changePassword = async (
  oldPassword: string,
  newPassword: string
): Promise<unknown> => {
  const response = await API.post("/profile/change-password", {
    oldPassword,
    newPassword,
  });
  return extractData(response.data);
};

// ======================================
// EXISTING: CONTACT ENDPOINTS
// ======================================

export const sendContactMessage = async (
  contactData: ContactData
): Promise<unknown> => {
  const response = await API.post("/contact", contactData);
  return extractData(response.data);
};

// ======================================
// EXISTING: CHAT ENDPOINTS
// ======================================

export const sendChatMessage = async (chatData: ChatData): Promise<unknown> => {
  const response = await API.post("/chat", chatData);
  return extractData(response.data);
};

/**
 * Get chat messages with proper data extraction
 */
export const getChatMessages = async (): Promise<unknown> => {
  const response = await API.get("/chat");
  return extractData(response.data);
};

// ======================================
// EXISTING: ISSUE ENDPOINTS
// ======================================

export const reportIssue = async (issueData: IssueData): Promise<unknown> => {
  const response = await API.post("/issues", issueData);
  return extractData(response.data);
};

/**
 * Get issues with proper data extraction
 */
export const getIssues = async (): Promise<unknown> => {
  const response = await API.get("/issues");
  return extractData(response.data);
};

// ======================================
// EXISTING: USER ENDPOINTS
// ======================================

/**
 * Get users with proper data extraction
 */
export const getUsers = async (): Promise<unknown> => {
  const response = await API.get("/users");
  return extractData(response.data);
};

/**
 * Get user by ID with proper data extraction
 */
export const getUserById = async (id: string): Promise<unknown> => {
  const response = await API.get(`/users/${id}`);
  return extractData(response.data);
};

export const updateUser = async (
  id: string,
  userData: UserData
): Promise<unknown> => {
  const response = await API.put(`/users/${id}`, userData);
  return extractData(response.data);
};

// ======================================
// EXISTING: PAYMENT ENDPOINTS
// ======================================

export const processPayment = async (
  paymentData: PaymentData
): Promise<unknown> => {
  const response = await API.post("/payments", paymentData);
  return extractData(response.data);
};

/**
 * Get payment history with proper data extraction
 */
export const getPaymentHistory = async (): Promise<unknown> => {
  const response = await API.get("/payments");
  return extractData(response.data);
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