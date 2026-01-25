import { useState, useEffect } from "react";
import { CartItem, CartSummary } from "@/types/profile";
import {
  getCartSummary,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  clearCart
} from "@/services/profileService";
import { useToast } from "@/hooks/use-toast";

export const useCart = () => {
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCart = async () => {
    try {
      setLoading(true);
      const data = await getCartSummary();
      setCart(data);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load cart",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (sareeId: string, quantity: number) => {
    try {
      await addToCart(sareeId, quantity);
      await fetchCart();
      toast({
        title: "Success",
        description: "Item added to cart"
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to add item",
        variant: "destructive"
      });
    }
  };

  const removeItem = async (cartItemId: string) => {
    try {
      await removeFromCart(cartItemId);
      await fetchCart();
      toast({
        title: "Success",
        description: "Item removed from cart"
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive"
      });
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    try {
      await updateCartQuantity(cartItemId, quantity);
      await fetchCart();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive"
      });
    }
  };

  const clear = async () => {
    try {
      await clearCart();
      await fetchCart();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to clear cart",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  return { cart, loading, fetchCart, addItem, removeItem, updateQuantity, clear };
};