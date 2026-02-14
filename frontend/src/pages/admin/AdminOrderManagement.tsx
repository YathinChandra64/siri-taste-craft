import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Search, Package, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Order } from '@/types/profile';
import AdminOrderUpdateModal from '@/components/admin/AdminOrderUpdateModal';

interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  shipped: number;
  delivered: number;
}

export const AdminOrderManagement = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Fetch all orders
  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter orders when search or status filter changes
  useEffect(() => {
    let filtered = orders;

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(
        (order) => (order.orderStatus || order.status) === statusFilter
      );
    }

    // Filter by search term (order ID or customer name)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order._id.toLowerCase().includes(searchLower) ||
          (typeof order.user === 'string'
            ? order.user.toLowerCase().includes(searchLower)
            : order.user?.name?.toLowerCase().includes(searchLower))
      );
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders/admin/all`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.orders || []);

      // Calculate stats
      const newStats: OrderStats = {
        total: data.orders?.length || 0,
        pending: data.orders?.filter(
          (o: Order) =>
            ['PENDING_PAYMENT', 'CREATED', 'PLACED'].includes(
              o.orderStatus?.toUpperCase() || o.status?.toUpperCase() || ''
            )
        ).length || 0,
        confirmed: data.orders?.filter(
          (o: Order) =>
            (o.orderStatus?.toUpperCase() || o.status?.toUpperCase()) === 'CONFIRMED'
        ).length || 0,
        shipped: data.orders?.filter(
          (o: Order) =>
            (o.orderStatus?.toUpperCase() || o.status?.toUpperCase()) === 'SHIPPED'
        ).length || 0,
        delivered: data.orders?.filter(
          (o: Order) =>
            (o.orderStatus?.toUpperCase() || o.status?.toUpperCase()) === 'DELIVERED'
        ).length || 0,
      };

      setStats(newStats);
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to fetch orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsUpdateModalOpen(true);
  };

  const handleUpdateSuccess = (updatedOrder: Order) => {
    setOrders(
      orders.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
    );
    setIsUpdateModalOpen(false);
    toast({
      title: 'Success',
      description: 'Order updated successfully',
    });
  };

  const getStatusColor = (status: string) => {
    const statusUpper = status?.toUpperCase() || '';
    switch (statusUpper) {
      case 'PENDING_PAYMENT':
      case 'CREATED':
      case 'PLACED':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      case 'PACKED':
      case 'SHIPPED':
      case 'IN_TRANSIT':
        return 'bg-purple-100 text-purple-800';
      case 'OUT_FOR_DELIVERY':
        return 'bg-orange-100 text-orange-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
      case 'RETURNED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    const statusUpper = status?.toUpperCase() || '';
    switch (statusUpper) {
      case 'PENDING_PAYMENT':
      case 'CREATED':
        return '⏳';
      case 'PLACED':
        return '📦';
      case 'CONFIRMED':
        return '✅';
      case 'PROCESSING':
        return '⚙️';
      case 'PACKED':
        return '📦';
      case 'SHIPPED':
        return '🚚';
      case 'IN_TRANSIT':
        return '🚛';
      case 'OUT_FOR_DELIVERY':
        return '📍';
      case 'DELIVERED':
        return '🏠';
      case 'CANCELLED':
        return '❌';
      case 'RETURNED':
        return '↩️';
      default:
        return '📋';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold">Order Management</h1>
        <p className="text-muted-foreground">Update order status and shipping details</p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-4"
      >
        {[
          { label: 'Total Orders', value: stats.total, icon: Package, color: 'blue' },
          { label: 'Pending', value: stats.pending, icon: Loader2, color: 'yellow' },
          { label: 'Confirmed', value: stats.confirmed, icon: Package, color: 'purple' },
          { label: 'Shipped', value: stats.shipped, icon: TrendingUp, color: 'orange' },
          { label: 'Delivered', value: stats.delivered, icon: Package, color: 'green' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <Icon className={`w-8 h-8 text-${stat.color}-500`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex gap-4 flex-wrap"
      >
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by Order ID or Customer Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="PENDING_PAYMENT">Pending Payment</SelectItem>
            <SelectItem value="PLACED">Placed</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
            <SelectItem value="PACKED">Packed</SelectItem>
            <SelectItem value="SHIPPED">Shipped</SelectItem>
            <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
            <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchOrders}>
          Refresh
        </Button>
      </motion.div>

      {/* Orders Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>
              Orders ({filteredOrders.length} of {orders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No orders found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order._id}>
                        <TableCell className="font-mono text-sm">
                          #{order._id.slice(-8).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          {typeof order.user === 'string'
                            ? order.user
                            : order.user?.name || 'Unknown'}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ₹{order.totalAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.orderStatus || order.status)}>
                            {getStatusIcon(order.orderStatus || order.status)}{' '}
                            {order.orderStatus || order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(order.createdAt).toLocaleDateString('en-IN')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateOrder(order)}
                          >
                            Update
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Update Modal */}
      <AdminOrderUpdateModal
        order={selectedOrder}
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onSuccess={handleUpdateSuccess}
      />
    </div>
  );
};

export default AdminOrderManagement;