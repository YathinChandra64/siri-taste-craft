import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingCart, Download, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AnimatedBackground from "@/components/AnimatedBackground";

interface CartItem {
  _id: string;
  saree: {
    _id: string;
    name: string;
    price: number;
    image?: string;
  };
  quantity: number;
}

interface Order {
  _id: string;
  items: any[];
  totalAmount: number;
  status: string;
  createdAt: string;
}

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("cart");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    fetchCartAndOrders();
  }, []);

  const fetchCartAndOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Fetch cart
      const cartRes = await fetch("http://localhost:5000/api/cart", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (cartRes.ok) {
        const cartData = await cartRes.json();
        setCartItems(Array.isArray(cartData) ? cartData : []);
      }

      // Fetch orders
      const ordersRes = await fetch("http://localhost:5000/api/orders/my-orders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData.orders || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load your data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromCart = async (cartItemId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/cart/${cartItemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setCartItems(cartItems.filter(item => item._id !== cartItemId));
        toast({
          title: "Removed",
          description: "Item removed from cart"
        });
      }
    } catch (error) {
      console.error("Error removing item:", error);
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive"
      });
    }
  };

  const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/cart/${cartItemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: newQuantity })
      });

      if (res.ok) {
        setCartItems(cartItems.map(item =>
          item._id === cartItemId ? { ...item, quantity: newQuantity } : item
        ));
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive"
      });
    }
  };

  const handleProceedToCheckout = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsCheckingOut(true);
      const token = localStorage.getItem("token");

      // ✅ FIXED: Properly structure the order items with valid MongoDB ObjectIds
      const orderItems = cartItems.map(item => ({
        product: item.saree._id,  // ✅ Use the saree's MongoDB _id
        name: item.saree.name,
        quantity: item.quantity,
        price: item.saree.price
      }));

      const totalAmount = cartItems.reduce((sum, item) => sum + (item.saree.price * item.quantity), 0);

      console.log("📤 Sending order items:", orderItems);

      const response = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          items: orderItems,
          totalAmount: totalAmount
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Success",
          description: "Order created! Proceeding to payment...",
        });

        // Clear cart
        setCartItems([]);
        
        // Redirect to payment page
        navigate("/payment", { 
          state: { 
            orderId: data._id || data.order._id,
            totalAmount: totalAmount
          } 
        });
      } else {
        throw new Error(data.message || "Failed to create order");
      }
    } catch (error) {
      console.error("❌ Order creation failed:", error);
      toast({
        title: "Checkout Failed",
        description: error instanceof Error ? error.message : "Failed to process checkout",
        variant: "destructive"
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + (item.saree.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <AnimatedBackground />
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">My Account</h1>
              <p className="text-slate-400">Welcome, {user?.name}!</p>
            </div>
            <Button
              onClick={logout}
              variant="destructive"
              className="gap-2"
            >
              Logout
            </Button>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-700">
          <button
            onClick={() => setActiveTab("cart")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "cart"
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Shopping Cart ({cartItems.length})
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "orders"
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Order History ({orders.length})
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : activeTab === "cart" ? (
          // CART TAB
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.length === 0 ? (
                <Card className="bg-slate-800 border-slate-700 p-8 text-center">
                  <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 mb-4">Your cart is empty</p>
                  <Button onClick={() => navigate("/sarees")} className="bg-purple-600 hover:bg-purple-700">
                    Continue Shopping
                  </Button>
                </Card>
              ) : (
                cartItems.map((item) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="bg-slate-800 border-slate-700 p-4 flex gap-4">
                      <img
                        src={item.saree.image || "https://via.placeholder.com/100"}
                        alt={item.saree.name}
                        className="w-24 h-24 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">{item.saree.name}</h3>
                        <p className="text-slate-400 text-sm">₹{item.saree.price}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <button
                            onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded text-white"
                          >
                            −
                          </button>
                          <span className="text-white w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded text-white"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold mb-4">
                          ₹{(item.saree.price * item.quantity).toLocaleString()}
                        </p>
                        <button
                          onClick={() => handleRemoveFromCart(item._id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>

            {/* Cart Summary */}
            {cartItems.length > 0 && (
              <Card className="bg-slate-800 border-slate-700 p-6 h-fit sticky top-20">
                <h2 className="text-xl font-bold text-white mb-4">Order Summary</h2>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span>₹{totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Shipping</span>
                    <span className="text-green-400">FREE</span>
                  </div>
                  <div className="border-t border-slate-700 pt-3 flex justify-between text-white font-bold text-lg">
                    <span>Total</span>
                    <span>₹{totalPrice.toLocaleString()}</span>
                  </div>
                </div>
                <Button
                  onClick={handleProceedToCheckout}
                  disabled={isCheckingOut}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 gap-2 mb-3"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {isCheckingOut ? "Processing..." : "Proceed to Pay"}
                </Button>
                <Button
                  onClick={() => navigate("/sarees")}
                  variant="outline"
                  className="w-full text-slate-300 border-slate-600"
                >
                  Continue Shopping
                </Button>
              </Card>
            )}
          </div>
        ) : (
          // ORDERS TAB
          <div className="space-y-4">
            {orders.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700 p-8 text-center">
                <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-4">No orders yet</p>
                <Button onClick={() => navigate("/sarees")} className="bg-purple-600 hover:bg-purple-700">
                  Start Shopping
                </Button>
              </Card>
            ) : (
              orders.map((order) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="bg-slate-800 border-slate-700 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-white font-semibold mb-2">Order #{order._id.slice(-6)}</h3>
                        <p className="text-slate-400 text-sm">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded text-sm font-medium ${
                        order.status === "delivered" ? "bg-green-600/20 text-green-400" :
                        order.status === "shipped" ? "bg-blue-600/20 text-blue-400" :
                        order.status === "confirmed" ? "bg-purple-600/20 text-purple-400" :
                        "bg-yellow-600/20 text-yellow-400"
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="border-t border-slate-700 pt-4">
                      <p className="text-slate-400 text-sm mb-2">Items: {order.items.length}</p>
                      <p className="text-white font-bold text-lg">
                        Total: ₹{order.totalAmount.toLocaleString()}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;