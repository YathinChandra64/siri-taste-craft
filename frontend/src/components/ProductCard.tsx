import React, { useState } from "react";
import { Heart, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
  rating?: number;
  reviews?: number;
  inStock?: boolean;
  onAddToCart?: () => void;
  onWishlist?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  price,
  image,
  description,
  rating = 4.5,
  reviews = 0,
  inStock = true,
  onAddToCart,
  onWishlist,
}) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    onWishlist?.();
  };

  return (
    <motion.div
      className="bg-bg-card rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-border-light group"
      whileHover={{ y: -4 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Image Container */}
      <div className="relative h-64 bg-bg-secondary overflow-hidden">
        {/* Loading skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-bg-secondary via-white to-bg-secondary animate-pulse" />
        )}

        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onLoad={() => setImageLoaded(true)}
        />

        {/* Stock Badge */}
        {!inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold text-lg">Out of Stock</span>
          </div>
        )}

        {/* Wishlist Button */}
        <motion.button
          onClick={handleWishlist}
          className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Add to wishlist"
        >
          <Heart
            size={20}
            className={`transition-colors ${
              isWishlisted
                ? "fill-error text-error"
                : "text-text-secondary hover:text-error"
            }`}
          />
        </motion.button>
      </div>

      {/* Content Container */}
      <div className="p-4 space-y-3">
        {/* Product Name - Dark text for readability */}
        <h3 className="text-sm font-semibold text-text-primary line-clamp-2 hover:text-primary-purple transition-colors">
          {name}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-xs text-text-secondary line-clamp-2">
            {description}
          </p>
        )}

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex text-accent-gold">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-sm">
                {i < Math.floor(rating) ? "★" : "☆"}
              </span>
            ))}
          </div>
          <span className="text-xs text-text-muted">
            ({reviews} reviews)
          </span>
        </div>

        {/* Price */}
        <div className="pt-2 border-t border-border-light">
          <p className="text-lg font-bold text-primary-purple">
            ₹{price.toLocaleString("en-IN")}
          </p>
        </div>

        {/* Add to Cart Button */}
        <motion.button
          onClick={onAddToCart}
          disabled={!inStock}
          className={`w-full py-2 rounded-md font-medium flex items-center justify-center gap-2 transition-all ${
            inStock
              ? "bg-primary-purple text-white hover:bg-primary-purple-dark active:bg-primary-purple-dark shadow-md hover:shadow-lg"
              : "bg-text-muted text-white opacity-50 cursor-not-allowed"
          }`}
          whileHover={inStock ? { scale: 1.02 } : {}}
          whileTap={inStock ? { scale: 0.98 } : {}}
        >
          <ShoppingCart size={16} />
          {inStock ? "Add to Cart" : "Out of Stock"}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ProductCard;