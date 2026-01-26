import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, Upload, Eye } from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PaymentOrder {
  _id: string;
  user: {
    name: string;
    email: string;
    phone: string;
  };
  totalAmount: number;
  status: string;
  paymentReference: string;
  paymentProof: string;
  paymentSubmittedAt: string;
  createdAt: string;
}

interface UpiSettings {
  upiQrCode: string;
  upiId: string;
}

const AdminPayments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendingOrders, setPendingOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [showProofDialog, setShowProofDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PaymentOrder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [upiSettings, setUpiSettings] = useState<UpiSettings>({
    upiQrCode: "",
    upiId: ""
  });

  useEffect(() => {
    fetchPendingOrders();
    fetchUpiSettings();
  }, []);

  const fetchPendingOrders = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:5000/api/payments/pending-orders", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPendingOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch pending orders:", error);
      toast({
        title: "Error",
        description: "Failed to load pending orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUpiSettings = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/payments/upi-qr");
      if (response.ok) {
        const data = await response.json();
        setUpiSettings(data);
      }
    } catch (error) {
      console.error("Failed to fetch UPI settings:", error);
    }
  };

  const handleUploadQr = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:5000/api/payments/upload-qr", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(upiSettings)
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: "UPI QR code updated successfully",
        });
        setShowQrDialog(false);
        fetchUpiSettings();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to upload QR code",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Upload QR error:", error);
      toast({
        title: "Error",
        description: "Failed to upload QR code",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyPayment = async (orderId: string, isVerified: boolean) => {
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:5000/api/payments/verify-payment", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          isVerified
        })
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: isVerified 
            ? "✅ Payment verified! Customer notification sent."
            : "❌ Payment rejected! Customer notification sent.",
        });
        fetchPendingOrders();
        setShowProofDialog(false);
        setSelectedOrder(null);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to verify payment",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Verify payment error:", error);
      toast({
        title: "Error",
        description: "Failed to verify payment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'payment_submitted': return 'bg-yellow-100 text-yellow-700';
      case 'pending_payment': return 'bg-orange-100 text-orange-700';
      case 'payment_rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'confirmed': return <CheckCircle size={16} />;
      case 'payment_submitted': return <Clock size={16} />;
      case 'pending_payment': return <Clock size={16} />;
      case 'payment_rejected': return <XCircle size={16} />;
      default: return <Clock size={16} />;
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
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="px-4 py-1 rounded-full bg-purple-100 dark:bg-purple-900">
              <span className="text-sm font-bold text-purple-700 dark:text-purple-200">PAYMENT MANAGEMENT</span>
            </div>
          </div>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">Payment Verification</h1>
              <p className="text-muted-foreground">Verify customer payments and manage UPI settings</p>
            </div>
            <Button
              onClick={() => setShowQrDialog(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Upload size={18} className="mr-2" />
              Update UPI QR Code
            </Button>
          </div>
        </motion.div>

        {/* Current UPI Settings */}
        {upiSettings.upiQrCode && (
          <Card className="mb-8 p-6 shadow-card">
            <h2 className="text-xl font-bold mb-4">Current UPI Settings</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {upiSettings.upiQrCode && (
                <div>
                  <p className="text-sm font-semibold mb-2">QR Code:</p>
                  <img 
                    src={upiSettings.upiQrCode} 
                    alt="UPI QR" 
                    className="w-48 h-48 border rounded-lg"
                  />
                </div>
              )}
              {upiSettings.upiId && (
                <div className="flex items-center">
                  <div>
                    <p className="text-sm font-semibold mb-2">UPI ID:</p>
                    <p className="text-lg font-mono bg-muted p-3 rounded">{upiSettings.upiId}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Pending Payments */}
        <Card className="shadow-card">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold">Pending Payments ({pendingOrders.length})</h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
              />
            </div>
          ) : pendingOrders.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
              <p className="text-muted-foreground">All payments verified!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Customer</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Reference</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOrders.map((order, index) => (
                    <motion.tr
                      key={order._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold">{order.user.name}</p>
                          <p className="text-sm text-muted-foreground">{order.user.email}</p>
                          <p className="text-sm text-muted-foreground">{order.user.phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-lg">₹{order.totalAmount.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-mono text-sm bg-muted px-2 py-1 rounded w-fit">
                          {order.paymentReference}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {order.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(order.paymentSubmittedAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowProofDialog(true);
                          }}
                        >
                          <Eye size={16} className="mr-1" />
                          Review
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Update UPI QR Dialog */}
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update UPI Payment Details</DialogTitle>
            <DialogDescription>Upload your UPI QR code and ID</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadQr} className="space-y-4">
            <div>
              <label className="text-sm font-medium">UPI QR Code URL *</label>
              <Input
                value={upiSettings.upiQrCode}
                onChange={(e) => setUpiSettings({...upiSettings, upiQrCode: e.target.value})}
                placeholder="https://imgur.com/..."
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Upload QR code image to imgur or similar and paste URL
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">UPI ID *</label>
              <Input
                value={upiSettings.upiId}
                onChange={(e) => setUpiSettings({...upiSettings, upiId: e.target.value})}
                placeholder="yourname@upi"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? "Updating..." : "Update Settings"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payment Proof Review Dialog */}
      {selectedOrder && (
        <Dialog open={showProofDialog} onOpenChange={setShowProofDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Review Payment Proof</DialogTitle>
              <DialogDescription>
                Order: {selectedOrder._id.slice(-8).toUpperCase()} | Customer: {selectedOrder.user.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Customer Details */}
              <div>
                <h3 className="font-semibold mb-2">Customer Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-semibold">{selectedOrder.user.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-semibold">{selectedOrder.user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-semibold">{selectedOrder.user.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-semibold">₹{selectedOrder.totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div>
                <h3 className="font-semibold mb-2">Payment Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Reference Number</p>
                    <p className="font-mono font-semibold">{selectedOrder.paymentReference}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Submitted</p>
                    <p className="font-semibold">
                      {new Date(selectedOrder.paymentSubmittedAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Proof Image */}
              {selectedOrder.paymentProof && (
                <div>
                  <h3 className="font-semibold mb-2">Payment Screenshot</h3>
                  <img 
                    src={selectedOrder.paymentProof} 
                    alt="Payment proof" 
                    className="w-full max-h-96 object-contain border rounded-lg"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => handleVerifyPayment(selectedOrder._id, true)}
                  disabled={isSubmitting}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle size={18} className="mr-2" />
                  Verify Payment ✅
                </Button>
                <Button
                  onClick={() => handleVerifyPayment(selectedOrder._id, false)}
                  disabled={isSubmitting}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle size={18} className="mr-2" />
                  Reject Payment ❌
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                ℹ️ Customer will see an in-app notification after verification
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminPayments;