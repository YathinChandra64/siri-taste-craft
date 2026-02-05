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
import { AlertCircle, Loader, CreditCard } from "lucide-react";
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
  paymentMethod: "COD" | "RAZORPAY";
  addressId?: string;
  newAddress?: Address;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
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
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "RAZORPAY">("COD");
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [newAddress, setNewAddress] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

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

  const handleRazorpayPayment = async (orderId: string) => {
    try {
      // Create Razorpay order on backend
      const token = localStorage.getItem("token");
      
      const createOrderResponse = await fetch("http://localhost:5000/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ orderId })
      });

      const createOrderData = await createOrderResponse.json();

      if (!createOrderData.success) {
        throw new Error(createOrderData.message || "Failed to create Razorpay order");
      }

      const { razorpayOrderId, amount, currency } = createOrderData;

      // Open Razorpay checkout
      const options = {
        key: "rzp_test_YOUR_KEY_ID", // Replace with your Razorpay key from env
        amount: amount,
        currency: currency,
        name: "Siri Taste Craft",
        description: "Order Payment",
        order_id: razorpayOrderId,
        handler: async function (response: RazorpayResponse) {
          try {
            // Verify payment on backend
            const verifyResponse = await fetch("http://localhost:5000/api/payments/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                orderId: orderId
              })
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              toast({
                title: "Payment Successful",
                description: "Your order has been placed successfully"
              });

              // Clear cart
              if (stateData.isLocalCart) {
                localStorage.removeItem("cart");
              } else {
                await clearCart();
              }

              navigate("/profile", { state: { tab: "orders" } });
            } else {
              throw new Error(verifyData.message || "Payment verification failed");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            toast({
              title: "Payment Verification Failed",
              description: error instanceof Error ? error.message : "Please contact support",
              variant: "destructive"
            });
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: selectedAddress?.mobileNumber || ""
        },
        theme: {
          color: "#9333ea"
        },
        modal: {
          ondismiss: function() {
            setIsLoading(false);
            toast({
              title: "Payment Cancelled",
              description: "You cancelled the payment",
              variant: "destructive"
            });
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error("Razorpay error:", error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to initiate payment",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress && !newAddress) {
      toast({
        title: "Error",
        description: "Please select or add a delivery address",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);

      // Build items array
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

      const calculatedTotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      const orderData: OrderData = {
        items: orderItems,
        totalAmount: calculatedTotal,
        paymentMethod: paymentMethod
      };

      if (selectedAddress?._id) {
        orderData.addressId = selectedAddress._id;
      } else if (newAddress) {
        orderData.newAddress = newAddress;
      }

      console.log("📦 Placing order:", orderData);

      const response = await createOrder(orderData);
      const data = response as OrderResponse;

      if (!data.success) {
        throw new Error(data.message || "Failed to create order");
      }

      const createdOrderId = data._id || data.id || data.orderId;

      if (!createdOrderId) {
        throw new Error("No order ID returned from server");
      }

      console.log("✅ Order created:", createdOrderId);

      // Handle payment based on method
      if (paymentMethod === "RAZORPAY") {
        await handleRazorpayPayment(createdOrderId);
      } else {
        // COD flow
        toast({
          title: "Order Placed Successfully",
          description: "Your order has been placed. Pay on delivery."
        });

        if (stateData.isLocalCart) {
          localStorage.removeItem("cart");
        } else {
          await clearCart();
        }

        navigate("/profile", { state: { tab: "orders" } });
      }

    } catch (error) {
      console.error("❌ Error placing order:", error);
      
      const axiosError = error as AxiosError;
      const errorMessage = 
        (axiosError.response?.data as { message?: string })?.message ||
        (error instanceof Error ? error.message : "Failed to place order");
      
      toast({
        title: "Order Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      if (paymentMethod === "COD") {
        setIsLoading(false);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-12 px-4"
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
                      onValueChange={(value) => setPaymentMethod(value as "COD" | "RAZORPAY")}
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
                                Pay when your order is delivered
                              </p>
                            </Label>
                          </div>
                        </div>

                        <div 
                          className="border-2 border-transparent rounded-lg p-4 cursor-pointer transition-all hover:border-slate-200"
                          onClick={() => setPaymentMethod("RAZORPAY")}
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="RAZORPAY" id="razorpay" />
                            <Label htmlFor="razorpay" className="flex-1 cursor-pointer">
                              <div className="font-semibold">Pay Online (Razorpay)</div>
                              <p className="text-sm text-slate-500 mt-1">
                                Pay securely with UPI, Cards, Netbanking, or Wallets
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

                  {paymentMethod === "RAZORPAY" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex gap-3"
                    >
                      <CreditCard className="w-5 h-5 text-purple-700 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-purple-700">
                        <p className="font-semibold">Secure Online Payment</p>
                        <p className="mt-1">Pay ₹{totalAmount.toFixed(2)} now via Razorpay</p>
                        <p className="mt-2 text-xs">Next step: Select your delivery address</p>
                      </div>
                    </motion.div>
                  )}

                  <Button
                    onClick={() => setStep("address")}
                    disabled={isLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    Continue to Address
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
                          {paymentMethod === "RAZORPAY" ? "Processing..." : "Placing Order..."}
                        </>
                      ) : (
                        paymentMethod === "RAZORPAY" ? "Proceed to Payment" : "Place Order"
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