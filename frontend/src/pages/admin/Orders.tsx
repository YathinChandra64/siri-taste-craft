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

interface Order {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  items: OrderItem[];
  totalAmount: number;
  status: string;
  paymentMethod: string;
  paymentReference?: string;
  createdAt: string;
  adminNotes?: string;
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
        setOrders(ordersArray);
        console.log("✅ Orders loaded:", ordersArray.length);
      } else {
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
          status: newStatus,
          adminNotes: adminNotes,
        }),
      });

      if (response.ok) {
        toast({ title: "Success", description: "Order updated successfully" });
        setIsViewDialogOpen(false);
        fetchOrders();
      } else {
        toast({ title: "Error", description: "Failed to update order", variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to update order:", error);
      toast({ title: "Error", description: "Failed to update order", variant: "destructive" });
    }
  };

  const openViewDialog = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setAdminNotes(order.adminNotes || "");
    setIsViewDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      pending_payment: "bg-yellow-500/20 text-yellow-400",
      payment_submitted: "bg-blue-500/20 text-blue-400",
      confirmed: "bg-green-500/20 text-green-400",
      payment_rejected: "bg-red-500/20 text-red-400",
      shipped: "bg-purple-500/20 text-purple-400",
      delivered: "bg-emerald-500/20 text-emerald-400",
      cancelled: "bg-gray-500/20 text-gray-400",
    };
    return statusMap[status] || "bg-gray-500/20 text-gray-400";
  };

  const getStatusLabel = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order._id.includes(searchTerm) ||
      order.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const orderStats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending_payment").length,
    confirmed: orders.filter((o) => o.status === "confirmed").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    totalRevenue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
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
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Orders Management</h1>
            <p className="text-slate-400">Manage and track all customer orders</p>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8"
        >
          <Card className="bg-slate-800 border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <ShoppingBag className="text-purple-400" size={24} />
              <div>
                <p className="text-slate-400 text-sm">Total Orders</p>
                <p className="text-2xl font-bold text-white">{orderStats.total}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800 border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <Clock className="text-yellow-400" size={24} />
              <div>
                <p className="text-slate-400 text-sm">Pending</p>
                <p className="text-2xl font-bold text-white">{orderStats.pending}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800 border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-400" size={24} />
              <div>
                <p className="text-slate-400 text-sm">Confirmed</p>
                <p className="text-2xl font-bold text-white">{orderStats.confirmed}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800 border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <ShoppingBag className="text-blue-400" size={24} />
              <div>
                <p className="text-slate-400 text-sm">Shipped</p>
                <p className="text-2xl font-bold text-white">{orderStats.shipped}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800 border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-emerald-400" size={24} />
              <div>
                <p className="text-slate-400 text-sm">Delivered</p>
                <p className="text-2xl font-bold text-white">{orderStats.delivered}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800 border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="text-green-400" size={24} />
              <div>
                <p className="text-slate-400 text-sm">Revenue</p>
                <p className="text-2xl font-bold text-white">₹{orderStats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col md:flex-row gap-4 mb-8"
        >
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <Input
                placeholder="Search by order ID, customer name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white pl-10"
              />
            </div>
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded px-4 py-2"
          >
            <option value="">All Status</option>
            <option value="pending_payment">Pending Payment</option>
            <option value="payment_submitted">Payment Submitted</option>
            <option value="confirmed">Confirmed</option>
            <option value="payment_rejected">Payment Rejected</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
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
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-white">Order #{order._id.slice(-8).toUpperCase()}</h3>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </div>
                        <div className="flex gap-4 text-sm text-slate-400 flex-wrap">
                          <span>Customer: <span className="text-purple-400">{order.user.name}</span></span>
                          <span>Email: <span className="text-purple-400">{order.user.email}</span></span>
                          <span>Amount: <span className="text-green-400">₹{order.totalAmount}</span></span>
                          <span>Items: <span className="text-amber-400">{order.items.length}</span></span>
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
                              <p className="text-white capitalize">{order.paymentMethod}</p>
                            </div>
                            {order.paymentReference && (
                              <div>
                                <p className="text-slate-400">Reference ID</p>
                                <p className="text-white">{order.paymentReference}</p>
                              </div>
                            )}
                          </div>

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
              <DialogTitle>Order Details</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-white mb-2">Order Items</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="text-sm text-slate-300 bg-slate-700/50 p-3 rounded flex justify-between">
                        <div>
                          <p>{item.name}</p>
                          <p className="text-slate-400">Qty: {item.quantity} × ₹{item.price}</p>
                        </div>
                        <p className="font-bold">₹{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-right border-t border-slate-600 pt-3">
                    <p className="text-lg font-bold text-green-400">Total: ₹{selectedOrder.totalAmount.toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <Label>Update Status</Label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded p-2 mt-2"
                  >
                    <option value="pending_payment">Pending Payment</option>
                    <option value="payment_submitted">Payment Submitted</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="payment_rejected">Payment Rejected</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

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