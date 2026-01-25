import { useState, useEffect } from "react";
import { Order } from "@/types/profile";
import { getOrderHistory, getOrderDetails } from "@/services/profileService";
import { useToast } from "@/hooks/use-toast";

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getOrderHistory();
      setOrders(data);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getDetails = async (orderId: string): Promise<Order | null> => {
    try {
      return await getOrderDetails(orderId);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive"
      });
      return null;
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return { orders, loading, fetchOrders, getDetails };
};