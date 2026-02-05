import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AxiosError } from "axios";
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
import { createOrder, clearCart } from "@/lib/api";

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

interface OrderResponse {
  _id?: string;
  id?: string;
  orderId?: string;
  success?: boolean;
  message?: string;
  [key: string]: unknown;
}

interface OrderItem {
  product: string;
  name: string;
  quantity: number;
  price: number;
}

interface OrderData {
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: "COD" | "UPI";
  addressId?: string;
  newAddress?: Address;
}

interface ApiErrorResponse {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
  message?: string;
}

type CheckoutStep = "payment-method" | "address" | "address-form";

const Checkout = ({ cartItems: propsCartItems, totalAmount: propsTotalAmount }: CheckoutPageProps) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const stateData = (location.state as LocationState) || {};
  
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

  const fetchUPIConfig = useCallback(async () => {
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
  }, [toast]);

  useEffect(() => {
    if (paymentMethod === "UPI" && !upiConfig) {
      fetchUPIConfig();
    }
  }, [paymentMethod, upiConfig, fetchUPIConfig]);

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

      // ✅ FIX: Build items array with exact structure backend expects
      const orderItems: OrderItem[] = cartItems.map((item) => {
        const productId = item.saree._id;
        
        if (!productId) {
          throw new Error("Invalid product ID in cart item");
        }
        
        return {
          product: productId,
          name: item.saree.name,
          quantity: item.quantity,
          price: item.saree.price
        };
      });

      // ✅ FIX: Calculate total from items to ensure accuracy
      const calculatedTotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      const orderData: OrderData = {
        items: orderItems,
        totalAmount: calculatedTotal || totalAmount,
        paymentMethod,
        ...(paymentMethod === "COD" && selectedAddress?._id && { addressId: selectedAddress._id }),
        ...(paymentMethod === "COD" && newAddress && { newAddress })
      };

      if (!orderData.items.length) {
        throw new Error("No items in order");
      }
      if (orderData.totalAmount <= 0) {
        throw new Error("Invalid total amount");
      }
      if (![orderData.paymentMethod].some(method => ["COD", "UPI"].includes(method))) {
        throw new Error("Invalid payment method");
      }

      console.log("📤 Creating Order with data:", {
        itemsCount: orderData.items.length,
        items: orderData.items,
        totalAmount: orderData.totalAmount,
        paymentMethod: orderData.paymentMethod,
        hasAddress: !!(selectedAddress?._id || newAddress)
      });

      // ✅ FIX: Send exact order structure
      const result = await createOrder(orderData as never);

      console.log("✅ Order Created Successfully:", result);

      const orderResponse = result as unknown as OrderResponse;
      const orderId = orderResponse._id || orderResponse.id || orderResponse.orderId;

      if (!orderId) {
        console.error("❌ No order ID in response:", orderResponse);
        throw new Error("Order created but ID not returned");
      }

      if (paymentMethod === "UPI") {
        toast({
          title: "✅ Order Created!",
          description: `Order ID: ${orderId}. Proceeding to payment...`
        });
        
        navigate("/payment", { 
          state: { orderId, totalAmount: orderData.totalAmount, paymentMethod },
          replace: true 
        });
      } else {
        toast({
          title: "✅ Order Placed Successfully!",
          description: `Order ID: ${orderId}. Your order will be delivered soon.`
        });
        
        navigate("/profile", { replace: true });
      }

      try {
        await clearCart();
        console.log("✅ Cart cleared");
      } catch (clearError) {
        console.warn("⚠️ Could not clear cart:", clearError);
      }

    } catch (error) {
      const apiError = error as AxiosError<{ message?: string }> | Error;
      
      let errorMessage = "Failed to create order";
      let errorStatus: number | undefined;
      let errorData: unknown;

      if (error instanceof AxiosError) {
        errorStatus = error.response?.status;
        errorMessage = error.response?.data?.message || error.message;
        errorData = error.response?.data;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      console.error("❌ Order Error Details:", {
        status: errorStatus,
        message: errorMessage,
        data: errorData,
        fullError: error
      });

      let displayMessage = errorMessage;
      if (errorStatus === 401) {
        displayMessage = "Authentication expired. Please login again.";
      } else if (errorStatus === 400) {
        if (typeof errorData === "object" && errorData !== null && "message" in errorData) {
          displayMessage = (errorData as { message?: string }).message || "Invalid order data. Please check your items and address.";
        } else {
          displayMessage = "Invalid order data. Please check your items and address.";
        }
      } else if (errorStatus === 500) {
        displayMessage = "Server error. Please check the console for details.";
      } else if (!navigator.onLine) {
        displayMessage = "No internet connection. Please check your network.";
      }

      toast({
        title: "Error Creating Order",
        description: displayMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!cartItems || cartItems.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center"
      >
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Cart is Empty</h2>
          <p className="text-slate-600 mb-4">Redirecting to products...</p>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Secure Checkout</h1>
          <p className="text-slate-600 mt-2">Complete your purchase with confidence</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
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
                        handlePlaceOrder();
                      } else {
                        setStep("address");
                      }
                    }}
                    disabled={isLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Creating Order...
                      </>
                    ) : (
                      paymentMethod === "UPI" 
                        ? "Create Order & Pay"
                        : "Continue to Address"
                    )}
                  </Button>
                </motion.div>
              )}

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
                      {isLoading ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Placing Order...
                        </>
                      ) : (
                        "Place Order"
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

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