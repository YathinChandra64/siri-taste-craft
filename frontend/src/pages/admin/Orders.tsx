import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  Search,
  ShoppingBag,
  DollarSign,
  Clock,
  CheckCircle,
  Loader,
  ChevronDown,
  Package,
  Truck,
  Home,
} from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OrderItem {
  product: string;
  name: string;
  quantity: number;
  price: number;
}

interface OrderAddress {
  fullName?: string;
  mobileNumber?: string;
  houseFlat?: string;
  streetArea?: string;
  city?: string;
  state?: string;
  pincode?: string;
  addressType?: string;
}

interface Order {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  items: OrderItem[];
  totalAmount: number;
  orderStatus: string;  // ✅ FIXED: Changed from status to orderStatus
  paymentMethod: string;
  paymentStatus?: string;
  paymentReference?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  address?: OrderAddress;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

const AdminOrders = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [showShippingForm, setShowShippingForm] = useState(false);

  // Check auth
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }

    if (!authLoading && user?.role !== "admin") {
      navigate("/");
      return;
    }

    if (!authLoading) {
      fetchOrders();
    }
  }, [authLoading, user, navigate]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:5000/api/orders/admin/all", {
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        // ✅ FIXED: Extract the orders array from the response object
        const ordersArray = Array.isArray(data) ? data : (data.orders || []);
        console.log("📦 Raw orders data:", ordersArray);
        setOrders(ordersArray);
        console.log("✅ Orders loaded:", ordersArray.length);
      } else {
        const error = await response.json();
        console.error("❌ API Error:", error);
        toast({ title: "Error", description: "Failed to load orders", variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast({ title: "Error", description: "Failed to load orders", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`http://localhost:5000/api/orders/${selectedOrder._id}/status`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderStatus: newStatus,  // ✅ FIXED: Changed from status to orderStatus
          adminNotes: adminNotes,
        }),
      });

      if (response.ok) {
        toast({ title: "Success", description: "Order updated successfully" });
        setIsViewDialogOpen(false);
        fetchOrders();
      } else {
        const error = await response.json();
        console.error("❌ Update error:", error);
        toast({ title: "Error", description: "Failed to update order", variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to update order:", error);
      toast({ title: "Error", description: "Failed to update order", variant: "destructive" });
    }
  };

  const openViewDialog = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.orderStatus);  // ✅ FIXED: Use orderStatus
    setAdminNotes(order.adminNotes || "");
    setIsViewDialogOpen(true);
  };

  // ✅ FIXED: Updated status color mapping to match backend statuses
  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      // UPI/COD statuses
      "PENDING_PAYMENT": "bg-yellow-500/20 text-yellow-400",
      "PLACED": "bg-blue-500/20 text-blue-400",
      "CONFIRMED": "bg-green-500/20 text-green-400",
      "PROCESSING": "bg-cyan-500/20 text-cyan-400",
      "PACKED": "bg-indigo-500/20 text-indigo-400",
      "SHIPPED": "bg-purple-500/20 text-purple-400",
      "IN_TRANSIT": "bg-violet-500/20 text-violet-400",
      "OUT_FOR_DELIVERY": "bg-orange-500/20 text-orange-400",
      "DELIVERED": "bg-emerald-500/20 text-emerald-400",
      "CANCELLED": "bg-gray-500/20 text-gray-400",
      "RETURNED": "bg-red-500/20 text-red-400",
      "REFUNDED": "bg-pink-500/20 text-pink-400",
      // Razorpay statuses
      "CREATED": "bg-slate-500/20 text-slate-400",
      "PAYMENT_PENDING": "bg-yellow-500/20 text-yellow-400",
      "PAID": "bg-green-500/20 text-green-400",
    };
    return statusMap[status] || "bg-gray-500/20 text-gray-400";
  };

  const getStatusLabel = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getStatusIcon = (status: string) => {
    const iconClass = "w-4 h-4";
    switch (status) {
      case "PLACED":
        return <Package className={iconClass} />;
      case "SHIPPED":
      case "IN_TRANSIT":
        return <Truck className={iconClass} />;
      case "DELIVERED":
      case "OUT_FOR_DELIVERY":
        return <Home className={iconClass} />;
      case "CONFIRMED":
      case "PROCESSING":
        return <CheckCircle className={iconClass} />;
      default:
        return <Clock className={iconClass} />;
    }
  };

  // ✅ FIXED: Filter by orderStatus instead of status
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order._id.includes(searchTerm) ||
      order.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || order.orderStatus === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // ✅ FIXED: Calculate stats using orderStatus
  const orderStats = {
    total: orders.length,
    pending: orders.filter((o) => o.orderStatus === "PENDING_PAYMENT").length,
    placed: orders.filter((o) => o.orderStatus === "PLACED").length,
    confirmed: orders.filter((o) => o.orderStatus === "CONFIRMED").length,
    shipped: orders.filter((o) => o.orderStatus === "SHIPPED").length,
    delivered: orders.filter((o) => o.orderStatus === "DELIVERED").length,
    cancelled: orders.filter((o) => o.orderStatus === "CANCELLED").length,
    totalRevenue: orders
      .filter((o) => ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"].includes(o.orderStatus))
      .reduce((sum, o) => sum + o.totalAmount, 0),
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex justify-center items-center">
        <Loader className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />

      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Orders Management</h1>
          <p className="text-slate-400">Manage and track all customer orders</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Orders</p>
                <p className="text-3xl font-bold text-blue-400">{orderStats.total}</p>
              </div>
              <ShoppingBag className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Pending Payment</p>
                <p className="text-3xl font-bold text-yellow-400">{orderStats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Shipped</p>
                <p className="text-3xl font-bold text-purple-400">{orderStats.shipped}</p>
              </div>
              <Truck className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-green-400">₹{orderStats.totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-6 space-y-4"
        >
          <div className="flex gap-4 flex-col md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <Input
                placeholder="Search by order ID, customer name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white pl-10"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white rounded px-4 py-2 min-w-48"
            >
              <option value="">All Status</option>
              <option value="CREATED">Created</option>
              <option value="PENDING_PAYMENT">Pending Payment</option>
              <option value="PLACED">Placed</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PROCESSING">Processing</option>
              <option value="PACKED">Packed</option>
              <option value="SHIPPED">Shipped</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="OUT_FOR_DELIVERY">Out For Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="RETURNED">Returned</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </motion.div>

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="w-12 h-12 animate-spin text-purple-600" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card className="p-8 text-center bg-slate-800 border-slate-700">
            <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No orders found</p>
            <p className="text-sm text-slate-500 mt-2">
              {orders.length === 0 ? "No orders in the system yet" : "No orders match your filters"}
            </p>
          </Card>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {filteredOrders.map((order, index) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-slate-800 border-slate-700 hover:border-purple-600/50 transition-all">
                  <div className="p-4">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-white">Order #{order._id.slice(-8).toUpperCase()}</h3>
                          <Badge className={getStatusColor(order.orderStatus)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(order.orderStatus)}
                              {getStatusLabel(order.orderStatus)}
                            </span>
                          </Badge>
                        </div>
                        <div className="flex gap-4 text-sm text-slate-400 flex-wrap">
                          <span>Customer: <span className="text-purple-400">{order.user.name}</span></span>
                          <span>Email: <span className="text-purple-400">{order.user.email}</span></span>
                          <span>Amount: <span className="text-green-400">₹{order.totalAmount.toLocaleString()}</span></span>
                          <span>Items: <span className="text-amber-400">{order.items.length}</span></span>
                          <span>Payment: <span className="text-indigo-400">{order.paymentMethod}</span></span>
                          <span>Date: <span className="text-slate-300">{new Date(order.createdAt).toLocaleDateString()}</span></span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          openViewDialog(order);
                        }}
                        className="border-slate-600"
                      >
                        <Eye size={16} />
                      </Button>
                      <ChevronDown
                        size={20}
                        className={`text-slate-400 ml-2 transition-transform ${expandedOrder === order._id ? "rotate-180" : ""}`}
                      />
                    </div>

                    {/* Expanded Details */}
                    {expandedOrder === order._id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-slate-700"
                      >
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-bold text-white mb-2">Items:</h4>
                            <div className="space-y-2">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="text-sm text-slate-400 bg-slate-700/50 p-3 rounded">
                                  <div className="flex justify-between">
                                    <span>{item.name}</span>
                                    <span className="text-purple-400">x{item.quantity}</span>
                                  </div>
                                  <div className="text-right text-slate-300">₹{(item.price * item.quantity).toLocaleString()}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-slate-400">Payment Method</p>
                              <p className="text-white capitalize font-semibold">{order.paymentMethod}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Payment Status</p>
                              <p className="text-white capitalize font-semibold">{order.paymentStatus || "N/A"}</p>
                            </div>
                          </div>

                          {order.address && (
                            <div className="bg-slate-700/50 p-3 rounded">
                              <p className="text-slate-400 text-sm mb-2">Delivery Address:</p>
                              <p className="text-white text-sm">
                                {order.address.fullName}, {order.address.houseFlat}, {order.address.streetArea},
                                {order.address.city}, {order.address.state} - {order.address.pincode}
                              </p>
                              <p className="text-slate-400 text-sm mt-1">Type: {order.address.addressType}</p>
                            </div>
                          )}

                          {(order.paymentReference || order.razorpayOrderId) && (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              {order.paymentReference && (
                                <div>
                                  <p className="text-slate-400">UPI Reference</p>
                                  <p className="text-white font-mono text-xs">{order.paymentReference}</p>
                                </div>
                              )}
                              {order.razorpayOrderId && (
                                <div>
                                  <p className="text-slate-400">Razorpay Order ID</p>
                                  <p className="text-white font-mono text-xs">{order.razorpayOrderId}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {order.adminNotes && (
                            <div>
                              <p className="text-slate-400 text-sm">Admin Notes</p>
                              <p className="text-white text-sm mt-1">{order.adminNotes}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* View/Edit Order Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Order Details & Management</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                {/* Order Info */}
                <div className="bg-slate-700/50 p-3 rounded">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Order ID</p>
                      <p className="text-white font-mono">{selectedOrder._id}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Created</p>
                      <p className="text-white">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="font-bold text-white mb-2">Order Items</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="text-sm text-slate-300 bg-slate-700/50 p-3 rounded flex justify-between">
                        <div>
                          <p>{item.name}</p>
                          <p className="text-slate-400">Qty: {item.quantity} × ₹{item.price.toLocaleString()}</p>
                        </div>
                        <p className="font-bold">₹{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-right border-t border-slate-600 pt-3">
                    <p className="text-lg font-bold text-green-400">Total: ₹{selectedOrder.totalAmount.toLocaleString()}</p>
                  </div>
                </div>

                {/* Status Update */}
                <div>
                  <Label>Update Order Status</Label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded p-2 mt-2"
                  >
                    <option value="CREATED">Created</option>
                    <option value="PENDING_PAYMENT">Pending Payment</option>
                    <option value="PLACED">Placed</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="PACKED">Packed</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="IN_TRANSIT">In Transit</option>
                    <option value="OUT_FOR_DELIVERY">Out For Delivery</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="RETURNED">Returned</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>
                </div>

                {/* Admin Notes */}
                <div>
                  <Label>Admin Notes</Label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded p-2 mt-2 text-sm"
                    rows={3}
                    placeholder="Add internal notes about this order..."
                  />
                </div>

                <Button onClick={handleStatusUpdate} className="w-full bg-purple-600 hover:bg-purple-700">
                  Update Order
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminOrders;