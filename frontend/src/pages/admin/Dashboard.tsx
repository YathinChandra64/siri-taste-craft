import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Users, ShoppingBag, Package, TrendingUp, ArrowRight, Loader } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AnimatedBackground from "@/components/AnimatedBackground";

type Stats = {
  totalUsers: number;
  admins: number;
  customers: number;
  totalOrders?: number;
  totalProducts?: number;
  totalRevenue?: number;
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("authToken");
      
      // Fetch user stats
      const userResponse = await fetch("http://localhost:5000/api/users/stats", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      let allStats: Stats = { totalUsers: 0, admins: 0, customers: 0 };

      if (userResponse.ok) {
        const userData = await userResponse.json();
        allStats = { ...allStats, ...userData };
      }

      // Fetch order stats
      try {
        const orderResponse = await fetch("http://localhost:5000/api/orders/admin/stats", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (orderResponse.ok) {
          const orderData = await orderResponse.json();
          allStats.totalOrders = orderData.totalOrders;
          allStats.totalRevenue = orderData.totalRevenue;
        }
      } catch (error) {
        console.log("Orders stats not available yet");
      }

      // Fetch product stats
      try {
        const productResponse = await fetch("http://localhost:5000/api/sarees/stats", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (productResponse.ok) {
          const productData = await productResponse.json();
          allStats.totalProducts = productData.totalSarees;
        }
      } catch (error) {
        console.log("Product stats not available yet");
      }

      setStats(allStats);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="px-4 py-1 rounded-full bg-amber-100 dark:bg-amber-900">
              <span className="text-sm font-bold text-amber-700 dark:text-amber-200">ADMIN PANEL</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Welcome back, <span className="bg-gradient-saree bg-clip-text text-transparent">{user?.name}</span>
          </h1>
          <p className="text-muted-foreground text-lg">Manage your store, users, products and orders from here</p>
        </motion.div>

        {/* Stats Cards */}
        {loading ? (
          <div className="flex justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-12">
            {/* Total Users */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-4 hover:shadow-lg transition-shadow duration-300 h-full">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Total Users</p>
                    <p className="text-3xl font-bold mt-1">{stats?.totalUsers}</p>
                  </div>
                  <Users size={24} className="text-blue-600 dark:text-blue-300" />
                </div>
              </Card>
            </motion.div>

            {/* Admin Users */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-4 hover:shadow-lg transition-shadow duration-300 h-full">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Admin Users</p>
                    <p className="text-3xl font-bold mt-1">{stats?.admins}</p>
                  </div>
                  <TrendingUp size={24} className="text-purple-600 dark:text-purple-300" />
                </div>
              </Card>
            </motion.div>

            {/* Customers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-4 hover:shadow-lg transition-shadow duration-300 h-full">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Customers</p>
                    <p className="text-3xl font-bold mt-1">{stats?.customers}</p>
                  </div>
                  <ShoppingBag size={24} className="text-green-600 dark:text-green-300" />
                </div>
              </Card>
            </motion.div>

            {/* Total Products */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="p-4 hover:shadow-lg transition-shadow duration-300 h-full">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Products</p>
                    <p className="text-3xl font-bold mt-1">{stats?.totalProducts || 0}</p>
                  </div>
                  <Package size={24} className="text-amber-600 dark:text-amber-300" />
                </div>
              </Card>
            </motion.div>

            {/* Total Orders */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="p-4 hover:shadow-lg transition-shadow duration-300 h-full">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Orders</p>
                    <p className="text-3xl font-bold mt-1">{stats?.totalOrders || 0}</p>
                  </div>
                  <ShoppingBag size={24} className="text-orange-600 dark:text-orange-300" />
                </div>
              </Card>
            </motion.div>

            {/* Total Revenue */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="p-4 hover:shadow-lg transition-shadow duration-300 h-full">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Revenue</p>
                    <p className="text-2xl font-bold mt-1">₹{((stats?.totalRevenue || 0) / 100000).toFixed(1)}L</p>
                  </div>
                  <TrendingUp size={24} className="text-green-600 dark:text-green-300" />
                </div>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Manage Users */}
            <Link to="/admin/users">
              <Card className="p-6 cursor-pointer hover:shadow-lg transition-all duration-300 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Manage Users</h3>
                  <Users className="text-blue-600" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Promote users to admin, delete accounts, and manage roles
                </p>
                <motion.div
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-2 text-primary font-medium"
                >
                  Go to Users <ArrowRight size={16} />
                </motion.div>
              </Card>
            </Link>

            {/* Products */}
            <Link to="/admin/products">
              <Card className="p-6 cursor-pointer hover:shadow-lg transition-all duration-300 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Manage Products</h3>
                  <Package className="text-green-600" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Add, edit, and delete products from your store
                </p>
                <motion.div
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-2 text-primary font-medium"
                >
                  Go to Products <ArrowRight size={16} />
                </motion.div>
              </Card>
            </Link>

            {/* Orders */}
            <Link to="/admin/orders">
              <Card className="p-6 cursor-pointer hover:shadow-lg transition-all duration-300 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">View Orders</h3>
                  <ShoppingBag className="text-orange-600" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Track and manage all customer orders
                </p>
                <motion.div
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-2 text-primary font-medium"
                >
                  Go to Orders <ArrowRight size={16} />
                </motion.div>
              </Card>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;