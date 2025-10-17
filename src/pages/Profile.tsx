import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getCart, removeFromCart, getCartTotal, clearCart, updateCartQuantity } from "@/utils/cart";
import { getOrders, addOrder } from "@/utils/orders";
import { updateStock } from "@/utils/inventory";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ShoppingCart, Package, User as UserIcon, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";

const Profile = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cart, setCart] = useState(getCart());
  const [orders, setOrders] = useState(getOrders());

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

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
    updateCartQuantity(id, type, newQuantity);
    refreshCart();
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add items to cart before checkout.",
        variant: "destructive",
      });
      return;
    }

    // Update stock for all items
    let allSuccess = true;
    for (const item of cart) {
      const success = updateStock(item.id, item.type, item.quantity);
      if (!success) {
        allSuccess = false;
        toast({
          title: "Checkout Failed",
          description: `${item.name} is out of stock.`,
          variant: "destructive",
        });
        break;
      }
    }

    if (allSuccess) {
      const total = getCartTotal();
      addOrder(cart, total);
      clearCart();
      refreshCart();
      setOrders(getOrders());
      
      toast({
        title: "Order Placed Successfully!",
        description: `Your order of ₹${total.toLocaleString()} has been confirmed.`,
      });
    }
  };

  if (!user) return null;

  const cartTotal = getCartTotal();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-saree flex items-center justify-center">
              <UserIcon className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Welcome, {user.name}!
            </h1>
            <p className="text-muted-foreground">{user.email}</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Shopping Cart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-6 h-6" />
                    Shopping Cart
                  </CardTitle>
                  <CardDescription>
                    {cart.length} {cart.length === 1 ? 'item' : 'items'} in your cart
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {cart.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">Your cart is empty</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4 mb-6">
                        {cart.map((item) => (
                          <motion.div
                            key={`${item.type}-${item.id}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-4 p-4 rounded-lg bg-muted/50"
                          >
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground">{item.name}</h4>
                              <p className="text-sm text-muted-foreground capitalize">{item.type}</p>
                              <p className="text-lg font-bold text-primary">
                                ₹{(item.pricePerKg || item.price).toLocaleString()}
                                {item.type === 'sweet' && '/kg'}
                              </p>
                            </div>
                            <div className="flex flex-col items-end justify-between">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveFromCart(item.id, item.type)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleUpdateQuantity(item.id, item.type, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="w-8 text-center font-medium">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleUpdateQuantity(item.id, item.type, item.quantity + 1)}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      
                      <Separator className="my-6" />
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-lg">
                          <span className="font-semibold">Total:</span>
                          <span className="font-bold text-primary">₹{cartTotal.toLocaleString()}</span>
                        </div>
                        <Button
                          onClick={handleCheckout}
                          className="w-full bg-gradient-saree text-white shadow-hover hover:shadow-soft transition-all duration-300"
                          size="lg"
                        >
                          Proceed to Checkout
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Order History */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-6 h-6" />
                    Order History
                  </CardTitle>
                  <CardDescription>
                    Your past {orders.length} {orders.length === 1 ? 'order' : 'orders'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No orders yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                      {orders.map((order) => (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-lg border border-border bg-card"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-semibold text-sm text-muted-foreground">Order #{order.id}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(order.date).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <Badge variant="default" className="bg-green-500">
                              {order.status}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 mb-3">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                  {item.name} x{item.quantity}
                                </span>
                                <span className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                          
                          <Separator className="my-2" />
                          
                          <div className="flex justify-between font-bold">
                            <span>Total:</span>
                            <span className="text-primary">₹{order.total.toLocaleString()}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
