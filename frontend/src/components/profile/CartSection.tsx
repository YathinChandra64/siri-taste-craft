import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingCart, Lock } from "lucide-react";
import { useAuth } from "@/contexts/useAuth";
import { useCart } from "@/hooks/useCart";

const CartSection = () => {
  const { user } = useAuth();
  const { cartItems, removeFromCart, updateCartQuantity } = useCart();
  const [loading, setLoading] = useState(false);

  const totalPrice = cartItems.reduce((sum, item) => sum + (item.saree?.price || 0) * item.quantity, 0);

  const handleCheckout = async () => {
    // ✅ AUTH CHECK for checkout
    if (!user) {
      alert("❌ You need to be logged in to proceed with checkout. We'd be happy to have you join us!");
      window.location.href = "/login";
      return;
    }

    if (cartItems.length === 0) {
      alert("Your cart is empty");
      return;
    }

    try {
      setLoading(true);
      // Proceed to checkout/payment page
      window.location.href = "/checkout";
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Error processing checkout");
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Your Cart
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">Your cart is empty</p>
          <a href="/sarees" className="text-purple-400 hover:text-purple-300">
            Continue Shopping →
          </a>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Your Cart ({cartItems.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cart Items */}
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {cartItems.map((item) => (
            <div
              key={item._id}
              className="flex items-center gap-4 p-3 bg-slate-700 rounded-lg"
            >
              {/* Product Image */}
              <img
                src={item.saree?.image || "https://via.placeholder.com/80"}
                alt={item.saree?.name}
                className="w-16 h-16 object-cover rounded"
              />

              {/* Product Details */}
              <div className="flex-1">
                <p className="font-semibold text-white">{item.saree?.name}</p>
                <p className="text-sm text-slate-400">
                  ₹{item.saree?.price} × {item.quantity}
                </p>
              </div>

              {/* Quantity Control */}
              <div className="flex items-center gap-2 bg-slate-600 rounded px-2 py-1">
                <button
                  onClick={() =>
                    updateCartQuantity(item._id, Math.max(1, item.quantity - 1))
                  }
                  className="text-slate-300 hover:text-white"
                >
                  −
                </button>
                <span className="text-white w-6 text-center">{item.quantity}</span>
                <button
                  onClick={() =>
                    updateCartQuantity(item._id, item.quantity + 1)
                  }
                  className="text-slate-300 hover:text-white"
                >
                  +
                </button>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => removeFromCart(item._id)}
                className="text-red-400 hover:text-red-300 p-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-slate-600 pt-4">
          {/* Total */}
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-300 font-medium">Total:</span>
            <span className="text-2xl font-bold text-purple-400">
              ₹{totalPrice.toLocaleString()}
            </span>
          </div>

          {/* Checkout Button */}
          <Button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 gap-2"
          >
            {!user ? (
              <>
                <Lock className="w-4 h-4" />
                Login to Checkout
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                Proceed to Checkout
              </>
            )}
          </Button>

          {/* Auth Message */}
          {!user && (
            <p className="text-center text-slate-400 text-sm mt-3 p-3 bg-slate-700 rounded">
              💡 You need to login to complete your purchase
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CartSection;