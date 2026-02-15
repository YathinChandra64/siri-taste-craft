import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext"; // ✅ Fixed import
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, Upload, Eye, Image as ImageIcon } from "lucide-react";
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
  const [pendingOrders, setPendingOrders] = useState<PaymentOrder[]>([]); // ✅ Default empty array
  const [loading, setLoading] = useState(true);
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [showProofDialog, setShowProofDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PaymentOrder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [upiSettings, setUpiSettings] = useState<UpiSettings>({
    upiQrCode: "",
    upiId: ""
  });
  const [qrCodePreview, setQrCodePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingOrders();
    fetchUpiSettings();
  }, []);

  // ✅ Fixed: Ensure data is always an array
  const fetchPendingOrders = async () => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const response = await fetch("http://localhost:5000/api/orders", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // ✅ Ensure data is an array, filter for pending payments
        const orders = Array.isArray(data) ? data : [];
        const pending = orders.filter(o => o.status === "pending_payment" || o.status === "payment_submitted");
        setPendingOrders(pending);
      } else {
        console.error("Failed to fetch orders:", response.status);
        setPendingOrders([]); // ✅ Set empty array on error
      }
    } catch (error) {
      console.error("Failed to fetch pending orders:", error);
      setPendingOrders([]); // ✅ Set empty array on error
      toast({
        title: "Error",
        description: "Failed to load pending orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fixed: Fetch UPI config from new endpoint
  const fetchUpiSettings = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/upi/config");
      if (response.ok) {
        const data = await response.json();
        setUpiSettings({
          upiQrCode: data.qrCodeImage || "",
          upiId: data.upiId || ""
        });
        if (data.qrCodeImage) {
          setQrCodePreview(data.qrCodeImage);
        }
      }
    } catch (error) {
      console.error("Failed to fetch UPI settings:", error);
    }
  };

  // ✅ Handle QR Code File Upload
  const handleQrFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setQrCodePreview(base64);
      setUpiSettings(prev => ({
        ...prev,
        upiQrCode: base64
      }));
    };
    reader.readAsDataURL(file);
  };

  // ✅ Save UPI Settings
  const handleSaveUpiSettings = async () => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      
      const response = await fetch("http://localhost:5000/api/upi/admin/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          upiId: upiSettings.upiId,
          qrCodeImage: upiSettings.upiQrCode
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "UPI settings saved successfully!",
          variant: "default",
        });
        setShowQrDialog(false);
      } else {
        throw new Error("Failed to save UPI settings");
      }
    } catch (error) {
      console.error("Error saving UPI settings:", error);
      toast({
        title: "Error",
        description: "Failed to save UPI settings",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Handle Payment Verification
  const handleVerifyPayment = async (orderId: string, status: "confirmed" | "rejected") => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");

      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/verify-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Payment ${status === "confirmed" ? "confirmed" : "rejected"}!`,
        });
        fetchPendingOrders(); // Refresh list
        setShowProofDialog(false);
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      toast({
        title: "Error",
        description: "Failed to verify payment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user?.role || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-red-600">Access Denied. Admin privileges required.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <AnimatedBackground />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">💳 Payment Management</h1>
          <p className="text-slate-400">Manage pending payments and UPI configuration</p>
        </motion.div>

        {/* UPI Settings Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">UPI Configuration</h2>
              <Button
                onClick={() => setShowQrDialog(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Configure
              </Button>
            </div>

            {/* Current UPI Settings Display */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 text-sm">UPI ID</label>
                <p className="text-white font-mono">{upiSettings.upiId || "Not set"}</p>
              </div>
              <div>
                <label className="text-slate-400 text-sm">QR Code</label>
                <p className="text-white text-sm">{qrCodePreview ? "✅ Uploaded" : "❌ Not set"}</p>
              </div>
            </div>

            {qrCodePreview && (
              <div className="mt-4">
                <p className="text-slate-400 text-sm mb-2">Preview</p>
                <img src={qrCodePreview} alt="UPI QR Code" className="w-40 h-40 border border-slate-600 rounded" />
              </div>
            )}
          </Card>
        </motion.div>

        {/* Pending Orders Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-slate-800 border-slate-700">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-white">
                Pending Payments ({pendingOrders.length})
              </h2>
            </div>

            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              </div>
            ) : pendingOrders.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                No pending payments
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-slate-700 bg-slate-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-white">Customer</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-white">Amount</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-white">Reference</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-white">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-white">Date</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-white">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingOrders.map((order, index) => (
                      <motion.tr
                        key={order._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="text-white font-medium">{order.user?.name || "N/A"}</div>
                          <div className="text-slate-400 text-sm">{order.user?.email || "N/A"}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white font-semibold">₹{order.totalAmount.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-300 font-mono text-sm">{order.paymentReference || "—"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
                            order.status === "confirmed" ? "bg-green-600/20 text-green-400" :
                            order.status === "payment_rejected" ? "bg-red-600/20 text-red-400" :
                            "bg-yellow-600/20 text-yellow-400"
                          }`}>
                            {order.status === "confirmed" ? <CheckCircle className="w-4 h-4" /> :
                             order.status === "payment_rejected" ? <XCircle className="w-4 h-4" /> :
                             <Clock className="w-4 h-4" />}
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-sm">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          {order.status === "payment_submitted" && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowProofDialog(true);
                              }}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Review
                            </Button>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* UPI Settings Dialog */}
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Configure UPI Settings</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update your UPI ID and QR code
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* UPI ID Input */}
            <div>
              <label className="text-white text-sm font-medium block mb-2">UPI ID</label>
              <Input
                value={upiSettings.upiId}
                onChange={(e) => setUpiSettings(prev => ({
                  ...prev,
                  upiId: e.target.value
                }))}
                placeholder="e.g., siri@upi"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            {/* QR Code Upload */}
            <div>
              <label className="text-white text-sm font-medium block mb-2">QR Code Image</label>
              <div className="flex gap-2">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleQrFileUpload}
                    className="hidden"
                  />
                  <div className="bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded px-4 py-2 text-white text-center transition">
                    <ImageIcon className="w-4 h-4 inline mr-2" />
                    Upload Image
                  </div>
                </label>
              </div>
            </div>

            {/* Preview */}
            {qrCodePreview && (
              <div className="p-4 bg-white rounded">
                <img src={qrCodePreview} alt="QR Code Preview" className="w-full max-w-40 mx-auto" />
              </div>
            )}

            {/* Save Button */}
            <Button
              onClick={handleSaveUpiSettings}
              disabled={isSubmitting}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Proof Dialog */}
      <Dialog open={showProofDialog} onOpenChange={setShowProofDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Review Payment Proof</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Order Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm">Customer</p>
                  <p className="text-white font-semibold">{selectedOrder.user?.name}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Amount</p>
                  <p className="text-white font-semibold">₹{selectedOrder.totalAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Reference</p>
                  <p className="text-white font-mono text-sm">{selectedOrder.paymentReference}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Date</p>
                  <p className="text-white">{new Date(selectedOrder.paymentSubmittedAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Payment Proof Image */}
              {selectedOrder.paymentProof && (
                <div>
                  <p className="text-slate-400 text-sm mb-2">Payment Proof</p>
                  <img
                    src={selectedOrder.paymentProof}
                    alt="Payment Proof"
                    className="w-full max-h-80 object-contain border border-slate-600 rounded"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => handleVerifyPayment(selectedOrder._id, "confirmed")}
                  disabled={isSubmitting}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Payment
                </Button>
                <Button
                  onClick={() => handleVerifyPayment(selectedOrder._id, "rejected")}
                  disabled={isSubmitting}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPayments;