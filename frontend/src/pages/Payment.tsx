import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Loader,
  Upload,
} from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";
import UPIScreenshotUpload from "@/components/UPIScreenshotUpload";
import { getUpiConfig, getPaymentStatus as getPaymentStatusApi } from "@/lib/api";

interface OrderItem {
  product: string;
  name: string;
  quantity: number;
  price: number;
}

interface PaymentState {
  orderId: string;
  totalAmount: number;
  items: OrderItem[];
  isLocalOrder?: boolean;
}

interface OcrResult {
  utr?: string;
  ocrConfidence?: number;
  utrDetected: boolean;
}

interface UpiConfigType {
  upiId: string;
  merchantName: string;
  qrCodeImage?: string;
  instructions?: string;
}

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [paymentState, setPaymentState] = useState<PaymentState | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<
    "loading" | "upi_upload" | "processing" | "verified" | "rejected"
  >("loading");
  const [upiConfig, setUpiConfig] = useState<UpiConfigType | null>(null);
  const [uploadResult, setUploadResult] = useState<OcrResult | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  // Load UPI Config on mount
  useEffect(() => {
    const loadUpiConfigData = async () => {
      try {
        setLoadingConfig(true);
        setConfigError(null);
        
        const response = await getUpiConfig();
        console.log("✅ UPI Config Response:", response);
        
        if (response && response.data) {
          setUpiConfig(response.data);
          console.log("✅ UPI Config loaded successfully:", response.data);
        } else {
          setConfigError("UPI configuration not available");
          console.error("No data in UPI config response");
        }
      } catch (error) {
        console.error("❌ Error loading UPI config:", error);
        setConfigError("Failed to load UPI configuration. Please refresh the page.");
      } finally {
        setLoadingConfig(false);
      }
    };

    loadUpiConfigData();
  }, []);

  // Initialize payment state from location
  useEffect(() => {
    const state = location.state as PaymentState | null;

    if (!state) {
      toast({
        title: "Error",
        description: "No order information provided",
        variant: "destructive",
      });
      navigate("/profile");
      return;
    }

    setPaymentState(state);

    // Check existing payment status
    const checkStatus = async () => {
      try {
        const statusResponse = await getPaymentStatusApi(state.orderId);
        
        if (statusResponse && statusResponse.data) {
          const paymentStatusData = statusResponse.data;
          
          if (paymentStatusData.status === "verified") {
            setPaymentStatus("verified");
          } else if (paymentStatusData.status === "rejected" || paymentStatusData.status === "failed") {
            setPaymentStatus("rejected");
          } else if (paymentStatusData.hasPayment) {
            setPaymentStatus("processing");
          } else {
            setPaymentStatus("upi_upload");
          }
        } else {
          setPaymentStatus("upi_upload");
        }
      } catch (error) {
        console.log("No existing payment found, starting fresh");
        setPaymentStatus("upi_upload");
      }
    };

    checkStatus();

    console.log("💳 Payment Page Loaded:");
    console.log("  - Order ID:", state.orderId);
    console.log("  - Total Amount:", state.totalAmount);
    console.log("  - Items:", state.items);
  }, [location, navigate, toast]);

  const handleUPIUpload = async (ocrResult: OcrResult) => {
    try {
      setUploadResult(ocrResult);
      setPaymentStatus("processing");

      toast({
        title: "✅ Payment Screenshot Uploaded",
        description: ocrResult.utrDetected
          ? `UTR extracted: ${ocrResult.utr}`
          : "Screenshot submitted for verification",
      });
    } catch (error) {
      console.error("Upload error:", error);
      setPaymentStatus("rejected");
      toast({
        title: "Upload Failed",
        description: "Failed to upload payment screenshot",
        variant: "destructive",
      });
    }
  };

  if (!paymentState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <AnimatedBackground />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Payment</h1>
          <p className="text-slate-400">Complete your purchase securely with UPI</p>
        </motion.div>

        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-slate-800 border-slate-700 p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Order Summary</h2>

            {/* Order ID */}
            <div className="mb-4 pb-4 border-b border-slate-700">
              <p className="text-slate-400 text-sm">Order ID</p>
              <p className="text-white font-mono text-lg">{paymentState.orderId}</p>
            </div>

            {/* Items */}
            <div className="mb-4 pb-4 border-b border-slate-700">
              <p className="text-slate-400 text-sm mb-3">Items</p>
              <div className="space-y-2">
                {paymentState.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-slate-300">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="text-white">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center">
              <span className="text-white font-semibold text-lg">Total Amount</span>
              <span className="text-purple-400 font-bold text-3xl">
                ₹{paymentState.totalAmount.toLocaleString()}
              </span>
            </div>
          </Card>
        </motion.div>

        {/* Config Loading Error */}
        {configError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-red-950/30 border-red-700/50 p-4 mb-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-100 mb-1">Configuration Error</h4>
                  <p className="text-red-200 text-sm">{configError}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* UPI Loading */}
        {loadingConfig && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-slate-800 border-slate-700 p-8 text-center">
              <Loader className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-3" />
              <p className="text-slate-300">Loading UPI configuration...</p>
            </Card>
          </motion.div>
        )}

        {/* UPI Payment Details Section */}
        {!loadingConfig && upiConfig && paymentStatus === "upi_upload" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* UPI Details Card */}
            <Card className="bg-slate-800 border-slate-700 p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">UPI Payment Details</h2>

              <div className="space-y-4">
                {/* Merchant Name */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase">
                    Merchant Name
                  </label>
                  <p className="text-white font-medium mt-1 text-lg">
                    {upiConfig.merchantName}
                  </p>
                </div>

                {/* UPI ID */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase">
                    UPI ID
                  </label>
                  <div className="flex gap-2 mt-2">
                    <div className="flex-1 bg-slate-700 rounded px-3 py-2">
                      <code className="text-white font-mono text-sm break-all">
                        {upiConfig.upiId}
                      </code>
                    </div>
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(upiConfig.upiId);
                        toast({
                          title: "✅ Copied!",
                          description: "UPI ID copied to clipboard",
                        });
                      }}
                      size="sm"
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:text-white"
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase">
                    Amount to Pay
                  </label>
                  <p className="text-2xl font-bold text-purple-400 mt-1">
                    ₹{paymentState.totalAmount}
                  </p>
                </div>

                {/* QR Code */}
                {upiConfig.qrCodeImage && (
                  <div className="pt-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase block mb-2">
                      Scan QR Code
                    </label>
                    <div className="bg-white p-3 rounded-lg w-fit mx-auto">
                      <img
                        src={upiConfig.qrCodeImage}
                        alt="UPI QR Code"
                        className="w-48 h-48 object-contain"
                        onError={(e) => {
                          console.error("QR code image failed to load");
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Instructions */}
            <Card className="bg-blue-950/30 border-blue-700/50 p-4 mb-6">
              <h4 className="font-semibold text-blue-100 mb-3">📱 How to Pay</h4>
              <ol className="text-blue-200 text-sm space-y-2 list-decimal list-inside">
                <li>Open any UPI app (Google Pay, PhonePe, Paytm, BHIM, etc.)</li>
                <li>Tap "Send Money" or "Pay"</li>
                <li>Scan the QR code above OR enter UPI ID: <code className="bg-slate-700 px-1 rounded">{upiConfig.upiId}</code></li>
                <li>Verify merchant: <strong>{upiConfig.merchantName}</strong></li>
                <li>Enter amount: <strong>₹{paymentState.totalAmount}</strong></li>
                <li>Complete the payment with your PIN</li>
                <li>Take a screenshot of the payment confirmation</li>
                <li>Upload the screenshot below</li>
              </ol>
            </Card>

            {/* Important Notes */}
            <Card className="bg-amber-950/30 border-amber-700/50 p-4 mb-6">
              <h4 className="font-semibold text-amber-100 mb-2">⚠️ Important</h4>
              <ul className="text-amber-200 text-sm space-y-1 list-disc list-inside">
                <li>Pay the exact amount: ₹{paymentState.totalAmount}</li>
                <li>Screenshot must clearly show payment confirmation</li>
                <li>We verify payments within 24 hours</li>
                <li>Keep your screenshot for reference</li>
              </ul>
            </Card>

            {/* Screenshot Upload */}
            <Card className="bg-slate-800 border-slate-700 p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                📸 Upload Payment Screenshot
              </h3>
              <UPIScreenshotUpload
                orderId={paymentState.orderId}
                amount={paymentState.totalAmount}
                onSuccess={handleUPIUpload}
                onError={(error) => {
                  toast({
                    title: "Upload Error",
                    description: error,
                    variant: "destructive",
                  });
                }}
              />
            </Card>

            {/* Security Notice */}
            <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <p className="text-slate-300 text-sm text-center">
                🔒 Your payment is secured with industry-standard encryption
              </p>
            </div>
          </motion.div>
        )}

        {/* Processing State */}
        {paymentStatus === "processing" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="bg-slate-800 border-slate-700 p-8 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="inline-block mb-4"
              >
                <Clock className="w-12 h-12 text-purple-600" />
              </motion.div>
              <p className="text-white text-lg font-semibold mb-2">
                ⏳ Verifying Payment
              </p>
              <p className="text-slate-400 mb-4">
                Your payment screenshot has been received. Our admin team will verify it shortly.
              </p>

              {uploadResult && (
                <div className="bg-slate-700/50 rounded p-4 text-left text-sm mb-4">
                  <p className="text-slate-300 mb-2">
                    <strong>Status:</strong> Pending Verification
                  </p>
                  {uploadResult.utrDetected && (
                    <p className="text-green-300">
                      <strong>✅ UTR Found:</strong> {uploadResult.utr}
                    </p>
                  )}
                  {!uploadResult.utrDetected && (
                    <p className="text-yellow-300">
                      <strong>⚠️ UTR:</strong> Will be manually verified
                    </p>
                  )}
                  <p className="text-slate-400 text-xs mt-2">
                    Check your order history for status updates
                  </p>
                </div>
              )}

              <Button
                onClick={() => navigate("/profile", { state: { activeTab: "orders" } })}
                className="bg-purple-600 hover:bg-purple-700"
              >
                View Order Status
              </Button>
            </Card>
          </motion.div>
        )}

        {/* Verified State */}
        {paymentStatus === "verified" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="bg-green-950/30 border-green-700/50 p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="inline-block mb-4"
              >
                <CheckCircle className="w-16 h-16 text-green-500" />
              </motion.div>
              <p className="text-white text-2xl font-bold mb-2">✅ Payment Verified!</p>
              <p className="text-green-200 mb-6">
                Your payment has been successfully verified. Your order is confirmed!
              </p>
              <Button
                onClick={() => navigate("/profile", { state: { activeTab: "orders" } })}
                className="bg-green-600 hover:bg-green-700"
              >
                View Order Details
              </Button>
            </Card>
          </motion.div>
        )}

        {/* Rejected State */}
        {paymentStatus === "rejected" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="bg-red-950/30 border-red-700/50 p-8 text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-white text-2xl font-bold mb-2">❌ Payment Rejected</p>
              <p className="text-red-200 mb-6">
                Your payment could not be verified. Please try again with a new screenshot.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => setPaymentStatus("upi_upload")}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Retry Payment
                </Button>
                <Button
                  onClick={() => navigate("/profile")}
                  variant="outline"
                  className="text-slate-300 border-slate-600"
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Payment;