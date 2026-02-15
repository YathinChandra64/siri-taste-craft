import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package,
  Users,
  ShoppingCart,
  TrendingUp,
  MessageSquare,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface AdminStats {
  pendingOrders: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  unreadMessages: number;
  pendingPayments: number;
}

interface RecentOrder {
  _id: string;
  orderNumber: string;
  customer: { name: string; email: string };
  totalAmount: number;
  status: string;
  createdAt: string;
}

const AdminProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats>({
    pendingOrders: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    unreadMessages: 0,
    pendingPayments: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
      return;
    }
    fetchAdminData();
  }, [user, navigate]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats from API
      const [ordersRes, usersRes] = await Promise.all([
        fetch("http://localhost:5000/api/orders", {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        }),
        fetch("http://localhost:5000/api/users", {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        }),
      ]);

      if (ordersRes.ok && usersRes.ok) {
        const ordersData = await ordersRes.json();
        const usersData = await usersRes.json();
        
        const orders = Array.isArray(ordersData) ? ordersData : ordersData.data || [];
        const users = Array.isArray(usersData) ? usersData : usersData.data || [];

        const pendingOrders = orders.filter(
          (o: RecentOrder) => o.status === "pending" || o.status === "created"
        ).length;
        
        const totalRevenue = orders.reduce(
          (sum: number, o) => sum + (o.totalAmount || o.amount || 0),
          0
        );

        setStats({
          pendingOrders,
          totalOrders: orders.length,
          totalUsers: users.length,
          totalRevenue,
          unreadMessages: 0,
          pendingPayments: pendingOrders,
        });

        // Get recent 5 orders
        setRecentOrders(orders.slice(0, 5));
      }
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      label: "Manage Orders",
      icon: ShoppingCart,
      path: "/admin/orders",
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "View Users",
      icon: Users,
      path: "/admin/users",
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      label: "Products",
      icon: Package,
      path: "/admin/sarees",
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
      label: "Messages",
      icon: MessageSquare,
      path: "/admin/messages",
      color: "text-pink-600",
      bg: "bg-pink-50 dark:bg-pink-900/20",
    },
  ];

  const statCards = [
    {
      label: "Pending Orders",
      value: stats.pendingOrders,
      icon: Clock,
      color: "text-yellow-600",
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
    },
    {
      label: "Total Orders",
      value: stats.totalOrders,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-900/20",
    },
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "Revenue",
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-900/20",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8">
      <div className="container max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user?.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here's what's happening with your store today
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bg}`}>
                      <Icon className={`${stat.color}`} size={24} />
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Card
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className="p-6 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:shadow-lg transition-all cursor-pointer hover:scale-105"
                >
                  <div className={`p-3 rounded-lg ${action.bg} mb-3 w-fit`}>
                    <Icon className={action.color} size={24} />
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {action.label}
                  </p>
                </Card>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Recent Orders
            </h2>
            <Button
              variant="outline"
              onClick={() => navigate("/admin/orders")}
              className="text-sm"
            >
              View All
            </Button>
          </div>
          
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No orders yet
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-slate-700">
                {recentOrders.map((order) => (
                  <div
                    key={order._id}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                    onClick={() => navigate("/admin/orders")}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Order #{order.orderNumber || order._id.slice(-6)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {order.customer.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-white">
                          ₹{order.totalAmount.toLocaleString()}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            order.status === "delivered"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                              : order.status === "pending"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminProfilePage;