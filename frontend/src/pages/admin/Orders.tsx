import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Eye,
  ChevronDown,
  Search,
  Package,
  Clock,
  Truck,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Order {
  _id: string;
  orderNumber?: string;
  status: string;
  customer: {
    name: string;
    email: string;
  };
  totalAmount: number;
  amount?: number;
  items: Array<{ quantity: number }>;
  paymentMethod: string;
  createdAt: string;
  isExpanded?: boolean;
}

interface OrderStats {
  totalOrders: number;
  pendingPayment: number;
  shipped: number;
  totalRevenue: number;
}

const Orders = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    pendingPayment: 0,
    shipped: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // ✅ Fetch orders with proper data
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/orders', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const ordersData = Array.isArray(data) ? data : (data.data || []) as Order[];
        
        setOrders(
          ordersData.map((order) => ({
            ...order,
            isExpanded: false,
          }))
        );

        // ✅ Calculate stats properly
        const totalOrders = ordersData.length;
        const pendingPayment = ordersData.filter(
          (o: Order) => o.status === 'pending' || o.status === 'created'
        ).length;
        const shipped = ordersData.filter(
          (o: Order) => o.status === 'shipped' || o.status === 'delivered'
        ).length;

        // ✅ FIXED: Calculate revenue correctly
        const totalRevenue = ordersData.reduce((sum: number, order: Order) => {
          const amount = order.totalAmount || order.amount || 0;
          return sum + (Number(amount) || 0);
        }, 0);

        setStats({
          totalOrders,
          pendingPayment,
          shipped,
          totalRevenue,
        });
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchOrders();
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

  // Filter orders based on search and status
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || order.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'delivered' || statusLower === 'shipped')
      return 'bg-green-100/50 dark:bg-green-900/20 text-green-700 dark:text-green-400';
    if (statusLower === 'pending' || statusLower === 'created')
      return 'bg-yellow-100/50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400';
    if (statusLower === 'cancelled')
      return 'bg-red-100/50 dark:bg-red-900/20 text-red-700 dark:text-red-400';
    return 'bg-blue-100/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400';
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'delivered') return <Truck size={16} />;
    if (statusLower === 'pending' || statusLower === 'created') return <Clock size={16} />;
    if (statusLower === 'shipped') return <Package size={16} />;
    return <Clock size={16} />;
  };

  const toggleOrderExpand = (orderId: string) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order._id === orderId
          ? { ...order, isExpanded: !order.isExpanded }
          : order
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="border-b bg-white dark:bg-slate-900 sticky top-0 z-10">
        <div className="container max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-2">Orders Management</h1>
          <p className="text-muted-foreground">Manage and track all customer orders</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {/* Total Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <Card className="p-6 border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                  <Package size={24} />
                </div>
              </div>
              <h3 className="text-muted-foreground text-sm mb-1">Total Orders</h3>
              <p className="text-3xl font-bold">{stats.totalOrders}</p>
            </Card>
          </motion.div>

          {/* Pending Payment */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400">
                  <Clock size={24} />
                </div>
              </div>
              <h3 className="text-muted-foreground text-sm mb-1">Pending Payment</h3>
              <p className="text-3xl font-bold">{stats.pendingPayment}</p>
            </Card>
          </motion.div>

          {/* Shipped */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                  <Truck size={24} />
                </div>
              </div>
              <h3 className="text-muted-foreground text-sm mb-1">Shipped</h3>
              <p className="text-3xl font-bold">{stats.shipped}</p>
            </Card>
          </motion.div>

          {/* Total Revenue - ✅ FIXED */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6 border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                  <DollarSign size={24} />
                </div>
              </div>
              <h3 className="text-muted-foreground text-sm mb-1">Total Revenue</h3>
              <p className="text-3xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p>
            </Card>
          </motion.div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8 flex flex-col sm:flex-row gap-4"
        >
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-3.5 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder="Search by order ID, customer name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-primary appearance-none pr-10 dark:text-white cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="created">Created</option>
              <option value="pending">Pending</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <ChevronDown
              size={18}
              className="absolute right-3 top-3.5 pointer-events-none text-muted-foreground"
            />
          </div>
        </motion.div>

        {/* Orders List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          {loading ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Loading orders...</p>
            </Card>
          ) : filteredOrders.length === 0 ? (
            <Card className="p-8 text-center">
              <Package size={40} className="mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No orders found</p>
            </Card>
          ) : (
            filteredOrders.map((order, index) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Order Header */}
                  <div
                    className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                    onClick={() => toggleOrderExpand(order._id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg">
                          Order #{order.orderNumber || order._id.slice(-6).toUpperCase()}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusIcon(order.status)}
                          {order.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Order Details - Responsive Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Customer</p>
                          <p className="font-semibold text-foreground">
                            {order.customer.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Email</p>
                          <p className="font-semibold text-foreground truncate">
                            {order.customer.email}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Amount</p>
                          <p className="font-bold text-green-600 dark:text-green-400 text-lg">
                            ₹{((order.totalAmount || order.amount) || 0).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Items</p>
                          <p className="font-semibold text-foreground">
                            {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Payment</p>
                          <p className="font-semibold text-foreground">
                            {order.paymentMethod || 'COD'}
                          </p>
                        </div>
                      </div>

                      {/* Date */}
                      <p className="text-xs text-muted-foreground mt-3">
                        Placed on: {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Expand Icon */}
                    <button className="ml-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                      <Eye size={20} className="text-muted-foreground" />
                    </button>
                  </div>

                  {/* Expanded Details */}
                  {order.isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/20 p-6 space-y-4"
                    >
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-bold mb-3">Order Information</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Order ID:</span>
                              <span className="font-semibold">{order._id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Status:</span>
                              <span className="font-semibold capitalize">
                                {order.status}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Payment Method:</span>
                              <span className="font-semibold">
                                {order.paymentMethod || 'COD'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-bold mb-3">Amount Details</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total Amount:</span>
                              <span className="font-bold text-green-600 dark:text-green-400">
                                ₹{((order.totalAmount || order.amount) || 0).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Items:</span>
                              <span className="font-semibold">
                                {order.items?.length || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-slate-800">
                        <Button className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg">
                          Update Status
                        </Button>
                        <Button variant="outline" className="flex-1 rounded-lg">
                          View Details
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Refresh Button */}
        <div className="mt-8 flex justify-center">
          <Button onClick={fetchOrders} disabled={loading} className="gap-2">
            {loading ? 'Loading...' : 'Refresh Orders'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Orders;