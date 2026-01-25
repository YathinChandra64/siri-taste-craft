import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, ShoppingBag, Package, Mail, Shield } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import AnimatedBackground from "@/components/AnimatedBackground";

// ✅ FIX 1: Define proper types instead of 'any'
interface AdminStats {
  totalUsers: number;
  admins: number;
  customers: number;
}

interface OrderItem {
  product: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  user: {
    email: string;
    name: string;
  };
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  createdAt: string;
}

const AdminProfile = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ FIX 2: Wrap fetchAdminData with useCallback
  const fetchAdminData = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");
      
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication token not found",
          variant: "destructive"
        });
        return;
      }

      // Fetch stats
      const statsResponse = await fetch("http://localhost:5000/api/users/stats", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      // Fetch all orders
      const ordersResponse = await fetch("http://localhost:5000/api/orders", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
      
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setOrders(ordersData);
      }
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // ✅ FIX 3: Include all dependencies in useEffect
  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      navigate('/login');
      return;
    }

    fetchAdminData();
  }, [isAuthenticated, user, navigate, fetchAdminData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      
      <div className="relative z-10">
        <main className="flex-1 py-12 px-4">
          <div className="container mx-auto max-w-7xl">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-12"
            >
              <div className="flex items-center gap-6 mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-12 h-12 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl font-bold text-foreground">
                      {user.name}
                    </h1>
                    <Badge className="bg-purple-500">ADMIN</Badge>
                  </div>
                  <div className="space-y-1 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail size={16} />
                      <span>{user.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stats Grid */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="shadow-card">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Users</p>
                          <p className="text-3xl font-bold mt-2">{stats.totalUsers || 0}</p>
                        </div>
                        <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                          <Users className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="shadow-card">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Orders</p>
                          <p className="text-3xl font-bold mt-2">{orders.length || 0}</p>
                        </div>
                        <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                          <ShoppingBag className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="shadow-card">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Admin Count</p>
                          <p className="text-3xl font-bold mt-2">{stats.admins || 0}</p>
                        </div>
                        <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                          <Shield className="w-6 h-6 text-purple-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            )}

            {/* Recent Orders */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="shadow-card">
                <CardHeader className="bg-muted/50 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-6 h-6" />
                    Recent Orders
                  </CardTitle>
                  <CardDescription>
                    Latest {orders.length} orders from customers
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {orders.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No orders yet</p>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                      {orders.slice(0, 10).map((order) => (
                        <motion.div
                          key={order._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold">Order #{order._id?.slice(-6) || 'N/A'}</p>
                              <p className="text-sm text-muted-foreground">
                                {typeof order.user === 'object' 
                                  ? order.user?.email || 'Unknown User'
                                  : 'Unknown User'
                                }
                              </p>
                            </div>
                            <Badge 
                              className={`${
                                order.status === 'delivered' 
                                  ? 'bg-green-500' 
                                  : order.status === 'shipped'
                                  ? 'bg-blue-500'
                                  : order.status === 'confirmed'
                                  ? 'bg-yellow-500'
                                  : 'bg-orange-500'
                              }`}
                            >
                              {(order.status || 'pending').toUpperCase()}
                            </Badge>
                          </div>
                          <div className="mt-3 pt-3 border-t">
                            <p className="font-semibold">₹{(order.totalAmount || 0).toLocaleString()}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <Button
                onClick={() => navigate('/admin/users')}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white h-12"
                size="lg"
              >
                Manage Users
              </Button>
              <Button
                onClick={() => navigate('/admin/sarees')}
                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white h-12"
                size="lg"
              >
                Manage Sarees
              </Button>
              <Button
                onClick={() => navigate('/admin/messages')}
                className="bg-gradient-to-r from-pink-500 to-pink-600 text-white h-12"
                size="lg"
              >
                View Messages
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminProfile;