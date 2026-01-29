import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";

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

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [paymentState, setPaymentState] = useState<PaymentState | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi" | "wallet">("upi");
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "processing" | "success" | "failed">("pending");

  useEffect(() => {
    // Get payment data from navigation state
    const state = location.state as PaymentState | null;
    
    if (!state) {
      toast({
        title: "Error",
        description: "No order information provided",
        variant: "destructive"
      });
      navigate("/profile");
      return;
    }

    setPaymentState(state);
    console.log("💳 Payment Page Loaded:");
    console.log("  - Order ID:", state.orderId);
    console.log("  - Total Amount:", state.totalAmount);
    console.log("  - Items:", state.items);
    console.log("  - Is Local Order:", state.isLocalOrder);
  }, [location, navigate, toast]);

  const handlePayment = async () => {
    if (!paymentState) return;

    try {
      setProcessing(true);
      setPaymentStatus("processing");

      // Simulate payment processing
      console.log("💳 Processing payment:");
      console.log("  - Amount: ₹" + paymentState.totalAmount);
      console.log("  - Method:", paymentMethod);
      console.log("  - Order ID:", paymentState.orderId);

      // In real implementation, this would call payment gateway API
      // For now, simulate 2 second payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // If local order, mark it as processed
      if (paymentState.isLocalOrder) {
        const tempOrder = localStorage.getItem("tempOrder");
        if (tempOrder) {
          localStorage.removeItem("tempOrder");
          console.log("✅ Local order processed and cleared");
        }
      }

      setPaymentStatus("success");
      
      toast({
        title: "Payment Successful! 🎉",
        description: `Order #${paymentState.orderId.slice(-6)} payment confirmed`,
      });

      // Redirect to order confirmation after 3 seconds
      setTimeout(() => {
        navigate("/profile", { state: { activeTab: "orders" } });
      }, 3000);

    } catch (error) {
      console.error("Payment error:", error);
      setPaymentStatus("failed");
      
      toast({
        title: "Payment Failed",
        description: "Please try again or contact support",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  if (!paymentState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
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
          <p className="text-slate-400">Complete your purchase securely</p>
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
                    <span className="text-white">₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center">
              <span className="text-white font-semibold text-lg">Total Amount</span>
              <span className="text-purple-400 font-bold text-3xl">₹{paymentState.totalAmount.toLocaleString()}</span>
            </div>
          </Card>
        </motion.div>

        {/* Payment Method Selection */}
        {paymentStatus === "pending" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-slate-800 border-slate-700 p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">Payment Method</h2>
              
              <div className="space-y-3">
                {/* UPI */}
                <label className="flex items-center p-4 border-2 border-slate-700 rounded-lg cursor-pointer hover:border-purple-600 transition"
                  style={{ borderColor: paymentMethod === "upi" ? "#a855f7" : "" }}>
                  <input
                    type="radio"
                    name="payment"
                    value="upi"
                    checked={paymentMethod === "upi"}
                    onChange={(e) => setPaymentMethod(e.target.value as "upi")}
                    className="w-4 h-4 mr-3"
                  />
                  <div>
                    <p className="text-white font-semibold">UPI</p>
                    <p className="text-slate-400 text-sm">Google Pay, PhonePe, Paytm</p>
                  </div>
                </label>

                {/* Card */}
                <label className="flex items-center p-4 border-2 border-slate-700 rounded-lg cursor-pointer hover:border-purple-600 transition"
                  style={{ borderColor: paymentMethod === "card" ? "#a855f7" : "" }}>
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === "card"}
                    onChange={(e) => setPaymentMethod(e.target.value as "card")}
                    className="w-4 h-4 mr-3"
                  />
                  <div>
                    <p className="text-white font-semibold">Credit/Debit Card</p>
                    <p className="text-slate-400 text-sm">Visa, Mastercard, Amex</p>
                  </div>
                </label>

                {/* Wallet */}
                <label className="flex items-center p-4 border-2 border-slate-700 rounded-lg cursor-pointer hover:border-purple-600 transition"
                  style={{ borderColor: paymentMethod === "wallet" ? "#a855f7" : "" }}>
                  <input
                    type="radio"
                    name="payment"
                    value="wallet"
                    checked={paymentMethod === "wallet"}
                    onChange={(e) => setPaymentMethod(e.target.value as "wallet")}
                    className="w-4 h-4 mr-3"
                  />
                  <div>
                    <p className="text-white font-semibold">Digital Wallet</p>
                    <p className="text-slate-400 text-sm">Amazon Pay, Airtel</p>
                  </div>
                </label>
              </div>
            </Card>
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
              <p className="text-white text-lg font-semibold mb-2">Processing Payment</p>
              <p className="text-slate-400">Please wait while we process your payment...</p>
            </Card>
          </motion.div>
        )}

        {/* Success State */}
        {paymentStatus === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="bg-slate-800 border-slate-700 p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="inline-block mb-4"
              >
                <CheckCircle className="w-16 h-16 text-green-500" />
              </motion.div>
              <p className="text-white text-2xl font-bold mb-2">Payment Successful!</p>
              <p className="text-slate-400 mb-4">Your order has been confirmed</p>
              <p className="text-purple-400 text-sm">Redirecting to orders page...</p>
            </Card>
          </motion.div>
        )}

        {/* Failed State */}
        {paymentStatus === "failed" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="bg-slate-800 border-slate-700 p-8 text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-white text-2xl font-bold mb-2">Payment Failed</p>
              <p className="text-slate-400 mb-6">We couldn't process your payment. Please try again.</p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => setPaymentStatus("pending")}
                  className="bg-purple-600 hover:bg-purple-700"
                >
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

        {/* Pay Button */}
        {paymentStatus === "pending" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              onClick={handlePayment}
              disabled={processing}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 text-lg mb-4"
            >
              {processing ? "Processing..." : `Pay ₹${paymentState.totalAmount.toLocaleString()}`}
            </Button>

            <Button
              onClick={() => navigate("/profile")}
              variant="outline"
              className="w-full text-slate-300 border-slate-600"
            >
              Cancel Payment
            </Button>

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <p className="text-slate-300 text-sm text-center">
                🔒 Your payment is secured with industry-standard encryption
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Payment;