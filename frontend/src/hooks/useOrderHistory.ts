/**
 * useOrderHistory Hook - FIXED VERSION
 * Manages fetching and refreshing order history after order placement
 * ✅ FIXED: Proper TypeScript typing for API responses
 */

import { useEffect, useState, useCallback } from "react";
import { getOrders } from "@/lib/api";

export interface OrderItem {
  product: string;
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

// ✅ FIXED: Define proper response type for API
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
}

export const useOrderHistory = (options: UseOrderHistoryOptions = {}) => {
  const {
    shouldRefresh = false,
    refreshDelay = 1000, // Wait 1s before fetching (for DB to process)
    autoRefreshInterval = 0 // Don't auto-refresh by default
  } = options;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(0);

  // ✅ FIXED: Fetch orders function with proper typing
  const fetchOrders = useCallback(async () => {
    try {
      console.log("📋 Fetching orders...");
      setLoading(true);
      setError(null);

      // ✅ FIXED: Cast response to proper type
      const response = (await getOrders()) as OrdersApiResponse;
      
      // ✅ FIXED: Safely handle different response formats
      let orderList: Order[] = [];
      
      // Try direct orders property
      if (response && typeof response === 'object' && 'orders' in response) {
        const ordersVal = response.orders;
        if (Array.isArray(ordersVal)) {
          orderList = ordersVal;
        }
      }
      
      // Try nested data.orders (if data exists and has orders)
      if (orderList.length === 0 && response && typeof response === 'object' && 'data' in response) {
        const dataVal = response.data;
        
        // Case 1: data is array directly
        if (Array.isArray(dataVal)) {
          orderList = dataVal as Order[];
        }
        // Case 2: data is object with orders property
        else if (dataVal && typeof dataVal === 'object' && 'orders' in dataVal) {
          const nestedOrders = (dataVal as { orders?: Order[] }).orders;
          if (Array.isArray(nestedOrders)) {
            orderList = nestedOrders;
          }
        }
      }
      
      // Try if response itself is array
      if (orderList.length === 0 && Array.isArray(response)) {
        orderList = response as Order[];
      }
      
      // ✅ Set orders (empty array is valid)
      console.log(`✅ Fetched ${orderList.length} orders`);
      
      // Sort by newest first
      const sortedOrders = [...orderList].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
      
      setOrders(sortedOrders);
      setLastRefresh(Date.now());
      
    } catch (err) {
      console.error("❌ Error fetching orders:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to fetch orders";
      setError(errorMsg);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Force refresh with delay (for after order placement)
  const forceRefresh = useCallback(async () => {
    console.log("🔄 Force refreshing orders...");
    
    // Wait for database to process
    await new Promise(resolve => setTimeout(resolve, refreshDelay));
    
    await fetchOrders();
  }, [fetchOrders, refreshDelay]);

  // ✅ Initial fetch on mount
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ✅ Refresh when shouldRefresh flag changes
  useEffect(() => {
    if (shouldRefresh) {
      console.log("📍 Refresh flag detected, refetching orders...");
      forceRefresh();
    }
  }, [shouldRefresh, forceRefresh]);

  // ✅ Optional: Auto-refresh at intervals
  useEffect(() => {
    if (autoRefreshInterval > 0) {
      console.log(`⏱️ Setting auto-refresh interval: ${autoRefreshInterval}ms`);
      
      const intervalId = setInterval(() => {
        fetchOrders();
      }, autoRefreshInterval);

      return () => clearInterval(intervalId);
    }
  }, [autoRefreshInterval, fetchOrders]);

  return {
    orders,
    loading,
    error,
    fetchOrders,
    forceRefresh,
    lastRefresh,
    isEmpty: orders.length === 0
  };
};

export default useOrderHistory;