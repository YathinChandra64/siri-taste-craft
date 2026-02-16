/**
 * ✅ FIXED useOrderHistory Hook
 * 
 * Critical Fixes:
 * 1. Added auth token checking before fetch
 * 2. Improved OrderItem typing to support object products
 * 3. Added ProductInfo interface
 * 4. Simplified response parsing logic
 * 5. Waits for token before making requests
 * 6. Fixed TypeScript 'any' error on line 199
 */

import { useEffect, useState, useCallback } from "react";
import { getOrders } from "@/lib/api";

// ✅ CRITICAL FIX: Support both populated object and ObjectId string for product
export interface ProductInfo {
  _id: string;
  name: string;
  price: number;
  imageUrl?: string;
  material?: string;
  color?: string;
  category?: string;
  stock?: number;
}

// ✅ CRITICAL FIX: OrderItem product can be either string or object
export interface OrderItem {
  product: string | ProductInfo;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  orderId?: string;
  user: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: "COD" | "UPI" | "RAZORPAY";
  orderStatus: string;
  paymentStatus: string;
  address?: {
    fullName: string;
    mobileNumber: string;
    houseFlat: string;
    streetArea: string;
    city: string;
    state: string;
    pincode: string;
    addressType: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface OrdersApiResponse {
  success?: boolean;
  orders?: Order[];
  data?: Order[] | { orders?: Order[] };
  message?: string;
  [key: string]: unknown;
}

interface UseOrderHistoryOptions {
  shouldRefresh?: boolean;
  refreshDelay?: number;
  autoRefreshInterval?: number;
  autoFetch?: boolean;
}

export const useOrderHistory = (options: UseOrderHistoryOptions = {}) => {
  const {
    shouldRefresh = false,
    refreshDelay = 1000,
    autoRefreshInterval = 0,
    autoFetch = true
  } = options;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ✅ CRITICAL FIX: Check if user is authenticated
  const checkAuthentication = useCallback((): boolean => {
    const token = localStorage.getItem("authToken");
    const hasToken = !!token && token.length > 10;
    setIsAuthenticated(hasToken);
    
    if (!hasToken) {
      console.warn("⚠️ useOrderHistory: No auth token found, skipping fetch");
    }
    
    return hasToken;
  }, []);

  // ✅ CRITICAL FIX: Improved response parsing with proper typing
  const parseOrdersResponse = (response: unknown): Order[] => {
    if (!response || typeof response !== "object") {
      console.warn("⚠️ Invalid response format:", response);
      return [];
    }

    const resp = response as OrdersApiResponse;
    let orderList: Order[] = [];

    // Try direct 'orders' property
    if (resp.orders && Array.isArray(resp.orders)) {
      orderList = resp.orders;
      console.log("📍 Found orders in response.orders");
    }
    // Try nested 'data.orders'
    else if (resp.data) {
      if (Array.isArray(resp.data)) {
        orderList = resp.data as Order[];
        console.log("📍 Found orders in response.data (array)");
      } else if (typeof resp.data === "object" && "orders" in resp.data) {
        // ✅ FIXED: Changed from (resp.data as { orders?: unknown }) to (resp.data as Record<string, unknown>)
        const nestedOrders = (resp.data as Record<string, unknown>).orders;
        if (Array.isArray(nestedOrders)) {
          orderList = nestedOrders as Order[];
          console.log("📍 Found orders in response.data.orders");
        }
      }
    }
    // Try if response itself is array
    else if (Array.isArray(response)) {
      orderList = response as Order[];
      console.log("📍 Response itself is array of orders");
    }

    return orderList;
  };

  // ✅ CRITICAL FIX: Normalize product data to ensure consistent format
  const normalizeOrders = (rawOrders: Order[]): Order[] => {
    return rawOrders.map(order => ({
      ...order,
      items: order.items.map(item => {
        // If product is already populated object, keep it
        if (typeof item.product === "object" && item.product._id) {
          return {
            ...item,
            product: {
              ...item.product,
              name: item.product.name || item.name
            } as ProductInfo
          };
        }
        // If product is just an ObjectId, create minimal object with snapshot data
        return {
          ...item,
          product: {
            _id: String(item.product),
            name: item.name,
            price: item.price
          } as ProductInfo
        };
      })
    }));
  };

  // ✅ CRITICAL FIX: Fetch with auth checking
  const fetchOrders = useCallback(async () => {
    try {
      if (!checkAuthentication()) {
        console.warn("⚠️ useOrderHistory: Not authenticated");
        setOrders([]);
        setError(null);
        return;
      }

      console.log("📋 Fetching orders...");
      setLoading(true);
      setError(null);

      const response = (await getOrders()) as OrdersApiResponse;
      const orderList = parseOrdersResponse(response);
      const normalizedOrders = normalizeOrders(orderList);

      // Sort by newest first
      const sortedOrders = [...normalizedOrders].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

      console.log(`✅ Fetched ${sortedOrders.length} orders`);
      setOrders(sortedOrders);
      setLastRefresh(Date.now());

    } catch (err) {
      console.error("❌ Error fetching orders:", err);

      // ✅ Check for auth errors
      if (err instanceof Error && "response" in err) {
        // ✅ FIXED: Changed from (err as any).response to (err as Record<string, unknown>).response
        const response = (err as Record<string, unknown>).response as Record<string, unknown> | undefined;
        if (response?.status === 401) {
          console.error("🔐 Order fetch failed: Unauthorized (401)");
          setError("Your session has expired. Please log in again.");
          setIsAuthenticated(false);
          return;
        }
        if (response?.status === 403) {
          console.error("🔒 Order fetch failed: Forbidden (403)");
          setError("You don't have permission to view these orders.");
          return;
        }
      }

      const errorMsg = err instanceof Error ? err.message : "Failed to fetch orders";
      setError(errorMsg);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [checkAuthentication]);

  // ✅ Force refresh with delay
  const forceRefresh = useCallback(async () => {
    console.log("🔄 Force refreshing orders...");
    await new Promise(resolve => setTimeout(resolve, refreshDelay));
    await fetchOrders();
  }, [fetchOrders, refreshDelay]);

  // ✅ CRITICAL FIX: Only fetch if authenticated
  useEffect(() => {
    if (autoFetch) {
      if (checkAuthentication()) {
        fetchOrders();
      } else {
        // Listen for auth token changes
        const handleStorageChange = () => {
          console.log("📍 Auth token detected, fetching orders...");
          fetchOrders();
        };

        window.addEventListener("storage", handleStorageChange);

        const timeoutId = setTimeout(() => {
          if (checkAuthentication()) {
            fetchOrders();
          }
        }, 500);

        return () => {
          window.removeEventListener("storage", handleStorageChange);
          clearTimeout(timeoutId);
        };
      }
    }
  }, [autoFetch, checkAuthentication, fetchOrders]);

  useEffect(() => {
    if (shouldRefresh && isAuthenticated) {
      console.log("📍 Refresh flag detected, refetching orders...");
      forceRefresh();
    }
  }, [shouldRefresh, isAuthenticated, forceRefresh]);

  useEffect(() => {
    if (autoRefreshInterval > 0 && isAuthenticated) {
      console.log(`⏱️ Setting auto-refresh interval: ${autoRefreshInterval}ms`);

      const intervalId = setInterval(() => {
        fetchOrders();
      }, autoRefreshInterval);

      return () => clearInterval(intervalId);
    }
  }, [autoRefreshInterval, isAuthenticated, fetchOrders]);

  return {
    orders,
    loading,
    error,
    isAuthenticated,
    fetchOrders,
    forceRefresh,
    lastRefresh,
    isEmpty: orders.length === 0
  };
};

export default useOrderHistory;