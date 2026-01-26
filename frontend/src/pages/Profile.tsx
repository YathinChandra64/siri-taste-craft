import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getCart, removeFromCart, getCartTotal, clearCart, updateCartQuantity } from "@/utils/cart";
import { getOrders } from "@/utils/orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Package, User as UserIcon, Trash2, Plus, Minus, ShoppingBag, Mail, QrCode, CheckCircle, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import AnimatedBackground from "@/components/AnimatedBackground";
import NotificationsPanel from "@/components/NotificationsPanel";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// ✅ Type Definitions
interface CartItem {
  id: string; // ✅ FIXED: Changed from number to string (MongoDB ObjectId)
  name: string;
  type: 'saree' | 'sweet';
  image?: string;
  price?: number;
  pricePerKg?: number;
  quantity: number;
}

interface OrderItem {
  product: string; // ✅ FIXED: Changed from number to string (MongoDB ObjectId)
  name: string;
  quantity: number;
  price: number;
}

interface BackendOrder {
  _id: string;
  totalAmount: number;
  status: string;
  paymentReference?: string;
  paymentProof?: string;
  createdAt: string;
  items?: OrderItem[];
}

// ✅ Old/Local Order format (from localStorage)
interface LocalOrder {
  id?: string;
  _id?: string;
  total?: number;
  totalAmount?: number;
  date?: string;
  createdAt?: string;
  status?: string;
  items?: OrderItem[];
  paymentReference?: string;
  paymentProof?: string;
}

// ✅ MAPPER: Convert old Order format to BackendOrder format
const mapOrderToBackendOrder = (order: LocalOrder): BackendOrder => ({
  _id: order._id ?? order.id ?? `order-${Date.now()}`,
  totalAmount: order.totalAmount ?? order.total ?? 0,
  status: order.status ?? "pending",
  createdAt: order.createdAt ?? order.date ?? new Date().toISOString(),
  items: order.items ?? [],
  paymentReference: order.paymentReference ?? undefined,
  paymentProof: order.paymentProof ?? undefined
});

const Profile = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>(getCart());
  const [orders, setOrders] = useState<BackendOrder[]>(getOrders().map(mapOrderToBackendOrder));
  const [upiQrCode, setUpiQrCode] = useState<string | null>(null);
  const [upiId, setUpiId] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showProofDialog, setShowProofDialog] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [paymentProofData, setPaymentProofData] = useState({
    reference: "",
    proofUrl: ""
  });

  const formatPrice = (value?: number): string => {
    return typeof value === "number" ? value.toLocaleString() : "0";
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const refreshedCart = getCart();
    setCart(refreshedCart);
  }, []);

  // Fetch UPI QR code
  useEffect(() => {
    fetchUpiQrCode();
  }, []);

  const fetchUpiQrCode = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/payments/upi-qr");
      if (response.ok) {
        const data = await response.json();
        setUpiQrCode(data.upiQrCode);
        setUpiId(data.upiId);
      }
    } catch (error) {
      console.error("Failed to fetch UPI QR:", error);
    }
  };

  const refreshCart = () => {
    setCart(getCart());
  };

  const handleRemoveFromCart = (id: string, type: 'saree' | 'sweet') => {
    removeFromCart(id, type);
    refreshCart();
    toast({
      title: "Removed from cart",
      description: "Item has been removed from your cart.",
    });
  };

  const handleUpdateQuantity = (id: string, type: 'saree' | 'sweet', newQuantity: number) => {
    if (newQuantity < 1) return;
    updateCartQuantity(id, type, newQuantity);
    refreshCart();
  };

  const handleProceedToCheckout = async () => {
    if (!cart || cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add items to cart before checkout.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingOrder(true);

    try {
      const token = localStorage.getItem("authToken");
      
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please login to place an order.",
          variant: "destructive",
        });
        navigate('/login');
        setIsSubmittingOrder(false);
        return;
      }

      // ✅ FIXED: Send items with product as MongoDB ObjectId string
      const orderItems: OrderItem[] = cart.map(item => ({
        product: item.id, // ✅ Already a MongoDB ObjectId string from cart
        name: item.name,
        quantity: item.quantity,
        price: item.pricePerKg ?? item.price ?? 0
      }));

      const cartTotal = getCartTotal() ?? 0;

      console.log("📤 Sending order items:", orderItems);

      // ✅ Create order
      const response = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: orderItems,
          totalAmount: cartTotal
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Order creation failed:", errorData);
        throw new Error(errorData.message || "Failed to create order");
      }

      const orderData = await response.json();
      const orderId = orderData._id || orderData.order?._id;

      if (!orderId) {
        throw new Error("No order ID returned from server");
      }

      setPendingOrderId(orderId);
      setShowPaymentDialog(true);

      toast({
        title: "Order Created ✅",
        description: "Now please proceed with payment",
      });

    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout Failed",
        description: error instanceof Error ? error.message : "An error occurred while placing your order.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleSubmitPaymentProof = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingOrder(true);

    try {
      const token = localStorage.getItem("authToken");

      if (!paymentProofData.reference) {
        toast({
          title: "Error",
          description: "Please enter payment reference number",
          variant: "destructive",
        });
        setIsSubmittingOrder(false);
        return;
      }

      const response = await fetch("http://localhost:5000/api/payments/submit-proof", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: pendingOrderId,
          paymentReference: paymentProofData.reference,
          paymentProofUrl: paymentProofData.proofUrl
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit payment proof");
      }

      toast({
        title: "Payment Submitted! ✅",
        description: "Admin will verify your payment shortly. Check notifications for updates.",
      });

      // Clear cart
      clearCart();
      refreshCart();
      setShowPaymentDialog(false);
      setShowProofDialog(false);
      setPaymentProofData({ reference: "", proofUrl: "" });
      setPendingOrderId(null);

      // Refresh orders using mapper
      setOrders(getOrders().map(mapOrderToBackendOrder));

      // Redirect after delay
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      console.error("Submit proof error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit payment proof",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  if (!user) return null;

  const cartTotal = getCartTotal() ?? 0;

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      
      <div className="relative z-10">
        <main className="flex-1 py-12 px-4">
          <div className="container mx-auto max-w-7xl">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-12"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-6 flex-1">
                  <div className="w-24 h-24 rounded-full bg-gradient-saree flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-12 h-12 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-foreground mb-2">
                      Welcome, {user.name}!
                    </h1>
                    <div className="space-y-1 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail size={16} />
                        <span>{user.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <NotificationsPanel />
                </div>
              </div>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content - Cart & Orders */}
              <div className="lg:col-span-2 space-y-8">
                {/* Shopping Cart */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <Card className="shadow-card">
                    <CardHeader className="bg-muted/50 border-b">
                      <CardTitle className="flex items-center gap-2 text-2xl">
                        <ShoppingCart className="w-6 h-6" />
                        Shopping Cart
                      </CardTitle>
                      <CardDescription>
                        {cart ? cart.length : 0} {(cart?.length ?? 0) === 1 ? 'item' : 'items'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {!cart || cart.length === 0 ? (
                        <div className="text-center py-16">
                          <ShoppingBag className="w-20 h-20 mx-auto mb-4 text-muted-foreground opacity-30" />
                          <p className="text-lg text-muted-foreground mb-2">Your cart is empty</p>
                          <p className="text-sm text-muted-foreground mb-6">Add some beautiful sarees to get started!</p>
                          <Button 
                            onClick={() => navigate('/sarees')}
                            className="bg-gradient-saree text-white"
                          >
                            Continue Shopping
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-6">
                            {cart.map((item) => {
                              const itemPrice = item.pricePerKg ?? item.price ?? 0;
                              const itemQuantity = item.quantity ?? 1;
                              const itemSubtotal = itemPrice * itemQuantity;

                              return (
                                <motion.div
                                  key={`${item.type}-${item.id}`}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="flex gap-4 pb-6 border-b last:border-b-0"
                                >
                                  <div className="flex-shrink-0">
                                    <img
                                      src={item.image || "https://via.placeholder.com/128x160"}
                                      alt={item.name}
                                      className="w-32 h-40 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow"
                                    />
                                  </div>

                                  <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                      <h3 className="text-lg font-bold text-foreground mb-1">
                                        {item.name || "Product"}
                                      </h3>
                                      <p className="text-sm text-muted-foreground capitalize mb-3">
                                        Type: {item.type === 'saree' ? 'Saree' : 'Sweet'}
                                      </p>
                                      
                                      <div className="mb-3">
                                        <p className="text-2xl font-bold text-primary">
                                          ₹{formatPrice(itemPrice)}
                                        </p>
                                        {item.type === 'sweet' && (
                                          <p className="text-xs text-muted-foreground">/kg</p>
                                        )}
                                      </div>

                                      <p className="text-sm font-semibold text-foreground">
                                        Subtotal: ₹{formatPrice(itemSubtotal)}
                                      </p>
                                    </div>

                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0"
                                          onClick={() => handleUpdateQuantity(item.id, item.type, itemQuantity - 1)}
                                          disabled={itemQuantity <= 1}
                                        >
                                          <Minus className="w-4 h-4" />
                                        </Button>
                                        <span className="w-8 text-center font-semibold">{itemQuantity}</span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0"
                                          onClick={() => handleUpdateQuantity(item.id, item.type, itemQuantity + 1)}
                                        >
                                          <Plus className="w-4 h-4" />
                                        </Button>
                                      </div>

                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleRemoveFromCart(item.id, item.type)}
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                      </Button>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>

                          <Separator className="my-6" />

                          <div className="mb-6">
                            <Button
                              variant="outline"
                              className="w-full text-center"
                              onClick={() => navigate('/sarees')}
                            >
                              Continue Shopping
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Order History */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card className="shadow-card">
                    <CardHeader className="bg-muted/50 border-b">
                      <CardTitle className="flex items-center gap-2 text-2xl">
                        <Package className="w-6 h-6" />
                        Order History
                      </CardTitle>
                      <CardDescription>
                        {orders && orders.length ? orders.length : 0} {(orders?.length ?? 0) === 1 ? 'order' : 'orders'} placed
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {!orders || orders.length === 0 ? (
                        <div className="text-center py-12">
                          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                          <p className="text-muted-foreground">No orders yet</p>
                          <p className="text-sm text-muted-foreground mt-1">Start shopping to create your first order!</p>
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[600px] overflow-y-auto">
                          {orders.map((order: BackendOrder) => {
                            if (!order) return null;

                            const orderTotal = order.totalAmount ?? 0;
                            const orderStatus = order.status || 'pending';
                            const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();

                            const getStatusColor = (status: string) => {
                              switch(status) {
                                case 'confirmed': return 'bg-green-500';
                                case 'payment_submitted': return 'bg-yellow-500';
                                case 'pending_payment': return 'bg-orange-500';
                                case 'payment_rejected': return 'bg-red-500';
                                case 'shipped': return 'bg-blue-500';
                                case 'delivered': return 'bg-green-600';
                                default: return 'bg-gray-500';
                              }
                            };

                            const getStatusIcon = (status: string) => {
                              switch(status) {
                                case 'confirmed': return <CheckCircle size={16} />;
                                case 'payment_submitted': return <Clock size={16} />;
                                case 'pending_payment': return <QrCode size={16} />;
                                default: return <Package size={16} />;
                              }
                            };

                            return (
                              <motion.div
                                key={order._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <p className="font-bold text-foreground">Order #{order._id.slice(-8).toUpperCase()}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {orderDate.toLocaleDateString('en-IN', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                      })}
                                    </p>
                                  </div>
                                  <Badge className={`${getStatusColor(orderStatus)} flex items-center gap-1`}>
                                    {getStatusIcon(orderStatus)}
                                    {orderStatus.toUpperCase()}
                                  </Badge>
                                </div>
                                
                                <div className="flex justify-between font-bold pt-2 border-t">
                                  <span>Total: ₹{formatPrice(orderTotal)}</span>
                                  {orderStatus === 'pending_payment' && (
                                    <span className="text-xs text-orange-600">Awaiting payment</span>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Sidebar - Price Summary & Checkout */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="lg:col-span-1"
              >
                <Card className="shadow-card sticky top-20 border-orange-200">
                  <CardContent className="pt-6">
                    {cart && cart.length > 0 ? (
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal ({cart.length} items):</span>
                            <span className="font-medium">₹{formatPrice(cartTotal)}</span>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Shipping:</span>
                            <span className="font-medium text-green-600">FREE</span>
                          </div>

                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Tax:</span>
                            <span className="font-medium">₹0</span>
                          </div>
                        </div>

                        <Separator />

                        <div className="flex justify-between items-center">
                          <span className="font-bold text-lg">Total:</span>
                          <span className="text-2xl font-bold text-primary">₹{formatPrice(cartTotal)}</span>
                        </div>

                        <Separator />

                        <Button
                          onClick={handleProceedToCheckout}
                          disabled={isSubmittingOrder || !cart || cart.length === 0}
                          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                          size="lg"
                        >
                          {isSubmittingOrder ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity }}
                              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full inline-block mr-2"
                            />
                          ) : (
                            <>
                              <QrCode size={18} className="mr-2" />
                              Proceed to Pay
                            </>
                          )}
                        </Button>

                        <p className="text-xs text-center text-muted-foreground">
                          Secure payment via UPI
                        </p>

                        <Button
                          variant="outline"
                          onClick={() => navigate('/sarees')}
                          className="w-full"
                        >
                          Continue Shopping
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">Your cart is empty</p>
                        <Button
                          onClick={() => navigate('/sarees')}
                          className="w-full bg-gradient-saree text-white"
                        >
                          Start Shopping
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </main>
      </div>

      {/* Payment Dialog - Show UPI QR Code */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Your Payment</DialogTitle>
            <DialogDescription>Scan the QR code or enter UPI ID to pay</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Amount */}
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Amount to Pay</p>
              <p className="text-3xl font-bold text-primary">₹{formatPrice(cartTotal)}</p>
            </div>

            {/* QR Code */}
            {upiQrCode && (
              <div className="flex flex-col items-center">
                <p className="text-sm font-semibold mb-3">Scan QR Code</p>
                <img 
                  src={upiQrCode} 
                  alt="UPI QR Code" 
                  className="w-64 h-64 border-2 border-primary rounded-lg"
                />
              </div>
            )}

            {/* UPI ID */}
            {upiId && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Or pay directly to:</p>
                <p className="text-lg font-semibold font-mono bg-muted p-2 rounded">{upiId}</p>
              </div>
            )}

            {/* Submit Proof Button */}
            <Button
              onClick={() => {
                setShowPaymentDialog(false);
                setShowProofDialog(true);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              I've Paid - Submit Receipt
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              After paying, click the button above to submit your payment proof
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Proof Dialog */}
      <Dialog open={showProofDialog} onOpenChange={setShowProofDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Payment Proof</DialogTitle>
            <DialogDescription>Enter your transaction details</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitPaymentProof} className="space-y-4">
            <div>
              <label className="text-sm font-medium">UPI Transaction Reference *</label>
              <p className="text-xs text-muted-foreground mb-2">
                (You'll find this in your UPI app after payment - usually "Ref #" or "Txn ID")
              </p>
              <Input
                value={paymentProofData.reference}
                onChange={(e) => setPaymentProofData({...paymentProofData, reference: e.target.value})}
                placeholder="e.g., 123456789ABC"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Payment Screenshot URL (Optional)</label>
              <p className="text-xs text-muted-foreground mb-2">
                Upload screenshot to a free hosting site (imgur, etc) and paste URL
              </p>
              <Input
                value={paymentProofData.proofUrl}
                onChange={(e) => setPaymentProofData({...paymentProofData, proofUrl: e.target.value})}
                placeholder="https://imgur.com/..."
                type="url"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmittingOrder || !paymentProofData.reference}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isSubmittingOrder ? "Submitting..." : "Submit Payment Proof"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Admin will verify your payment and an in-app notification will be sent
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;