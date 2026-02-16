import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Order } from "@/types/profile";
import { Package, Eye, ChevronRight, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { OrderDetailModal } from "./OrderDetailModal.tsx";

interface OrderHistorySectionProps {
  orders: Array<Partial<Order>>;
}

export const OrderHistorySection = ({ orders }: OrderHistorySectionProps) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getStatusColor = (status: string) => {
    const statusLower = (status || "").toLowerCase();
    switch (true) {
      case statusLower.includes("pending"):
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300";
      case statusLower.includes("confirmed"):
      case statusLower.includes("payment_submitted"):
        return "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300";
      case statusLower.includes("shipped"):
      case statusLower.includes("in_transit"):
      case statusLower.includes("out_for"):
        return "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300";
      case statusLower.includes("delivered"):
        return "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300";
      case statusLower.includes("cancelled"):
        return "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300";
      default:
        return "bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300";
    }
  };

  const handleViewDetails = (order: Partial<Order>) => {
    setSelectedOrder(order as Order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedOrder(null), 300);
  };

  // ✅ FIXED: Safely get item count with proper null/undefined checks
  const getItemCount = (order: Partial<Order>): number => {
    if (!order.items || !Array.isArray(order.items)) {
      return 0;
    }
    return order.items.length;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order History ({orders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No orders yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Start shopping to create your first order!
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
                {orders.map((order, idx) => {
                  // ✅ FIXED: Safely access order._id
                  const orderId = order._id || `unknown-${idx}`;
                  // ✅ FIXED: Safely access and format dates
                  const createdDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }) : "Date unknown";
                  // ✅ FIXED: Safely get item count
                  const itemCount = getItemCount(order);
                  // ✅ FIXED: Safely get total amount
                  const totalAmount = order.totalAmount || 0;
                  // ✅ FIXED: Safely get order status
                  const status = order.orderStatus || order.status || "unknown";

                  return (
                    <motion.div
                      key={orderId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-5 border-2 border-muted-foreground/20 rounded-xl hover:border-primary/50 hover:bg-muted/30 transition-all duration-200 group"
                    >
                      {/* Top Row: Order ID and Status Badge */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-white">
                            Order #{(orderId as string).slice(-8).toUpperCase()}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {createdDate}
                          </p>
                        </div>
                        <Badge
                          className={`${getStatusColor(status)} capitalize text-sm px-3 py-1 font-semibold`}
                        >
                          {(status || "unknown")
                            .replace(/_/g, " ")
                            .toUpperCase()}
                        </Badge>
                      </div>

                      {/* Middle Row: Items and Price */}
                      <div className="flex justify-between items-center mb-4 py-2 border-y border-muted-foreground/10">
                        <div className="flex gap-6">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              ITEMS
                            </p>
                            <p className="font-bold text-white">
                              {itemCount} item{itemCount !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              TOTAL
                            </p>
                            <p className="font-bold text-primary text-lg">
                              ₹{totalAmount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Shipping Info if available */}
                      {order.shipping && (
                        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                          <div className="flex items-center gap-2 text-sm">
                            <Truck className="w-4 h-4 text-blue-400" />
                            <span className="text-muted-foreground">
                              {order.shipping.shipper || "Shipping"} •{" "}
                              {order.shipping.currentLocation || order.shipping.location || "In Transit"}
                            </span>
                          </div>
                          {order.shipping.trackingNumber && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Tracking: {order.shipping.trackingNumber}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bottom Row: View Details Button */}
                      <div className="flex justify-end">
                        <Button
                          onClick={() => handleViewDetails(order)}
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold text-base px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 cursor-pointer"
                        >
                          <Eye size={18} />
                          VIEW ORDER DETAILS
                          <ChevronRight
                            size={18}
                            className="group-hover:translate-x-1 transition-transform duration-300"
                          />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Order Detail Modal - Shows Tracking Timeline */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder as Order}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};

export default OrderHistorySection;