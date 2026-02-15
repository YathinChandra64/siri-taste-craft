import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Trash2, 
  ShoppingCart, 
  Lock, 
  Heart, 
  Tag, 
  Truck,
  ShieldCheck,
  ChevronRight,
  Package
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/hooks/useCart";
import { useNavigate } from "react-router-dom";

const ProfessionalCart = () => {
  const { user } = useAuth();
  const { cart, removeItem, updateQuantity } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);

  const cartItems = cart?.items || [];
  const subtotal = cart?.total || 0;
  const shipping = subtotal > 1000 ? 0 : 50;
  const discount = couponApplied ? subtotal * 0.1 : 0; // 10% off
  const total = subtotal + shipping - discount;

  const handleCheckout = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (cartItems.length === 0) {
      return;
    }

    try {
      setLoading(true);
      navigate("/checkout");
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyCoupon = () => {
    if (couponCode.toUpperCase() === "SAVE10") {
      setCouponApplied(true);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Card className="p-12 text-center max-w-md bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
            <ShoppingCart className="w-12 h-12 text-gray-400 dark:text-slate-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
            Your cart is empty
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Add items to your cart to get started
          </p>
          <Button
            onClick={() => navigate("/sarees")}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            Start Shopping
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Shopping Cart
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {cartItems.length} {cartItems.length === 1 ? "item" : "items"} in your cart
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items - Left Side */}
        <div className="lg:col-span-2 space-y-4">
          {/* Free Shipping Banner */}
          {subtotal < 1000 && (
            <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <Truck className="text-blue-600 dark:text-blue-400" size={24} />
                <p className="text-sm text-blue-900 dark:text-blue-300">
                  Add <span className="font-bold">₹{1000 - subtotal}</span> more to get{" "}
                  <span className="font-bold">FREE shipping</span>
                </p>
              </div>
            </Card>
          )}

          {/* Cart Items */}
          {cartItems.map((item) => (
            <Card key={item._id} className="p-6 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
              <div className="flex gap-6">
                {/* Product Image */}
                <div className="flex-shrink-0">
                  <img
                    src={item.saree?.image || item.saree?.imageUrl || "https://via.placeholder.com/150"}
                    alt={item.saree?.name}
                    className="w-32 h-32 object-cover rounded-lg border border-gray-200 dark:border-slate-700"
                  />
                </div>

                {/* Product Details */}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {item.saree?.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {item.saree?.category || "Traditional Saree"}
                      </p>
                      
                      {/* Stock Status */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                          <Package size={12} />
                          In Stock
                        </span>
                        {item.saree?.stock && item.saree.stock < 5 && (
                          <span className="text-xs text-orange-600 dark:text-orange-400">
                            Only {item.saree.stock} left!
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeItem(item._id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove from cart"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>

                  {/* Price & Quantity */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        ₹{((item.saree?.price || 0) * item.quantity).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ₹{item.saree?.price?.toLocaleString()} each
                      </p>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-gray-300 dark:border-slate-600 rounded-lg">
                        <button
                          onClick={() =>
                            updateQuantity(item._id, Math.max(1, item.quantity - 1))
                          }
                          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          −
                        </button>
                        <span className="px-4 py-2 font-medium text-gray-900 dark:text-white border-x border-gray-300 dark:border-slate-600">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item._id, item.quantity + 1)
                          }
                          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 mt-4">
                    <button className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                      <Heart size={16} />
                      Save for later
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Order Summary - Right Side */}
        <div className="lg:col-span-1">
          <Card className="p-6 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Order Summary
            </h2>

            {/* Coupon Code */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Discount Code
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1"
                  disabled={couponApplied}
                />
                <Button
                  onClick={applyCoupon}
                  variant="outline"
                  disabled={couponApplied}
                  className="whitespace-nowrap"
                >
                  {couponApplied ? "Applied" : "Apply"}
                </Button>
              </div>
              {couponApplied && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                  <Tag size={14} />
                  10% discount applied!
                </p>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3 pb-4 border-b border-gray-200 dark:border-slate-700">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal ({cartItems.length} items)</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              
              {discount > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Discount (10%)</span>
                  <span>-₹{discount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  Shipping
                  {shipping === 0 && (
                    <Truck size={14} className="text-green-600" />
                  )}
                </span>
                <span className={shipping === 0 ? "text-green-600 dark:text-green-400 font-medium" : ""}>
                  {shipping === 0 ? "FREE" : `₹${shipping}`}
                </span>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center py-4 border-b border-gray-200 dark:border-slate-700">
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                Total
              </span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{total.toLocaleString()}
              </span>
            </div>

            {/* Checkout Button */}
            <Button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-6 text-lg"
            >
              {!user ? (
                <>
                  <Lock size={20} />
                  Login to Checkout
                </>
              ) : (
                <>
                  Proceed to Checkout
                  <ChevronRight size={20} />
                </>
              )}
            </Button>

            {!user && (
              <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-3">
                Sign in to checkout faster
              </p>
            )}

            {/* Trust Badges */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <ShieldCheck size={20} className="text-green-600 dark:text-green-400" />
                <span>Secure checkout</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <Truck size={20} className="text-blue-600 dark:text-blue-400" />
                <span>Free shipping on orders above ₹1000</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalCart;