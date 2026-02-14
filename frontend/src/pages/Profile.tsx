import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingCart, Download, AlertCircle, Mail, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AnimatedBackground from "@/components/AnimatedBackground";
import { getCart, removeFromCart, CartItem } from "@/utils/cart";
import API from "@/lib/api";
import { AxiosError } from "axios";
import OrderHistorySection from "@/components/profile/OrderHistorySection";
import { Order } from "@/types/profile";

interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  message: string;
  status: "new" | "read" | "replied";
  reply?: string;
  repliedAt?: string;
  read?: boolean;
  createdAt: string;
}

interface SareeProduct {
  _id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

interface APICartItem {
  _id: string;
  saree: {
    _id: string;
    name: string;
    price: number;
    imageUrl?: string;
  };
  quantity: number;
}

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [apiCartItems, setApiCartItems] = useState<APICartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("cart");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [useLocalCart, setUseLocalCart] = useState(true);
  const [sareeMap, setSareeMap] = useState<Record<string, SareeProduct>>({});
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Check authentication
    if (!user) {
      console.log("❌ User not authenticated, redirecting to login");
      navigate("/login");
      return;
    }
    
    console.log("✅ User authenticated:", user);
    setIsInitializing(false);
    
    fetchData();
    fetchUnreadMessages();
    
    // Listen for storage changes (when items added from other tabs/pages)
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [user, navigate]);

  const handleStorageChange = () => {
    // Refresh cart when storage changes
    const localCart = getCart();
    setCartItems(localCart);
  };

  // Fetch all sarees to map IDs and names
  const fetchSarees = async () => {
    try {
      const response = await API.get("/sarees");
      const data = response.data;
      const sarees: SareeProduct[] = Array.isArray(data) ? data : (data.data || data.sarees || []);
      const map: Record<string, SareeProduct> = {};
      if (Array.isArray(sarees)) {
        sarees.forEach((saree: SareeProduct) => {
          map[saree._id] = saree;
        });
      }
      setSareeMap(map);
    } catch (error) {
      console.log("Failed to fetch sarees:", error);
    }
  };

  const fetchUnreadMessages = async () => {
    try {
      const response = await API.get("/contact/customer/notifications");
      const data: ContactMessage[] = response.data.data || response.data;
      if (Array.isArray(data)) {
        // Count messages with replies
        const unreplied = data.filter((msg: ContactMessage) => msg.reply).length;
        setUnreadMessagesCount(unreplied);
      }
    } catch (error) {
      // Silently fail - this endpoint might not exist or user might not have access
      console.log("Could not fetch unread messages (this is okay)");
      setUnreadMessagesCount(0);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // ✅ IMPORTANT: Only fetch if user is authenticated
      if (!user) {
        console.warn("⚠️ User not authenticated - using local cart only");
        const localCart = getCart();
        setCartItems(localCart);
        setUseLocalCart(true);
        setLoading(false);
        return;
      }

      console.log("🔄 Fetching profile data for user:", user.email);
      
      // Fetch saree mapping first (this is public, no token needed)
      try {
        console.log("🔄 Fetching sarees...");
        await fetchSarees();
      } catch (sareeError) {
        console.log("⚠️ Could not fetch sarees:", sareeError);
      }
      
      // Always load local cart first
      const localCart = getCart();
      setCartItems(localCart);

      // Try to fetch from API ONLY if user is authenticated
      if (user && localStorage.getItem("authToken")) {
        try {
          console.log("🔄 Fetching cart from API...");
          const cartRes = await API.get("/cart");
          const cartData = cartRes.data;
          const apiItems = Array.isArray(cartData.cartItems) ? cartData.cartItems : (cartData.data || []);
          
          console.log("✅ Cart fetched successfully:", apiItems.length, "items");
          setApiCartItems(apiItems);
          if (apiItems.length > 0) {
            setUseLocalCart(false);
          }
        } catch (apiError) {
          console.log("⚠️ Could not fetch API cart, using local cart instead");
          setUseLocalCart(true);
          setApiCartItems([]);
        }

        // Fetch orders
        try {
          console.log("🔄 Fetching orders...");
          const ordersRes = await API.get("/orders/my-orders");
          const ordersData = ordersRes.data;
          console.log("✅ Orders fetched successfully");
          // ✅ FIXED: Cast the orders to proper Order type
          setOrders((ordersData.orders || []) as Order[]);
        } catch (orderError) {
          console.log("⚠️ Could not fetch orders:", orderError);
          setOrders([]);
        }
      } else {
        console.log("⚠️ No token found, skipping API calls");
        setUseLocalCart(true);
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

  const handleRemoveFromCart = (itemId: string) => {
    if (useLocalCart) {
      removeFromCart(itemId);
      const updatedCart = getCart();
      setCartItems(updatedCart);
      toast({
        title: "Removed",
        description: "Item removed from cart"
      });
    }
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (useLocalCart && newQuantity > 0) {
      const cart = getCart();
      const itemIndex = cart.findIndex(item => item.id === itemId);
      if (itemIndex !== -1) {
        cart[itemIndex].quantity = newQuantity;
        localStorage.setItem('cart', JSON.stringify(cart));
        setCartItems(cart);
      }
    }
  };

  const displayItems = useLocalCart ? cartItems : apiCartItems;

  const totalPrice = useLocalCart 
    ? cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    : apiCartItems.reduce((sum, item) => sum + (item.saree.price * item.quantity), 0);

  const handleProceedToCheckout = async () => {
    if (displayItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before checkout",
        variant: "destructive"
      });
      return;
    }

    setIsCheckingOut(true);
    try {
      // ✅ FIXED: Pass cart data to checkout page
      navigate("/checkout", {
        state: {
          cartItems: useLocalCart 
            ? cartItems.map(item => ({
                _id: item.id,
                saree: {
                  _id: item.id,
                  name: item.name,
                  price: item.price,
                },
                quantity: item.quantity
              }))
            : apiCartItems,
          totalAmount: totalPrice,
          isLocalCart: useLocalCart
        }
      });
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description: "Failed to proceed to checkout",
        variant: "destructive"
      });
      setIsCheckingOut(false);
    }
  };

  const getPlaceholderImage = (name: string) => {
    const colors = ["bg-red-500", "bg-blue-500", "bg-purple-500", "bg-pink-500"];
    const hash = name.charCodeAt(0);
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23${["FF0000", "0000FF", "800080", "FFC0CB"][hash % 4]}' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='white'%3E${encodeURIComponent(name.substring(0, 20))}%3C/text%3E%3C/svg%3E`;
  };

  // ✅ Show loading while checking authentication
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AnimatedBackground />
      
      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">My Account</h1>
              <p className="text-slate-400">Welcome back, {user?.name || "Guest"}!</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              {unreadMessagesCount > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg gap-2 flex items-center"
                >
                  <Bell className="w-5 h-5" />
                  <span>New replies: {unreadMessagesCount}</span>
                </motion.button>
              )}
              <Button
                onClick={() => navigate("/messages")}
                className="bg-purple-600 hover:bg-purple-700 gap-2"
              >
                <Mail className="w-5 h-5" />
                Messages
              </Button>
              <Button
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                variant="destructive"
              >
                Logout
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Cart Source Indicator */}
        {displayItems.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-blue-600/20 border border-blue-500/50">
            <p className="text-sm text-blue-300">
              {useLocalCart ? "📱 Local Cart" : "☁️ Server Cart"} - {displayItems.length} items
            </p>
          </div>
        )}

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
            Shopping Cart ({displayItems.length})
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
              {displayItems.length === 0 ? (
                <Card className="bg-slate-800 border-slate-700 p-8 text-center">
                  <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 mb-4">Your cart is empty</p>
                  <Button onClick={() => navigate("/sarees")} className="bg-purple-600 hover:bg-purple-700">
                    Continue Shopping
                  </Button>
                </Card>
              ) : (
                displayItems.map((item) => (
                  <motion.div
                    key={useLocalCart ? item.id : (item as APICartItem)._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="bg-slate-800 border-slate-700 p-4 flex gap-4">
                      <div className="relative w-24 h-24 flex-shrink-0">
                        <img
                          src={useLocalCart 
                            ? item.image 
                            : (item as APICartItem).saree.imageUrl || getPlaceholderImage(useLocalCart ? item.name : (item as APICartItem).saree.name)
                          }
                          alt={useLocalCart ? item.name : (item as APICartItem).saree.name}
                          className="w-24 h-24 object-cover rounded bg-slate-700"
                          onError={(e) => {
                            const name = useLocalCart ? item.name : (item as APICartItem).saree.name;
                            e.currentTarget.src = getPlaceholderImage(name);
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">{useLocalCart ? item.name : (item as APICartItem).saree.name}</h3>
                        <p className="text-slate-400 text-sm">₹{useLocalCart ? item.price : (item as APICartItem).saree.price}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <button
                            onClick={() => handleUpdateQuantity(useLocalCart ? item.id : (item as APICartItem)._id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded text-white"
                          >
                            −
                          </button>
                          <span className="text-white w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(useLocalCart ? item.id : (item as APICartItem)._id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded text-white"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold mb-4">
                          ₹{((useLocalCart ? item.price : (item as APICartItem).saree.price) * item.quantity).toLocaleString()}
                        </p>
                        <button
                          onClick={() => handleRemoveFromCart(useLocalCart ? item.id : (item as APICartItem)._id)}
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
            {displayItems.length > 0 && (
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
          // ORDERS TAB - Using OrderHistorySection Component with Tracking Timeline
          <OrderHistorySection orders={orders} />
        )}
      </div>
    </div>
  );
};

export default Profile;