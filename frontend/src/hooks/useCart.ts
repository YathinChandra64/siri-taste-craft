/**
 * ✅ FIXED useCart Hook
 * 
 * All warnings removed:
 * 1. No warning about missing auth token on initial mount
 * 2. Only warns if token should exist but doesn't
 */

import { useState, useEffect, useCallback } from "react";
import { CartItem, CartSummary } from "@/types/profile";
import {
  getCartSummary,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  clearCart
} from "@/services/profileService";
import { useToast } from "@/hooks/use-toast";

interface UseCartOptions {
  autoFetch?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

export const useCart = (options: UseCartOptions = {}) => {
  const { autoFetch = true, retryAttempts = 3, retryDelay = 1000 } = options;
  
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  // ✅ FIXED: Check if user is authenticated
  const checkAuthentication = useCallback((): boolean => {
    const token = localStorage.getItem("authToken");
    const hasToken = !!token && token.length > 10;
    setIsAuthenticated(hasToken);
    
    // ✅ FIXED: No warning log on initial check - it's normal to not have a token
    return hasToken;
  }, []);

  // ✅ FIXED: Fetch cart with proper auth checking
  const fetchCart = useCallback(async () => {
    try {
      // Check auth BEFORE attempting fetch
      if (!checkAuthentication()) {
        // ✅ FIXED: Silently wait for auth instead of logging warning
        console.debug("📍 useCart: Waiting for authentication...");
        setCart(null);
        setError("Please log in to view your cart");
        return;
      }

      setLoading(true);
      setError(null);
      
      console.log("🛒 Fetching cart...");
      const data = await getCartSummary();
      
      setCart(data);
      setRetryCount(0); // Reset retry count on success
      
      // ✅ FIXED: Proper type handling for CartSummary
      const itemCount = (data && typeof data === 'object' && 'cartItems' in data) 
        ? (Array.isArray((data as Record<string, unknown>).cartItems) 
          ? ((data as Record<string, unknown>).cartItems as unknown[]).length 
          : 0)
        : 0;
      
      console.log("✅ Cart fetched successfully", {
        itemCount
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load cart";
      
      // ✅ CRITICAL: Check for auth errors specifically
      if (err instanceof Error && "response" in err) {
        const response = (err as Record<string, unknown>).response as Record<string, unknown> | undefined;
        if (response?.status === 401) {
          console.error("🔐 Cart fetch failed: Unauthorized (401)");
          setError("Your session has expired. Please log in again.");
          setIsAuthenticated(false);
          return;
        }
        if (response?.status === 403) {
          console.error("🔒 Cart fetch failed: Forbidden (403)");
          setError("You don't have permission to access this cart.");
          return;
        }
      }
      
      console.error("❌ Cart fetch error:", errorMessage);
      setError(errorMessage);
      setCart(null);
      
      // Only show toast for non-auth errors
      if (!errorMessage.includes("session") && !errorMessage.includes("log in")) {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  }, [checkAuthentication, toast]);

  // ✅ Manual retry with exponential backoff
  const retryFetch = useCallback(async () => {
    if (retryCount >= retryAttempts) {
      console.error("❌ Max retry attempts reached");
      setError("Unable to load cart. Please try again later.");
      return;
    }

    const delay = retryDelay * Math.pow(2, retryCount);
    console.log(`⏳ Retrying cart fetch in ${delay}ms (attempt ${retryCount + 1}/${retryAttempts})`);
    
    setRetryCount(prev => prev + 1);
    await new Promise(resolve => setTimeout(resolve, delay));
    await fetchCart();
  }, [retryCount, retryAttempts, retryDelay, fetchCart]);

  // ✅ Add item with auth check
  const addItem = useCallback(async (sareeId: string, quantity: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Error",
        description: "Please log in to add items to cart",
        variant: "destructive"
      });
      return;
    }

    try {
      await addToCart(sareeId, quantity);
      await fetchCart();
      toast({
        title: "Success",
        description: "Item added to cart"
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to add item";
      console.error("❌ Add to cart error:", errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
    }
  }, [isAuthenticated, fetchCart, toast]);

  // ✅ Remove item
  const removeItem = useCallback(async (cartItemId: string) => {
    try {
      await removeFromCart(cartItemId);
      await fetchCart();
      toast({
        title: "Success",
        description: "Item removed from cart"
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to remove item";
      console.error("❌ Remove from cart error:", errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
    }
  }, [fetchCart, toast]);

  // ✅ Update quantity
  const updateQuantity = useCallback(async (cartItemId: string, quantity: number) => {
    try {
      await updateCartQuantity(cartItemId, quantity);
      await fetchCart();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update quantity";
      console.error("❌ Update quantity error:", errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
    }
  }, [fetchCart, toast]);

  // ✅ Clear cart
  const clear = useCallback(async () => {
    try {
      await clearCart();
      await fetchCart();
      toast({
        title: "Success",
        description: "Cart cleared"
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to clear cart";
      console.error("❌ Clear cart error:", errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
    }
  }, [fetchCart, toast]);

  // ✅ FIXED: Only fetch on mount if authenticated and autoFetch enabled
  useEffect(() => {
    if (autoFetch) {
      // Check auth immediately
      if (checkAuthentication()) {
        fetchCart();
      } else {
        // Set up listener for storage changes (when login happens)
        const handleStorageChange = () => {
          console.log("📍 Auth token detected, fetching cart...");
          fetchCart();
        };

        window.addEventListener("storage", handleStorageChange);
        
        // Also check after a short delay
        const timeoutId = setTimeout(() => {
          if (checkAuthentication()) {
            fetchCart();
          }
        }, 500);

        return () => {
          window.removeEventListener("storage", handleStorageChange);
          clearTimeout(timeoutId);
        };
      }
    }
  }, [autoFetch, checkAuthentication, fetchCart]);

  // ✅ FIXED: Proper type handling for isEmpty check
  const isEmpty = !cart || 
    (typeof cart === 'object' && cart !== null && 'cartItems' in cart 
      ? Array.isArray((cart as Record<string, unknown>).cartItems) 
        ? ((cart as Record<string, unknown>).cartItems as unknown[]).length === 0
        : true
      : true);

  return {
    cart,
    loading,
    error,
    isAuthenticated,
    fetchCart,
    retryFetch,
    addItem,
    removeItem,
    updateQuantity,
    clear,
    isEmpty
  };
};

export default useCart;