import { useState, useEffect, useMemo } from "react";
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
import type { RazorpayPaymentOptions, RazorpayPaymentResponse } from "@/types/razorpay";
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
    stock?: number; // ← NEW: Main stock
    colorVariants?: Array<{ // ← NEW: Color variants
      color: string;
      colorCode?: string;
      stock: number;
      images?: string[];
    }>;
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
  selectedColor?: string; // ← NEW: For color variant sarees
}

interface OrderData {
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: "COD" | "RAZORPAY";
  addressId?: string;
  newAddress?: Address;
  [key: string]: unknown;
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
  const [selectedColors, setSelectedColors] = useState<Record<string, string>>({}); // ← NEW: Track selected colors

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

  // ✅ IMPROVED: Load Razorpay script with better error handling
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    
    script.onerror = () => {
      console.error("❌ Failed to load Razorpay script");
      toast({
        title: "Error",
        description: "Failed to load payment gateway. Please try again.",
        variant: "destructive"
      });
    };
    
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [toast]);

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
      setIsLoading(true);
      const token = localStorage.getItem("authToken");
      
      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }
      
      // Create Razorpay order on backend
      const createOrderResponse = await fetch("http://localhost:5000/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ orderId })
      });

      if (!createOrderResponse.ok) {
        throw new Error("Failed to create payment order");
      }

      const createOrderData = await createOrderResponse.json() as {
        success?: boolean;
        message?: string;
        razorpayOrderId?: string;
        amount?: number;
        currency?: string;
      };

      if (!createOrderData.success) {
        throw new Error(createOrderData.message || "Failed to create Razorpay order");
      }

      const { razorpayOrderId, amount, currency } = createOrderData;

      if (!window.Razorpay) {
        throw new Error("Razorpay is not loaded. Please refresh the page.");
      }

      const options: RazorpayPaymentOptions = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_YOUR_KEY_ID",
        amount: amount || 0,
        currency: currency || "INR",
        name: "Siri Taste Craft",
        description: "Order Payment",
        order_id: razorpayOrderId || "",
        handler: async (response: RazorpayPaymentResponse) => {
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

            const verifyData = await verifyResponse.json() as { success?: boolean; message?: string };

            if (verifyData.success) {
              console.log("✅ Payment verified, clearing cart...");
              
              // Clear cart after successful payment
              try {
                if (stateData.isLocalCart) {
                  localStorage.removeItem("cart");
                  console.log("✅ Local cart cleared");
                } else {
                  await clearCart();
                  console.log("✅ Server cart cleared");
                }
              } catch (clearError) {
                console.error("⚠️ Cart clearing error (continuing anyway):", clearError);
              }

              toast({
                title: "Payment Successful",
                description: "Your order has been placed successfully"
              });

              // Navigate with refresh flag
              navigate("/profile", {
                state: {
                  tab: "orders",
                  refresh: true,
                  refreshTime: Date.now()
                }
              });
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
            setIsLoading(false);
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
          ondismiss: () => {
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

      // ✅ Build items array with color selection validation
      const orderItems: OrderItem[] = cartItems.map((item) => {
        const productId = item.saree._id;
        
        if (!productId) {
          throw new Error("Invalid product ID in cart item");
        }

        // ✅ Check if saree has color variants
        const hasColorVariants = item.saree.colorVariants && item.saree.colorVariants.length > 0;

        // ✅ Validate color selection if required
        if (hasColorVariants) {
          const selectedColor = selectedColors[item._id];
          
          if (!selectedColor) {
            throw new Error(`Please select a color for "${item.saree.name}"`);
          }

          // ✅ Verify selected color exists
          const colorExists = item.saree.colorVariants.some(v => v.color === selectedColor);
          if (!colorExists) {
            throw new Error(`Selected color not available for "${item.saree.name}"`);
          }
        }
        
        return {
          product: productId,
          name: item.saree.name,
          quantity: item.quantity,
          price: item.saree.price,
          selectedColor: selectedColors[item._id] // ← Include selected color if any
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

      const response = await createOrder(orderData as Parameters<typeof createOrder>[0]);
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
        await handleRazorpayPayment(createdOrderId as string);
      } else {
        // ✅ IMPROVED: COD flow with proper cart clearing
        console.log("📍 Starting COD flow...");
        
        try {
          // Step 1: Clear cart
          console.log("Step 1: Clearing cart...");
          if (stateData.isLocalCart) {
            localStorage.removeItem("cart");
            console.log("✅ Local cart cleared");
          } else {
            const clearResult = await clearCart();
            console.log("✅ Server cart cleared:", clearResult);
          }
          
          // Step 2: Show success message
          console.log("Step 2: Showing success message...");
          toast({
            title: "Order Placed Successfully! 🎉",
            description: "Your order has been placed. You will pay on delivery.",
            variant: "default"
          });

          // Step 3: Small delay to ensure toast is shown
          await new Promise(resolve => setTimeout(resolve, 500));

          // Step 4: Navigate to profile with refresh flag
          console.log("Step 4: Navigating to profile...");
          navigate("/profile", {
            state: {
              tab: "orders",
              refresh: true,
              refreshTime: Date.now()
            }
          });
          
        } catch (error) {
          console.error("❌ Error in COD flow:", error);
          
          // Even if cart clearing fails, show success and navigate
          toast({
            title: "Order Placed Successfully! 🎉",
            description: "Your order has been placed. Please refresh the page to see it in your orders.",
            variant: "default"
          });

          navigate("/profile", {
            state: {
              tab: "orders",
              refresh: true,
              refreshTime: Date.now()
            }
          });
        }
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
      setIsLoading(false);
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

              {/* ✅ NEW: Color Selection Step */}
              {/* When on address step, show color selection above it */}
              {step === "address" && (
                <motion.div
                  key="colors"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4"
                >
                  {cartItems.map((item) => {
                    const hasColorVariants = item.saree.colorVariants && item.saree.colorVariants.length > 0;
                    
                    return (
                      <Card key={item._id} className="p-6 mb-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-semibold text-lg">{item.saree.name}</h4>
                            <p className="text-sm text-slate-500">Quantity: {item.quantity}</p>
                          </div>
                          <p className="text-xl font-bold text-purple-600">₹{(item.saree.price * item.quantity).toFixed(2)}</p>
                        </div>

                        {hasColorVariants ? (
                          <div className="space-y-3">
                            <label className="block text-sm font-medium text-slate-700">
                              Select Color <span className="text-red-500">*</span>
                            </label>
                            
                            <div className="space-y-2">
                              {item.saree.colorVariants.map((variant) => (
                                <div
                                  key={variant.color}
                                  onClick={() =>
                                    setSelectedColors({
                                      ...selectedColors,
                                      [item._id]: variant.color,
                                    })
                                  }
                                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                    selectedColors[item._id] === variant.color
                                      ? "border-purple-600 bg-purple-50"
                                      : "border-slate-200 hover:border-slate-300"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 flex-1">
                                    {/* Color swatch */}
                                    {variant.colorCode && (
                                      <div
                                        className="w-6 h-6 rounded-full border border-slate-300"
                                        style={{ backgroundColor: variant.colorCode }}
                                      />
                                    )}
                                    
                                    <div className="flex-1">
                                      <p className="font-medium">{variant.color}</p>
                                      <p className="text-xs text-slate-500">Stock: {variant.stock}</p>
                                    </div>
                                  </div>

                                  {/* Radio button */}
                                  <input
                                    type="radio"
                                    name={`color-${item._id}`}
                                    value={variant.color}
                                    checked={selectedColors[item._id] === variant.color}
                                    onChange={() => {}}
                                    className="w-5 h-5 text-purple-600"
                                  />
                                </div>
                              ))}
                            </div>

                            {!selectedColors[item._id] && (
                              <p className="text-sm text-red-500 font-medium">Please select a color to continue</p>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-slate-600 italic">
                            ✓ No color options available for this saree
                          </div>
                        )}
                      </Card>
                    );
                  })}
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