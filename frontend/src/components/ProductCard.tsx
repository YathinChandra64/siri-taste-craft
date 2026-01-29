import { useState } from "react";
import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/useAuth";
import { useCart } from "@/hooks/useCart";
import { Card } from "@/components/ui/card";

const ProductCard = ({ product, onSelect }) => {
  const { user } = useAuth();
  const { addItem } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const handleAddToCart = async () => {
    // ✅ Check if user is logged in
    if (!user) {
      setLoginModalOpen(true);
      return;
    }

    try {
      setLoading(true);
      await addItem(product._id, 1);
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setLoading(false);
    }
  };

  // Generate colored placeholder if image fails to load
  const getPlaceholderImage = (name: string) => {
    const colors = ['8B4513', 'C71585', 'FF1493', 'DA70D6', 'DDA0DD'];
    const hashCode = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const color = colors[hashCode % colors.length];
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='400'%3E%3Crect fill='%23${color}' width='300' height='400'/%3E%3Ctext x='50%' y='50%' font-size='20' fill='white' text-anchor='middle' dy='.3em' font-family='Arial'%3E${name.substring(0, 5).toUpperCase()}%3C/text%3E%3C/svg%3E`;
  };

  return (
    <>
      <Card className="bg-slate-800 border-slate-700 overflow-hidden hover:border-purple-600 transition-all hover:shadow-xl hover:shadow-purple-600/20 group cursor-pointer">
        {/* Image Container */}
        <div className="relative overflow-hidden h-64 bg-slate-700">
          <img
            src={product.imageUrl || product.image || getPlaceholderImage(product.name)}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
            onClick={() => onSelect(product)}
            onError={(e) => {
              e.currentTarget.src = getPlaceholderImage(product.name);
            }}
          />

          {/* Wishlist Button */}
          <button
            onClick={() => setIsWishlisted(!isWishlisted)}
            className="absolute top-3 right-3 bg-white/90 hover:bg-white p-2 rounded-full transition"
          >
            <Heart
              className={`w-4 h-4 ${
                isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600"
              }`}
            />
          </button>

          {/* Stock Badge */}
          {product.stock < 5 && (
            <div className="absolute top-3 left-3 bg-amber-500 text-white text-xs px-2 py-1 rounded">
              Low Stock
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3
            className="font-semibold text-white mb-2 cursor-pointer hover:text-purple-400 transition"
            onClick={() => onSelect(product)}
          >
            {product.name}
          </h3>

          {product.description && (
            <p className="text-slate-400 text-sm mb-3 line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Price */}
          <div className="mb-4">
            <p className="text-2xl font-bold text-purple-400">₹{product.price}</p>
            {product.originalPrice && (
              <p className="text-sm text-slate-400 line-through">
                ₹{product.originalPrice}
              </p>
            )}
          </div>

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            disabled={loading || product.stock === 0}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2 font-medium"
          >
            <ShoppingCart className="w-4 h-4" />
            {loading ? "Adding..." : product.stock === 0 ? "Out of Stock" : "Add to Cart"}
          </Button>
        </div>
      </Card>

      {/* Login Modal */}
      {loginModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-4">🎉 Join Us!</h2>
            <p className="text-slate-300 mb-6">
              You need to be logged in to add items to cart. We'd be happy to have you join us!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setLoginModalOpen(false)}
                className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition"
              >
                Continue Shopping
              </button>
              <a
                href="/login"
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition text-center font-medium"
              >
                Login
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductCard;