import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  ShoppingCart,
  Package,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/useAuth';

interface DashboardStats {
  totalUsers: number;
  adminUsers: number;
  customers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    adminUsers: 0,
    customers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Fetch all dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch users count
      let totalUsers = 0;
      let adminUsers = 0;
      let customers = 0;
      
      try {
        const usersResponse = await fetch('http://localhost:5000/api/users', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          const usersArray = Array.isArray(usersData) ? usersData : (usersData.data || []) as Array<{ role: string }>;
          totalUsers = usersArray.length;
          adminUsers = usersArray.filter((u: { role: string }) => u.role === 'admin').length;
          customers = totalUsers - adminUsers;
        }
      } catch (err) {
        console.error('Failed to fetch users:', err);
      }

      // ✅ Fetch products count
      let totalProducts = 0;
      try {
        const productsResponse = await fetch('http://localhost:5000/api/sarees', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          const productsArray = Array.isArray(productsData) ? productsData : (productsData.data || []);
          totalProducts = productsArray.length;
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
      }

      // ✅ Fetch orders and revenue
      let totalOrders = 0;
      let totalRevenue = 0;
      
      try {
        const ordersResponse = await fetch('http://localhost:5000/api/orders', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          const ordersArray = Array.isArray(ordersData) ? ordersData : (ordersData.data || []) as Array<{ totalAmount?: number; amount?: number }>;
          totalOrders = ordersArray.length;
          
          // Calculate total revenue from orders
          totalRevenue = ordersArray.reduce((sum: number, order: { totalAmount?: number; amount?: number }) => {
            const amount = order.totalAmount || order.amount || 0;
            return sum + amount;
          }, 0);
        }
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      }

      // Update state with all fetched data
      setStats({
        totalUsers,
        adminUsers,
        customers,
        totalProducts,
        totalOrders,
        totalRevenue,
      });
    } catch (err) {
      console.error('Dashboard stats error:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchDashboardStats();
    }
  }, [isAuthenticated, user]);

  // ✅ Redirect if not admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-lg text-muted-foreground mb-4">
            Access denied. Admin only.
          </p>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </Card>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'blue',
      trend: '+2.5%',
    },
    {
      label: 'Admin Users',
      value: stats.adminUsers,
      icon: Users,
      color: 'purple',
      trend: '+0%',
    },
    {
      label: 'Customers',
      value: stats.customers,
      icon: Users,
      color: 'green',
      trend: '+2.5%',
    },
    {
      label: 'Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'orange',
      trend: '+0%',
    },
    {
      label: 'Orders',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'red',
      trend: `+${stats.totalOrders}`,
    },
    {
      label: 'Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'green',
      trend: `+${stats.totalRevenue}`,
    },
  ];

  const quickActions = [
    {
      title: 'Manage Users',
      description: 'Promote users to admin, delete accounts, and manage roles',
      icon: Users,
      action: 'Go to Users',
      path: '/admin/users',
      color: 'blue',
    },
    {
      title: 'Manage Products',
      description: 'Add, edit, and delete products from your store',
      icon: Package,
      action: 'Go to Products',
      path: '/admin/sarees',
      color: 'orange',
    },
    {
      title: 'View Orders',
      description: 'Track and manage all customer orders',
      icon: ShoppingCart,
      action: 'Go to Orders',
      path: '/admin/orders',
      color: 'red',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: string } = {
      blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      purple:
        'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
      green:
        'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
      orange:
        'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
      red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header - Clean without duplicate buttons */}
      <div className="border-b bg-white dark:bg-slate-900 sticky top-0 z-10">
        <div className="container max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back,{' '}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {user?.name || 'Admin User'}
            </span>
          </h1>
          <p className="text-muted-foreground">
            Manage your store, users, products and orders from here
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-7xl mx-auto px-4 py-12">
        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
        >
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${getColorClasses(stat.color)}`}>
                      <Icon size={24} />
                    </div>
                    <span className="text-sm font-semibold text-green-600">
                      {stat.trend}
                    </span>
                  </div>
                  <h3 className="text-muted-foreground text-sm mb-1">
                    {stat.label}
                  </h3>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <Card className="p-8 border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:shadow-lg transition-all cursor-pointer group h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg ${getColorClasses(action.color)}`}>
                        <Icon size={24} />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold mb-2">{action.title}</h3>
                    <p className="text-muted-foreground text-sm mb-6">
                      {action.description}
                    </p>
                    <button
                      onClick={() => navigate(action.path)}
                      className="flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all"
                    >
                      {action.action}
                      <ArrowRight size={18} />
                    </button>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Refresh Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-12 flex justify-center"
        >
          <Button
            onClick={fetchDashboardStats}
            disabled={loading}
            className="gap-2"
          >
            {loading ? 'Loading...' : 'Refresh Statistics'}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;