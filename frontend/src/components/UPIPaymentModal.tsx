import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Download, CheckCircle } from "lucide-react";

const UPIPaymentModal = ({ isOpen, onClose, orderId, totalAmount }) => {
  const [upiConfig, setUpiConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upiReference, setUpiReference] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [paymentImage, setPaymentImage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchUPIConfig();
    }
  }, [isOpen]);

  const fetchUPIConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/upi/config");
      const data = await response.json();
      setUpiConfig(data);
    } catch (error) {
      console.error("Error fetching UPI config:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUPI = () => {
    if (upiConfig?.upiId) {
      navigator.clipboard.writeText(upiConfig.upiId);
      alert("UPI ID copied! 📋");
    }
  };

  const handleDownloadQR = () => {
    if (upiConfig?.qrCodeImage) {
      const link = document.createElement("a");
      link.href = upiConfig.qrCodeImage;
      link.download = "upi-qr.png";
      link.click();
    }
  };

  const handleSubmitPayment = async () => {
    if (!upiReference.trim()) {
      alert("Please enter UPI reference number");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/orders/${orderId}/submit-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            paymentReference: upiReference.trim(),
            paymentMethod: "upi"
          })
        }
      );

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          onClose();
          window.location.href = "/profile";
        }, 3000);
      } else {
        alert("Error submitting payment");
      }
    } catch (error) {
      console.error("Error submitting payment:", error);
      alert("Failed to submit payment");
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!upiConfig) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <p className="text-red-400">Failed to load UPI configuration</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">💳 Complete UPI Payment</DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <p className="text-white font-semibold mb-2">Payment Submitted!</p>
            <p className="text-slate-400 text-sm">
              We've received your payment details. Please wait for confirmation.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Order Details */}
            <div className="bg-slate-700 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-1">Amount to Pay</p>
              <p className="text-3xl font-bold text-purple-400">₹{totalAmount}</p>
            </div>

            {/* QR Code */}
            {upiConfig.qrCodeImage && (
              <div>
                <p className="text-slate-300 font-semibold mb-3">Scan QR Code</p>
                <div className="bg-white p-4 rounded-lg flex justify-center">
                  <img
                    src={upiConfig.qrCodeImage}
                    alt="UPI QR Code"
                    className="w-40 h-40 object-contain"
                  />
                </div>
                <button
                  onClick={handleDownloadQR}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition"
                >
                  <Download className="w-4 h-4" />
                  Download QR Code
                </button>
              </div>
            )}

            {/* UPI ID */}
            <div>
              <p className="text-slate-300 font-semibold mb-3">Or Use UPI ID</p>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={upiConfig.upiId}
                  disabled
                  className="bg-slate-700 border-slate-600 text-white font-mono"
                />
                <Button
                  onClick={handleCopyUPI}
                  className="bg-slate-700 hover:bg-slate-600 text-white"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Payment Reference Input */}
            <div>
              <label className="text-slate-300 font-semibold block mb-2">
                UPI Reference Number
              </label>
              <p className="text-slate-400 text-sm mb-2">
                After paying, enter the UPI reference ID shown in your payment app:
              </p>
              <Input
                type="text"
                placeholder="e.g., UPI123456789"
                value={upiReference}
                onChange={(e) => setUpiReference(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
              />
            </div>

            {/* Instructions */}
            <div className="bg-blue-600/20 border border-blue-600/50 rounded-lg p-3">
              <p className="text-blue-300 text-sm">
                ℹ️ Please complete the payment using the UPI ID or QR code. Once done, paste the reference ID below and submit.
              </p>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmitPayment}
              disabled={!upiReference.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold"
            >
              Submit Payment
            </Button>

            {/* Cancel Button */}
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UPIPaymentModal;