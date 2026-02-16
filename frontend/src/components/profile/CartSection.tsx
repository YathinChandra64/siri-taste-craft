import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Trash2, Plus, Minus, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface CartItemSaree {
  _id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string;
  material?: string;
  color?: string;
}

interface CartItem {
  _id: string;
  user: string;
  saree: CartItemSaree;
  quantity: number;
  addedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface CartSectionProps {
  cartItems?: CartItem[];
  onRefresh?: () => Promise<void>;
}

interface CartResponse {
  success: boolean;
  count: number;
  total: number;
  cartItems: CartItem[];
}

const ProfessionalCart = ({ cartItems: propCartItems = [], onRefresh }: CartSectionProps) => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>(propCartItems);
  const [updating, setUpdating] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);

  // ✅ If no props provided, fetch cart data
  useEffect(() => {
    if (propCartItems.length === 0 && !onRefresh) {
      fetchCartLocal();
    } else {
      setCartItems(propCartItems);
    }
  }, [propCartItems]);

  // ✅ Fallback fetch if props not provided
  const fetchCartLocal = async () => {
    try {
      setLocalLoading(true);
      const response = await fetch("http://localhost:5000/api/cart", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (response.ok) {
        const data: CartResponse = await response.json();
        const items = Array.isArray(data.cartItems) ? data.cartItems : [];
        setCartItems(items);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      setCartItems([]);
    } finally {
      setLocalLoading(false);
    }
  };

  const removeItem = async (cartItemId: string) => {
    try {
      setUpdating(cartItemId);
      const response = await fetch(`http://localhost:5000/api/cart/${cartItemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        console.log("✅ Item removed from cart");
        // If onRefresh provided, use it; otherwise update local state
        if (onRefresh) {
          await onRefresh();
        } else {
          setCartItems(cartItems.filter(item => item._id !== cartItemId));
        }
      }
    } catch (error) {
      console.error("Error removing item:", error);
    } finally {
      setUpdating(null);
    }
  };

  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      await removeItem(cartItemId);
      return;
    }

    try {
      setUpdating(cartItemId);
      const response = await fetch(`http://localhost:5000/api/cart/${cartItemId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (response.ok) {
        console.log("✅ Quantity updated");
        // If onRefresh provided, use it; otherwise update local state
        if (onRefresh) {
          await onRefresh();
        } else {
          setCartItems(cartItems.map(item =>
            item._id === cartItemId ? { ...item, quantity: newQuantity } : item
          ));
        }
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
    } finally {
      setUpdating(null);
    }
  };

  const displayItems = propCartItems.length > 0 ? cartItems : cartItems;
  
  // ✅ FIXED: Safely calculate subtotal with proper null checks
  const subtotal = displayItems.reduce((sum, item) => {
    if (!item || !item.saree || !item.saree.price) return sum;
    return sum + (item.saree.price * item.quantity);
  }, 0);
  
  const shipping = subtotal > 1000 ? 0 : 50;
  const total = subtotal + shipping;

  if (localLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (displayItems.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Shopping Cart (0 items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground text-lg font-medium">Your cart is empty</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add some beautiful sarees to get started!
              </p>
              <Button
                onClick={() => navigate("/sarees")}
                className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Continue Shopping
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items - Left Side */}
        <div className="lg:col-span-2">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Shopping Cart ({displayItems.length} items)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Free Shipping Alert */}
              {subtotal < 1000 && subtotal > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-blue-900 dark:text-blue-300">
                      Add <span className="font-bold">₹{(1000 - subtotal).toLocaleString()}</span> more to get{" "}
                      <span className="font-bold">FREE shipping</span>
                    </p>
                  </div>
                </motion.div>
              )}

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {displayItems.map((item, idx) => {
                  // ✅ FIXED: Safely access nested saree data
                  if (!item || !item.saree) {
                    return null; // Skip invalid items
                  }

                  return (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-5 border-2 border-muted-foreground/20 rounded-xl hover:border-primary/50 hover:bg-muted/30 transition-all duration-200 group"
                    >
                      {/* Top Row: Product Image and Details */}
                      <div className="flex gap-4 mb-4">
                        <img
                          src={item.saree.imageUrl || "https://via.placeholder.com/120"}
                          alt={item.saree.name}
                          className="w-24 h-24 object-cover rounded-lg border border-muted-foreground/20"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://via.placeholder.com/120";
                          }}
                        />
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-white mb-1">
                            {item.saree.name || "Unknown Product"}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {item.saree.category || "Traditional Saree"}
                          </p>
                          {item.saree.material && (
                            <p className="text-xs text-muted-foreground">
                              Material: {item.saree.material}
                            </p>
                          )}
                          {item.saree.color && (
                            <p className="text-xs text-muted-foreground">
                              Color: {item.saree.color}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeItem(item._id)}
                          disabled={updating === item._id}
                          className="p-2 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50"
                          title="Remove from cart"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>

                      {/* Middle Row: Price and Stock Status */}
                      <div className="flex justify-between items-center mb-4 py-3 border-y border-muted-foreground/10">
                        <div className="flex gap-6">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">PRICE</p>
                            <p className="font-bold text-white">
                              ₹{(item.saree.price || 0).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">SUBTOTAL</p>
                            <p className="font-bold text-primary text-lg">
                              ₹{((item.saree.price || 0) * (item.quantity || 1)).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">STOCK</p>
                            <Badge variant={(item.saree.stock || 0) > 0 ? "default" : "destructive"}>
                              {(item.saree.stock || 0) > 0 ? `${item.saree.stock} left` : "Out of Stock"}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Row: Quantity Selector */}
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Quantity</p>
                        <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-2">
                          <button
                            onClick={() => updateQuantity(item._id, (item.quantity || 1) - 1)}
                            disabled={updating === item._id || (item.quantity || 1) <= 1}
                            className="p-1 hover:bg-muted transition-colors disabled:opacity-50"
                          >
                            <Minus size={18} className="text-white" />
                          </button>
                          <span className="w-8 text-center font-bold text-white">
                            {item.quantity || 1}
                          </span>
                          <button
                            onClick={() => updateQuantity(item._id, (item.quantity || 1) + 1)}
                            disabled={updating === item._id || (item.quantity || 1) >= (item.saree.stock || 0)}
                            className="p-1 hover:bg-muted transition-colors disabled:opacity-50"
                          >
                            <Plus size={18} className="text-white" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary - Right Side */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="shadow-card sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Subtotal */}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-bold text-white">
                      ₹{subtotal.toLocaleString()}
                    </span>
                  </div>

                  {/* Shipping */}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className={`font-bold ${shipping === 0 ? "text-green-400" : "text-white"}`}>
                      {shipping === 0 ? "FREE" : `₹${shipping}`}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-muted-foreground/20 pt-4" />

                  {/* Total */}
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">TOTAL</span>
                    <span className="text-2xl font-bold text-primary">
                      ₹{total.toLocaleString()}
                    </span>
                  </div>

                  {/* Checkout Button */}
                  <Button
                    onClick={() => navigate("/checkout")}
                    className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-6 text-lg"
                  >
                    Proceed to Checkout
                  </Button>

                  {/* Continue Shopping */}
                  <Button
                    onClick={() => navigate("/sarees")}
                    variant="outline"
                    className="w-full"
                  >
                    Continue Shopping
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfessionalCart;