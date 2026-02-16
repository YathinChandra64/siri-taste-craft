import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Order, Saree } from "@/types/profile";
import { motion } from "framer-motion";
import OrderTrackingTimeline from "@/components/OrderTrackingTimeline";
import { Package, CheckCircle, Truck, Home, Calendar, MapPin, Phone, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface OrderDetailModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

interface TimelineStageData {
  name: string;
  status: "completed" | "pending" | "current";
  timestamp?: Date;
  icon: string;
  description: string;
  shipper?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  location?: string;
}

export const OrderDetailModal = ({ order, isOpen, onClose }: OrderDetailModalProps) => {
  // ✅ FIXED: Properly handle shipping location and current location
  const getShippingLocation = () => {
    if (!order.shipping) return "Location unavailable";
    // Check for currentLocation first (more recent), then fall back to location
    return order.shipping.currentLocation || order.shipping.location || "In Transit";
  };

  // ✅ Determine order status with both old and new fields
  const orderStatus = order.orderStatus || order.status || "unknown";

  // ✅ Map status to timeline stages with proper typing
  const getTimelineStages = (): TimelineStageData[] => {
    const stages: TimelineStageData[] = [
      {
        name: "Order Placed",
        status:
          orderStatus === "CREATED" || orderStatus === "PLACED" || orderStatus === "pending_payment"
            ? ("completed" as const)
            : ("pending" as const),
        timestamp: new Date(order.createdAt),
        icon: "📦",
        description: "Your order has been placed successfully",
      },
      {
        name: "Payment Confirmed",
        status:
          ["CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(
            orderStatus
          ) || order.status === "confirmed"
            ? ("completed" as const)
            : orderStatus === "PENDING_PAYMENT" || orderStatus === "pending_payment"
            ? ("current" as const)
            : ("pending" as const),
        timestamp: new Date(order.updatedAt),
        icon: "✓",
        description: "Payment has been confirmed by our system",
      },
      {
        name: "Processing",
        status: ["PROCESSING", "PACKED", "SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(orderStatus)
          ? ("completed" as const)
          : orderStatus === "PROCESSING"
          ? ("current" as const)
          : ("pending" as const),
        timestamp: new Date(order.updatedAt),
        icon: "⚙️",
        description: "Your order is being prepared for shipment",
      },
      {
        name: "Packed",
        status: ["PACKED", "SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(orderStatus)
          ? ("completed" as const)
          : orderStatus === "PACKED"
          ? ("current" as const)
          : ("pending" as const),
        timestamp: new Date(order.updatedAt),
        icon: "📦",
        description: "Your order has been packed and is ready to ship",
      },
      {
        name: "Shipped",
        status: ["SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(orderStatus)
          ? ("completed" as const)
          : orderStatus === "SHIPPED"
          ? ("current" as const)
          : ("pending" as const),
        timestamp: new Date(order.updatedAt),
        icon: "🚚",
        description: "Your order has been handed to the courier",
        shipper: order.shipping?.shipper,
        trackingNumber: order.shipping?.trackingNumber,
        trackingUrl: order.shipping?.trackingUrl,
        location: order.shipping?.location,
      },
      {
        name: "In Transit",
        status: ["IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(orderStatus)
          ? ("completed" as const)
          : orderStatus === "IN_TRANSIT"
          ? ("current" as const)
          : ("pending" as const),
        timestamp: new Date(order.updatedAt),
        icon: "🚛",
        description: "Your order is on its way",
        shipper: order.shipping?.shipper,
        trackingNumber: order.shipping?.trackingNumber,
        trackingUrl: order.shipping?.trackingUrl,
        location: getShippingLocation(),
      },
      {
        name: "Out for Delivery",
        status: ["OUT_FOR_DELIVERY", "DELIVERED"].includes(orderStatus)
          ? ("completed" as const)
          : orderStatus === "OUT_FOR_DELIVERY"
          ? ("current" as const)
          : ("pending" as const),
        timestamp: new Date(order.updatedAt),
        icon: "📍",
        description: "Your order is out for delivery today",
        shipper: order.shipping?.shipper,
        trackingNumber: order.shipping?.trackingNumber,
        trackingUrl: order.shipping?.trackingUrl,
        location: getShippingLocation(),
      },
      {
        name: "Delivered",
        status: orderStatus === "DELIVERED" ? ("completed" as const) : ("pending" as const),
        timestamp: new Date(order.updatedAt),
        icon: "🏠",
        description: "Your order has been delivered",
      },
    ];
    return stages;
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING_PAYMENT":
      case "PENDING":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300";
      case "CONFIRMED":
      case "PROCESSING":
      case "PLACED":
        return "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300";
      case "SHIPPED":
      case "IN_TRANSIT":
      case "PACKED":
        return "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300";
      case "OUT_FOR_DELIVERY":
        return "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300";
      case "DELIVERED":
        return "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300";
      case "CANCELLED":
      case "RETURNED":
        return "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300";
      default:
        return "bg-gray-100 dark:bg-gray-900";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case "CREATED":
      case "PLACED":
        return <Package className="w-5 h-5" />;
      case "CONFIRMED":
      case "PROCESSING":
      case "PACKED":
        return <CheckCircle className="w-5 h-5" />;
      case "SHIPPED":
      case "IN_TRANSIT":
        return <Truck className="w-5 h-5" />;
      case "OUT_FOR_DELIVERY":
        return <MapPin className="w-5 h-5" />;
      case "DELIVERED":
        return <Home className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Order Details - #{order._id.slice(-8).toUpperCase()}</span>
            {getStatusIcon(orderStatus)}
          </DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* ✅ STATUS CARD */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">CURRENT STATUS</p>
                    <p className="text-lg font-bold">{(orderStatus || "unknown").replace(/_/g, " ").toUpperCase()}</p>
                  </div>
                  <Badge className={`${getStatusColor(orderStatus)} text-base px-4 py-2`}>
                    {(orderStatus || "unknown").replace(/_/g, " ").toUpperCase()}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ✅ SHIPPING INFORMATION - If available */}
          {order.shipping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Shipping Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.shipping.shipper && (
                    <div className="flex justify-between">
                      <span className="font-medium">Carrier:</span>
                      <span>{order.shipping.shipper}</span>
                    </div>
                  )}
                  {order.shipping.trackingNumber && (
                    <div className="flex justify-between">
                      <span className="font-medium">Tracking Number:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{order.shipping.trackingNumber}</span>
                        {order.shipping.trackingUrl && (
                          <a
                            href={order.shipping.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline text-sm"
                          >
                            Track
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  {order.shipping.location && (
                    <div className="flex justify-between">
                      <span className="font-medium">Location:</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {order.shipping.location}
                      </span>
                    </div>
                  )}
                  {order.shipping.currentLocation && (
                    <div className="flex justify-between">
                      <span className="font-medium">Last Location:</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {order.shipping.currentLocation}
                      </span>
                    </div>
                  )}
                  {order.shipping.estimatedDeliveryDate && (
                    <div className="flex justify-between">
                      <span className="font-medium">Est. Delivery:</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(order.shipping.estimatedDeliveryDate)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ✅ ORDER TRACKING TIMELINE */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Order Tracking Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <OrderTrackingTimeline
                  orderId={order._id}
                  currentStatus={orderStatus}
                  stages={getTimelineStages()}
                  shipping={order.shipping}
                  timeline={[]}
                />
              </CardContent>
            </Card>
          </motion.div>

          <Separator />

          {/* ✅ ORDER DETAILS */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-lg font-semibold mb-4">Order Information</h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-semibold mt-2">{formatDate(order.createdAt)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-semibold text-lg text-primary mt-2">₹{order.totalAmount.toLocaleString()}</p>
                </CardContent>
              </Card>
              {order.shipping?.estimatedDeliveryDate && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Expected Delivery</p>
                    <p className="font-semibold mt-2">
                      {new Date(order.shipping.estimatedDeliveryDate).toLocaleDateString("en-IN")}
                    </p>
                  </CardContent>
                </Card>
              )}
              {order.deliveryAddress && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Delivery Address</p>
                    <p className="font-semibold mt-2 text-sm line-clamp-2">{order.deliveryAddress}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>

          <Separator />

          {/* ✅ ITEMS ORDERED - FIXED: Properly handle populated product data */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-lg font-semibold mb-4">Items Ordered</h3>
            <div className="space-y-3">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, idx) => {
                  // ✅ FIXED: Safely check if product is populated or just an ID
                  const isPopulatedProduct =
                    typeof item.product === "object" && item.product !== null && "_id" in item.product;
                  
                  const productName = isPopulatedProduct ? (item.product as Saree).name : item.name || "Unknown Item";
                  const productImageUrl = isPopulatedProduct ? (item.product as Saree).imageUrl : undefined;
                  const productCategory = isPopulatedProduct ? (item.product as Saree).category : undefined;

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex gap-4">
                            {productImageUrl ? (
                              <img
                                src={productImageUrl}
                                alt={productName}
                                className="w-20 h-20 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                                <Package className="w-10 h-10 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm">{productName}</h4>
                              {productCategory && (
                                <p className="text-xs text-muted-foreground mt-1">{productCategory}</p>
                              )}
                              <div className="mt-2 flex justify-between items-center">
                                <span className="text-sm">Qty: <strong>{item.quantity}</strong></span>
                                <span className="text-sm font-semibold">₹{item.price.toLocaleString()} each</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-primary">
                                ₹{(item.price * item.quantity).toLocaleString()}
                              </p>
                              <p className="text-xs text-muted-foreground">Subtotal</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">No items in this order</p>
                  </CardContent>
                </Card>
              )}

              {/* ✅ ORDER SUMMARY - FIXED: Properly calculate subtotal from items */}
              {order.items && order.items.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: order.items.length * 0.1 + 0.1 }}
                >
                  <Card className="bg-muted">
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>
                            ₹
                            {order.items
                              .reduce((sum, item) => sum + item.price * item.quantity, 0)
                              .toLocaleString()}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total Amount:</span>
                          <span className="text-primary">₹{order.totalAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* ✅ INFO MESSAGE */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3"
          >
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">✓ Real-time Tracking</p>
              <p>
                Your order status updates in real-time. You can click on each stage in the timeline to see
                detailed information including location and tracking details from the courier service.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailModal;