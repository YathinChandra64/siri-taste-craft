import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingCart, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AnimatedBackground from "@/components/AnimatedBackground";
import { getCart, removeFromCart } from "@/utils/cart";

interface OrderItem {
  product: string;
  name: string;
  quantity: number;
  price: number;
}

interface LocalCartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  type: "saree" | "sweet";
  quantity: number;
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

interface Order {
  _id: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt: string;
}

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [cartItems, setCartItems] = useState<LocalCartItem[]>([]);
  const [apiCartItems, setApiCartItems] = useState<APICartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("cart");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [useLocalCart, setUseLocalCart] = useState(true);
  const [sareeMap, setSareeMap] = useState<Record<string, SareeProduct>>({});

  useEffect(() => {
    // Check authentication
    if (!user) {
      navigate("/login");
      return;
    }
    
    fetchData();
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
      const response = await fetch("http://localhost:5000/api/sarees");
      if (response.ok) {
        const sarees: SareeProduct[] = await response.json();
        const map: Record<string, SareeProduct> = {};
        sarees.forEach(saree => {
          map[saree._id] = saree;
        });
        setSareeMap(map);
        console.log("✅ Saree map loaded:", Object.keys(map).length, "sarees");
      }
    } catch (error) {
      console.log("Failed to fetch sarees:", error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      // ✅ Use correct token key "authToken"
      const authToken = localStorage.getItem("authToken");
      
      console.log("📋 Auth Token Check:");
      console.log("  - User from context:", !!user);
      console.log("  - Token in localStorage:", !!authToken);
      console.log("  - Token preview:", authToken ? authToken.substring(0, 20) + "..." : "NONE");
      
      // Fetch saree mapping first
      await fetchSarees();
      
      // Always load local cart first (this is the primary source)
      const localCart = getCart();
      setCartItems(localCart);

      // Try to fetch from API if user is authenticated
      if (authToken && user) {
        try {
          const cartRes = await fetch("http://localhost:5000/api/cart", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json"
            }
          });

          if (cartRes.ok) {
            const cartData = await cartRes.json();
            const apiItems = Array.isArray(cartData.cartItems) ? cartData.cartItems : [];
            setApiCartItems(apiItems);
            if (apiItems.length > 0) {
              setUseLocalCart(false);
            }
          }
        } catch (apiError) {
          console.log("API cart fetch error:", apiError);
          setUseLocalCart(true);
        }

        // Fetch orders
        try {
          const ordersRes = await fetch("http://localhost:5000/api/orders/my-orders", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json"
            }
          });

          if (ordersRes.ok) {
            const ordersData = await ordersRes.json();
            setOrders(ordersData.orders || []);
          }
        } catch (orderError) {
          console.log("Orders fetch error:", orderError);
        }
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
      removeFromCart(itemId, "saree");
      const updatedCart = getCart();
      setCartItems(updatedCart);
      toast({
        title: "Removed",
        description: "Item removed from cart"
      });
    }
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    if (useLocalCart) {
      const updatedCart = cartItems.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
      setCartItems(updatedCart);
      
      // Update localStorage
      const cartKey = `cart_${user?.id || "guest"}`;
      localStorage.setItem(cartKey, JSON.stringify(updatedCart));
    }
  };

  const handleProceedToCheckout = async () => {
    const itemsToCheckout = useLocalCart ? cartItems : apiCartItems;
    
    if (itemsToCheckout.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsCheckingOut(true);
      // ✅ Use correct token key "authToken"
      const authToken = localStorage.getItem("authToken");

      if (!authToken) {
        toast({
          title: "Authentication Required",
          description: "Please login to continue",
          variant: "destructive"
        });
        navigate("/login");
        return;
      }

      let orderItems: OrderItem[];
      let totalAmount: number;

      if (useLocalCart) {
        // ✅ FIXED: Map local cart items to use actual MongoDB IDs from sareeMap
        orderItems = cartItems.map(item => {
          // Try to find the actual saree in the map by name
          const saree = Object.values(sareeMap).find(s => s.name === item.name);
          const mongoId = saree ? saree._id : item.id; // Use actual MongoDB ID if found
          
          return {
            product: mongoId,
            name: item.name,
            quantity: item.quantity,
            price: item.price
          };
        });
        totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      } else {
        orderItems = apiCartItems.map(item => ({
          product: item.saree._id,
          name: item.saree.name,
          quantity: item.quantity,
          price: item.saree.price
        }));
        totalAmount = apiCartItems.reduce((sum, item) => sum + (item.saree.price * item.quantity), 0);
      }

      console.log("📤 Checkout Details:");
      console.log("  - Order Items:", orderItems);
      console.log("  - Total Amount:", totalAmount);
      console.log("  - Auth Token:", authToken ? authToken.substring(0, 20) + "..." : "MISSING");
      console.log("  - Using Cart Type:", useLocalCart ? "LOCAL" : "API");
      console.log("  - Saree Map Size:", Object.keys(sareeMap).length);

      const response = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          items: orderItems,
          totalAmount: totalAmount
        })
      });

      console.log("📤 API Response Status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ API Error:", errorData);
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success || data._id) {
        console.log("✅ Order Created:", data._id);
        
        toast({
          title: "Success",
          description: "Order created! Proceeding to payment...",
        });

        // Clear cart
        if (useLocalCart) {
          const cartKey = `cart_${user?.id || "guest"}`;
          localStorage.removeItem(cartKey);
        }
        setCartItems([]);
        setApiCartItems([]);
        
        navigate("/payment", { 
          state: { 
            orderId: data._id || data.order._id,
            totalAmount: totalAmount,
            items: orderItems
          } 
        });
      } else {
        throw new Error(data.message || "Failed to create order");
      }
    } catch (error) {
      console.error("❌ Checkout Error:", error);
      
      toast({
        title: "Checkout Failed",
        description: error instanceof Error ? error.message : "Failed to process checkout",
        variant: "destructive"
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const displayItems = useLocalCart ? cartItems : apiCartItems;
  const totalPrice = useLocalCart 
    ? cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    : apiCartItems.reduce((sum, item) => sum + (item.saree.price * item.quantity), 0);

  // Generate colored placeholder if image fails to load
  const getPlaceholderImage = (name: string) => {
    const colors = ['8B4513', 'C71585', 'FF1493', 'DA70D6', 'DDA0DD'];
    const hashCode = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const color = colors[hashCode % colors.length];
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23${color}' width='100' height='100'/%3E%3Ctext x='50%' y='50%' font-size='14' fill='white' text-anchor='middle' dy='.3em'%3E${name.substring(0, 3).toUpperCase()}%3C/text%3E%3C/svg%3E`;
  };

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