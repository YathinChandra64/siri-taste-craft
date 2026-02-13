import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle, Truck, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Order } from '@/types/profile';

interface AdminOrderUpdateModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updatedOrder: Order) => void;
}

const ORDER_STATUSES = [
  { value: 'CREATED', label: '📦 Created', color: 'bg-gray-100' },
  { value: 'PENDING_PAYMENT', label: '💳 Pending Payment', color: 'bg-yellow-100' },
  { value: 'PLACED', label: '✓ Placed', color: 'bg-blue-100' },
  { value: 'CONFIRMED', label: '✅ Confirmed', color: 'bg-blue-100' },
  { value: 'PROCESSING', label: '⚙️ Processing', color: 'bg-orange-100' },
  { value: 'PACKED', label: '📦 Packed', color: 'bg-orange-100' },
  { value: 'SHIPPED', label: '🚚 Shipped', color: 'bg-purple-100' },
  { value: 'IN_TRANSIT', label: '🚛 In Transit', color: 'bg-purple-100' },
  { value: 'OUT_FOR_DELIVERY', label: '📍 Out for Delivery', color: 'bg-blue-100' },
  { value: 'DELIVERED', label: '🏠 Delivered', color: 'bg-green-100' },
  { value: 'CANCELLED', label: '❌ Cancelled', color: 'bg-red-100' },
  { value: 'RETURNED', label: '↩️ Returned', color: 'bg-red-100' },
];

const COURIER_OPTIONS = [
  { value: 'DHL', label: '🟡 DHL' },
  { value: 'Fedex', label: '🟣 Fedex' },
  { value: 'DTDC', label: '🔵 DTDC' },
  { value: 'BlueDart', label: '🔴 Blue Dart' },
  { value: 'Ecom Express', label: '🟢 Ecom Express' },
  { value: 'India Post', label: '🔴 India Post' },
  { value: 'Other', label: '⚫ Other' },
];

export const AdminOrderUpdateModal = ({
  order,
  isOpen,
  onClose,
  onSuccess,
}: AdminOrderUpdateModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [shipper, setShipper] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [trackingUrl, setTrackingUrl] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Initialize form when order changes
  useEffect(() => {
    if (order) {
      setNewStatus(order.orderStatus || order.status || '');
      setDescription('');
      setShipper(order.shipping?.shipper || '');
      setTrackingNumber(order.shipping?.trackingNumber || '');
      setTrackingUrl(order.shipping?.trackingUrl || '');
      setLocation('');
      setEstimatedDeliveryDate(
        order.shipping?.estimatedDeliveryDate
          ? new Date(order.shipping.estimatedDeliveryDate).toISOString().split('T')[0]
          : ''
      );
      setNotes('');
    }
  }, [order]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newStatus) {
      toast({
        title: 'Error',
        description: 'Please select a status',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders/${order?._id}/status-timeline`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            orderStatus: newStatus,
            description: description || `Order status updated to ${newStatus}`,
            shipper: shipper || undefined,
            trackingNumber: trackingNumber || undefined,
            trackingUrl: trackingUrl || undefined,
            location: location || undefined,
            estimatedDeliveryDate: estimatedDeliveryDate || undefined,
            notes: notes || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update order');
      }

      toast({
        title: 'Success',
        description: 'Order status updated successfully',
      });

      if (onSuccess) {
        onSuccess(data.order);
      }

      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update order',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const currentStatusLabel = ORDER_STATUSES.find(
    (s) => s.value === (order?.orderStatus || order?.status)
  )?.label || 'Unknown';

  const selectedStatusLabel = ORDER_STATUSES.find(
    (s) => s.value === newStatus
  )?.label || 'Select Status';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Order Status</DialogTitle>
          <DialogDescription>
            Order #{order?._id.slice(-8).toUpperCase()}
          </DialogDescription>
        </DialogHeader>

        {order && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Current Order Info */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-sm">Current Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Order Date</p>
                    <p className="font-semibold">
                      {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Current Status</p>
                    <Badge>{currentStatusLabel}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Amount</p>
                    <p className="font-semibold">₹{order.totalAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Customer</p>
                    <p className="font-semibold">
                      {typeof order.user === 'string'
                        ? order.user
                        : order.user?.name || 'Unknown'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Update Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Status Selection */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-2"
              >
                <label className="text-sm font-medium">
                  New Status <span className="text-red-500">*</span>
                </label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-2"
              >
                <label className="text-sm font-medium">Status Description</label>
                <Input
                  type="text"
                  placeholder="e.g., Order shipped from warehouse"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </motion.div>

              {/* Shipping Details Section */}
              {['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(
                newStatus
              ) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-4 border-t pt-4"
                >
                  <h3 className="font-semibold flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Shipping Details
                  </h3>

                  {/* Courier Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Courier Service</label>
                    <Select value={shipper} onValueChange={setShipper}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select courier" />
                      </SelectTrigger>
                      <SelectContent>
                        {COURIER_OPTIONS.map((courier) => (
                          <SelectItem key={courier.value} value={courier.value}>
                            {courier.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tracking Number */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tracking Number</label>
                    <Input
                      type="text"
                      placeholder="e.g., DHL123456789"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                    />
                  </div>

                  {/* Tracking URL */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tracking URL</label>
                    <Input
                      type="url"
                      placeholder="https://track.courier.com/..."
                      value={trackingUrl}
                      onChange={(e) => setTrackingUrl(e.target.value)}
                    />
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Current Location</label>
                    <Input
                      type="text"
                      placeholder="e.g., Hyderabad Hub"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>

                  {/* Estimated Delivery */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Estimated Delivery Date
                    </label>
                    <Input
                      type="date"
                      value={estimatedDeliveryDate}
                      onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                    />
                  </div>
                </motion.div>
              )}

              {/* Additional Notes */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <label className="text-sm font-medium">Internal Notes</label>
                <Input
                  type="text"
                  placeholder="Internal notes (not visible to customer)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </motion.div>

              {/* Preview Card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="border-t pt-4"
              >
                <p className="text-sm font-medium mb-3">Preview (Customer Will See)</p>
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Status: <strong>{selectedStatusLabel}</strong></span>
                      </div>
                      {description && (
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                          <span>{description}</span>
                        </div>
                      )}
                      {shipper && (
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-purple-600" />
                          <span>Shipping: {shipper} - {trackingNumber}</span>
                        </div>
                      )}
                      {estimatedDeliveryDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-orange-600" />
                          <span>Est. Delivery: {new Date(estimatedDeliveryDate).toLocaleDateString('en-IN')}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex gap-3 border-t pt-4"
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !newStatus}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Order Status'
                  )}
                </Button>
              </motion.div>
            </form>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminOrderUpdateModal;