import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getCart, removeFromCart, getCartTotal, clearCart, updateCartQuantity } from "@/utils/cart";
import { getOrders, addOrder } from "@/utils/orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Package, User as UserIcon, Trash2, Plus, Minus, ShoppingBag, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import AnimatedBackground from "@/components/AnimatedBackground";
import NotificationsPanel from "@/components/NotificationsPanel";

interface CartItem {
  id: number;
  name: string;
  type: 'saree' | 'sweet';
  image?: string;
  price?: number;
  pricePerKg?: number;
  quantity: number;
}

interface OrderItem {
  product: number;
  name: string;
  quantity: number;
  price: number;
}

const Profile = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>(getCart());
  const [orders, setOrders] = useState(getOrders());
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // ✅ FIX 1: Safe price formatter helper
  const formatPrice = (value?: number): string => {
    return typeof value === "number" ? value.toLocaleString() : "0";
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Refresh cart every time page loads
  useEffect(() => {
    const refreshedCart = getCart();
    setCart(refreshedCart);
  }, []);

  const refreshCart = () => {
    setCart(getCart());
  };

  const handleRemoveFromCart = (id: number, type: 'saree' | 'sweet') => {
    removeFromCart(id, type);
    refreshCart();
    toast({
      title: "Removed from cart",
      description: "Item has been removed from your cart.",
    });
  };

  const handleUpdateQuantity = (id: number, type: 'saree' | 'sweet', newQuantity: number) => {
    if (newQuantity < 1) return;
    updateCartQuantity(id, type, newQuantity);
    refreshCart();
  };

  const handleCheckout = async () => {
    if (!cart || cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add items to cart before checkout.",
        variant: "destructive",
      });
      return;
    }

    setIsCheckingOut(true);

    try {
      const token = localStorage.getItem("authToken");
      
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please login to place an order.",
          variant: "destructive",
        });
        navigate('/login');
        setIsCheckingOut(false);
        return;
      }

      // ✅ FIX 2: Include product name and use nullish coalescing
      const orderItems: OrderItem[] = cart.map(item => ({
        product: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.pricePerKg ?? item.price ?? 0
      }));

      const cartTotal = getCartTotal() ?? 0;

      // Send order to backend
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
        throw new Error(errorData.message || "Failed to place order");
      }

      // Order successful
      clearCart();
      refreshCart();
      setOrders(getOrders());
      
      toast({
        title: "Order Placed Successfully! 🎉",
        description: `Your order of ₹${formatPrice(cartTotal)} has been confirmed.`,
      });

      // Redirect to home after a delay
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout Failed",
        description: error instanceof Error ? error.message : "An error occurred while placing your order.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingOut(false);
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
                {/* Notifications Panel */}
                <div className="flex-shrink-0">
                  <NotificationsPanel />
                </div>
              </div>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content - Cart & Orders */}
              <div className="lg:col-span-2 space-y-8">
                {/* Shopping Cart - Amazon Style */}
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
                              // ✅ Safe price calculation
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
                                  {/* Product Image */}
                                  <div className="flex-shrink-0">
                                    <img
                                      src={item.image || "https://via.placeholder.com/128x160"}
                                      alt={item.name}
                                      className="w-32 h-40 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow"
                                    />
                                  </div>

                                  {/* Product Details */}
                                  <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                      <h3 className="text-lg font-bold text-foreground mb-1">
                                        {item.name || "Product"}
                                      </h3>
                                      <p className="text-sm text-muted-foreground capitalize mb-3">
                                        Type: {item.type === 'saree' ? 'Saree' : 'Sweet'}
                                      </p>
                                      
                                      {/* Price */}
                                      <div className="mb-3">
                                        <p className="text-2xl font-bold text-primary">
                                          ₹{formatPrice(itemPrice)}
                                        </p>
                                        {item.type === 'sweet' && (
                                          <p className="text-xs text-muted-foreground">/kg</p>
                                        )}
                                      </div>

                                      {/* Total for this item */}
                                      <p className="text-sm font-semibold text-foreground">
                                        Subtotal: ₹{formatPrice(itemSubtotal)}
                                      </p>
                                    </div>

                                    {/* Quantity & Action */}
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

                          {/* Divider */}
                          <Separator className="my-6" />

                          {/* Continue Shopping Button */}
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
                          {orders.map((order) => {
                            // ✅ Safety checks for order
                            if (!order) return null;

                            const orderTotal = order.total ?? 0;
                            const orderStatus = order.status || 'pending';
                            const orderDate = order.date ? new Date(order.date) : new Date();

                            return (
                              <motion.div
                                key={order.id || Math.random()}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <p className="font-bold text-foreground">Order #{order.id || 'N/A'}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {orderDate.toLocaleDateString('en-IN', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                      })}
                                    </p>
                                  </div>
                                  <Badge 
                                    className={`${
                                      orderStatus === 'completed' 
                                        ? 'bg-green-500' 
                                        : orderStatus === 'pending'
                                        ? 'bg-blue-500'
                                        : 'bg-yellow-500'
                                    }`}
                                  >
                                    {orderStatus.toUpperCase()}
                                  </Badge>
                                </div>
                                
                                <div className="bg-muted/50 p-3 rounded mb-3 max-h-20 overflow-y-auto">
                                  {order.items && Array.isArray(order.items) && order.items.length > 0 ? (
                                    order.items.map((item, idx) => {
                                      // ✅ Safety check for item
                                      if (!item) return null;

                                      const itemName = item.name || 'Product';
                                      const itemQty = item.quantity ?? 1;
                                      const itemPrice = item.price ?? 0;
                                      const itemSubtotal = itemPrice * itemQty;

                                      return (
                                        <div key={idx} className="text-sm flex justify-between mb-1">
                                          <span className="text-muted-foreground">
                                            {itemName} x{itemQty}
                                          </span>
                                          <span className="font-medium">
                                            ₹{formatPrice(itemSubtotal)}
                                          </span>
                                        </div>
                                      );
                                    })
                                  ) : (
                                    <p className="text-sm text-muted-foreground">No items in this order</p>
                                  )}
                                </div>
                                
                                <div className="flex justify-between font-bold pt-2 border-t">
                                  <span>Total:</span>
                                  <span className="text-primary">₹{formatPrice(orderTotal)}</span>
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

              {/* Sidebar - Price Summary & Checkout (Amazon Style) */}
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
                        {/* Price Breakdown */}
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

                        {/* Total */}
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-lg">Total:</span>
                          <span className="text-2xl font-bold text-primary">₹{formatPrice(cartTotal)}</span>
                        </div>

                        <Separator />

                        {/* Checkout Button */}
                        <Button
                          onClick={handleCheckout}
                          disabled={isCheckingOut || !cart || cart.length === 0}
                          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                          size="lg"
                        >
                          {isCheckingOut ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity }}
                              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full inline-block mr-2"
                            />
                          ) : (
                            "Proceed to Buy"
                          )}
                        </Button>

                        {/* Message */}
                        <p className="text-xs text-center text-muted-foreground">
                          Secure checkout with encrypted payment
                        </p>

                        {/* Continue Shopping */}
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
    </div>
  );
};

export default Profile;