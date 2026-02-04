import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Loader, CreditCard, QrCode, Copy, CheckCircle } from "lucide-react";
import { Address } from "@/types/checkout";
import AddressSelection from "@/components/AddressSelection";
import AddressForm from "@/components/AddressForm";
import { addAddressAPI } from "@/services/addressService";
import API_BASE_URL from "@/lib/api";

interface CartItem {
  _id: string;
  saree: {
    _id: string;
    name: string;
    price: number;
  };
  quantity: number;
}

interface CheckoutPageProps {
  cartItems?: CartItem[];
  totalAmount?: number;
}

interface LocationState {
  cartItems?: CartItem[];
  totalAmount?: number;
  isLocalCart?: boolean;
}

interface UPIConfig {
  upiId: string;
  merchantName: string;
  qrCodeImage: string;
  instructions: string;
}

type CheckoutStep = "payment-method" | "address" | "address-form";

const Checkout = ({ cartItems: propsCartItems, totalAmount: propsTotalAmount }: CheckoutPageProps) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Get data from location.state OR props
  const stateData = (location.state as LocationState) || {};
  
  // ✅ FIXED: Proper logic to prefer state data over empty props
  const { cartItems, totalAmount } = useMemo(() => {
    const hasValidProps = propsCartItems && propsCartItems.length > 0;
    const hasValidStateItems = stateData.cartItems && stateData.cartItems.length > 0;
    
    const items = hasValidProps ? propsCartItems : (hasValidStateItems ? stateData.cartItems : []);
    
    const hasValidPropsAmount = propsTotalAmount && propsTotalAmount > 0;
    const hasValidStateAmount = stateData.totalAmount && stateData.totalAmount > 0;
    
    const amount = hasValidPropsAmount ? propsTotalAmount : (hasValidStateAmount ? stateData.totalAmount : 0);
    
    return { cartItems: items, totalAmount: amount };
  }, [propsCartItems, stateData.cartItems, propsTotalAmount, stateData.totalAmount]);

  const [step, setStep] = useState<CheckoutStep>("payment-method");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "UPI">("COD");
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [newAddress, setNewAddress] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [upiConfig, setUpiConfig] = useState<UPIConfig | null>(null);
  const [upiLoading, setUpiLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to proceed with checkout",
        variant: "destructive"
      });
      navigate("/login", { state: { from: "/checkout" } });
    }
  }, [isAuthenticated, navigate, toast]);

  // Validate cart
  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Your cart is empty",
        variant: "destructive"
      });
      
      setTimeout(() => {
        navigate("/sarees");
      }, 1500);
    }
  }, [cartItems, navigate, toast]);

  // Fetch UPI config when user selects UPI
  useEffect(() => {
    if (paymentMethod === "UPI" && !upiConfig) {
      fetchUPIConfig();
    }
  }, [paymentMethod]);

  const fetchUPIConfig = async () => {
    try {
      setUpiLoading(true);
      const response = await fetch("http://localhost:5000/api/upi/config");
      const data = await response.json();
      setUpiConfig(data);
      console.log("✅ UPI Config loaded:", data);
    } catch (error) {
      console.error("❌ Failed to load UPI config:", error);
      toast({
        title: "Error",
        description: "Failed to load UPI payment details",
        variant: "destructive"
      });
    } finally {
      setUpiLoading(false);
    }
  };

  const handleAddressSubmit = async (address: Address) => {
    try {
      setIsLoading(true);
      const saved = await addAddressAPI(address);
      setNewAddress(saved);
      setSelectedAddress(saved);
      setStep("address");
      toast({
        title: "Success",
        description: "Address saved successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save address",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    // For COD, address is required
    if (paymentMethod === "COD" && !selectedAddress && !newAddress) {
      toast({
        title: "Error",
        description: "Please select or add a delivery address",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);

      // Prepare order data with all required fields
      const orderData = {
        items: cartItems.map((item) => ({
          product: item.saree._id,
          name: item.saree.name,
          quantity: item.quantity,
          price: item.saree.price
        })),
        totalAmount,
        paymentMethod,
        // Only add address for COD
        ...(paymentMethod === "COD" && selectedAddress?._id && { addressId: selectedAddress._id }),
        ...(paymentMethod === "COD" && newAddress && { newAddress })
      };

      console.log("📤 Creating Order:", orderData);

      // Create order
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to place order");
      }

      const result = await response.json();
      const orderId = result._id;

      console.log("✅ Order Created:", result);

      toast({
        title: "Success",
        description: `Order created. Proceeding to ${paymentMethod === "COD" ? "confirmation" : "payment"}...`
      });

      // Clear cart from localStorage if using local cart
      if (stateData.isLocalCart) {
        const cartKey = `cart_${user?.id || "guest"}`;
        localStorage.removeItem(cartKey);
      }

      // Redirect based on payment method
      if (paymentMethod === "COD") {
        // For COD: Navigate to order confirmation
        navigate(`/order-confirmation/${orderId}`);
      } else if (paymentMethod === "UPI") {
        // For UPI: Navigate to Payment page with OCR upload
        // This will use your existing Payment.tsx and UPIScreenshotUpload.tsx
        navigate("/payment", {
          state: {
            orderId: orderId,
            totalAmount: totalAmount,
            items: orderData.items,
            isLocalOrder: false
          }
        });
      }
    } catch (error) {
      console.error("❌ Order Error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to place order",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-4"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Checkout</h1>
          <p className="text-slate-600 mt-2">Complete your purchase securely</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Payment Method */}
              {step === "payment-method" && (
                <motion.div
                  key="payment-method"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Payment Method
                    </h3>
                    <RadioGroup 
                      value={paymentMethod} 
                      onValueChange={(value) => setPaymentMethod(value as "COD" | "UPI")}
                    >
                      <div className="space-y-3">
                        {/* COD Option */}
                        <div 
                          className="border-2 border-transparent rounded-lg p-4 cursor-pointer transition-all hover:border-slate-200"
                          onClick={() => setPaymentMethod("COD")}
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="COD" id="cod" />
                            <Label htmlFor="cod" className="flex-1 cursor-pointer">
                              <div className="font-semibold">Cash on Delivery (COD)</div>
                              <p className="text-sm text-slate-500 mt-1">
                                Pay when your order is delivered. Delivery address required.
                              </p>
                            </Label>
                          </div>
                        </div>

                        {/* UPI Option */}
                        <div 
                          className="border-2 border-transparent rounded-lg p-4 cursor-pointer transition-all hover:border-slate-200"
                          onClick={() => setPaymentMethod("UPI")}
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="UPI" id="upi" />
                            <Label htmlFor="upi" className="flex-1 cursor-pointer">
                              <div className="font-semibold">Pay with UPI</div>
                              <p className="text-sm text-slate-500 mt-1">
                                Fast and secure. Upload payment screenshot with automatic UTR extraction.
                              </p>
                            </Label>
                          </div>
                        </div>
                      </div>
                    </RadioGroup>
                  </Card>

                  {paymentMethod === "COD" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3"
                    >
                      <AlertCircle className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-green-700">
                        <p className="font-semibold">No payment needed now</p>
                        <p className="mt-1">You'll pay ₹{totalAmount.toFixed(2)} at the time of delivery</p>
                        <p className="mt-2 text-xs">Next step: Select your delivery address</p>
                      </div>
                    </motion.div>
                  )}

                  {paymentMethod === "UPI" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3"
                    >
                      <QrCode className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-700">
                        <p className="font-semibold">Pay now via UPI</p>
                        <p className="mt-1">No address needed! After payment, upload the receipt screenshot</p>
                        <p className="mt-2 text-xs">Our system will automatically extract the UTR using OCR</p>
                      </div>
                    </motion.div>
                  )}

                  <Button
                    onClick={() => {
                      if (paymentMethod === "UPI") {
                        // Skip address for UPI, go directly to create order
                        handlePlaceOrder();
                      } else {
                        // For COD, go to address selection
                        setStep("address");
                      }
                    }}
                    disabled={isLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {paymentMethod === "UPI" 
                      ? (isLoading ? "Creating Order..." : "Create Order & Pay")
                      : "Continue to Address"
                    }
                  </Button>
                </motion.div>
              )}

              {/* Step 2: Address Selection (COD only) */}
              {step === "address" && (
                <motion.div
                  key="address"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="p-6 mb-4">
                    <h3 className="text-lg font-semibold mb-4">Delivery Address</h3>
                    <AddressSelection
                      onAddressSelect={setSelectedAddress}
                      onNewAddressClick={() => setStep("address-form")}
                      selectedAddressId={selectedAddress?._id}
                    />
                  </Card>
                  
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setStep("payment-method")}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handlePlaceOrder}
                      disabled={!selectedAddress || isLoading}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      {isLoading ? "Placing Order..." : "Place Order"}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Add New Address Form (COD only) */}
              {step === "address-form" && (
                <motion.div
                  key="address-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <AddressForm
                    onSubmit={handleAddressSubmit}
                    onBack={() => setStep("address")}
                    isLoading={isLoading}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order Summary Sidebar */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="sticky top-20"
            >
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {cartItems && cartItems.length > 0 ? (
                    cartItems.map((item) => (
                      <div key={item._id} className="flex justify-between text-sm">
                        <div>
                          <p className="font-medium">{item.saree.name}</p>
                          <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-medium">₹{(item.saree.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-sm">No items in cart</p>
                  )}
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total</span>
                  <span className="text-2xl font-bold text-purple-600">₹{totalAmount.toFixed(2)}</span>
                </div>
                <div className="mt-4 pt-4 border-t text-xs text-slate-600">
                  <p>✅ 100% Secure Checkout</p>
                  <p className="mt-1">✅ Fast Delivery Guarantee</p>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Checkout;