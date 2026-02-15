// /src/components/products/ProductCard.tsx
// ✅ PRODUCTION-READY UNIFIED LUXURY PRODUCT CARD

import { useState } from 'react';
import { Heart, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/contexts/useAuth';
import { useCart } from '@/hooks/useCart';
import { LuxuryCard } from '@/components/ui/LuxuryCard';
import { LuxuryButton } from '@/components/ui/LuxuryButton';

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    description?: string;
    price: number;
    originalPrice?: number;
    imageUrl?: string;
    image?: string;
    stock: number;
  };
  onSelect: (product) => void;
}

export const ProductCard = ({ product, onSelect }: ProductCardProps) => {
  const { user } = useAuth();
  const { addItem } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const handleAddToCart = async () => {
    if (!user) {
      setLoginModalOpen(true);
      return;
    }

    try {
      setLoading(true);
      await addItem(product._id, 1);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setLoading(false);
    }
  };

  // Placeholder image generation
  const getPlaceholderImage = (name: string) => {
    const colors = ['C6A75E', 'B76E79', '7A1F3D', 'A8893D', 'E8E2D8'];
    const hashCode = name
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const color = colors[hashCode % colors.length];
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='400'%3E%3Crect fill='%23${color}' width='300' height='400'/%3E%3Ctext x='50%' y='50%' font-size='18' fill='%23F5F1EA' text-anchor='middle' dy='.3em' font-family='Playfair Display, serif'%3E${name
      .substring(0, 12)
      .toUpperCase()}%3C/text%3E%3C/svg%3E`;
  };

  const displayImage =
    product.imageUrl || product.image || getPlaceholderImage(product.name);

  return (
    <>
      <LuxuryCard
        interactive={true}
        className="overflow-hidden flex flex-col h-full group"
      >
        {/* Image Container - Large & Dominant */}
        <div className="relative overflow-hidden bg-[var(--bg-soft)] aspect-[3/4] mb-[var(--spacing-lg)]">
          <img
            src={displayImage}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-[var(--transition-normal)] group-hover:scale-105"
            onClick={() => onSelect(product)}
            onError={(e) => {
              e.currentTarget.src = getPlaceholderImage(product.name);
            }}
          />

          {/* Wishlist Button - Minimal */}
          <button
            onClick={() => setIsWishlisted(!isWishlisted)}
            className="absolute top-[var(--spacing-lg)] right-[var(--spacing-lg)] bg-[var(--bg-primary)]/90 hover:bg-[var(--bg-primary)] p-[var(--spacing-md)] rounded-full transition-all duration-[var(--transition-fast)] shadow-[var(--shadow-sm)]"
            aria-label="Toggle wishlist"
          >
            <Heart
              className={`w-5 h-5 transition-all ${
                isWishlisted
                  ? 'fill-[var(--accent-rose)] text-[var(--accent-rose)]'
                  : 'text-[var(--text-secondary)]'
              }`}
            />
          </button>

          {/* Stock Badge - If Low */}
          {product.stock > 0 && product.stock < 5 && (
            <div className="absolute top-[var(--spacing-lg)] left-[var(--spacing-lg)] bg-[var(--warning)] text-[var(--bg-primary)] text-xs font-semibold px-[var(--spacing-md)] py-[var(--spacing-sm)] rounded-[var(--radius-lg)]">
              Low Stock
            </div>
          )}

          {/* Out of Stock - If None */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-[var(--bg-primary)]/40 flex items-center justify-center">
              <span className="text-[var(--text-primary)] font-semibold text-lg">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Content - Minimal */}
        <div className="flex-1 flex flex-col justify-between">
          {/* Title & Description */}
          <div>
            <h3
              className="font-serif text-lg font-semibold text-[var(--text-primary)] mb-[var(--spacing-sm)] cursor-pointer hover:text-[var(--accent-gold)] transition-colors line-clamp-2"
              onClick={() => onSelect(product)}
            >
              {product.name}
            </h3>

            {product.description && (
              <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-[var(--spacing-md)]">
                {product.description}
              </p>
            )}
          </div>

          {/* Price - Bold */}
          <div className="mb-[var(--spacing-lg)] border-t border-[var(--border-soft)] pt-[var(--spacing-md)]">
            <p className="text-2xl font-bold text-[var(--accent-gold)]">
              ₹{product.price.toLocaleString()}
            </p>
            {product.originalPrice && (
              <p className="text-sm text-[var(--text-muted)] line-through">
                ₹{product.originalPrice.toLocaleString()}
              </p>
            )}
          </div>

          {/* Add to Cart Button */}
          <LuxuryButton
            onClick={handleAddToCart}
            disabled={loading || product.stock === 0}
            variant="primary"
            size="lg"
            className="w-full gap-2 justify-center"
          >
            <ShoppingCart className="w-4 h-4" />
            {loading ? 'Adding...' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </LuxuryButton>
        </div>
      </LuxuryCard>

      {/* Login Modal */}
      {loginModalOpen && (
        <div className="fixed inset-0 bg-[var(--bg-primary)]/50 backdrop-blur-sm flex items-center justify-center z-50 p-[var(--spacing-lg)]">
          <LuxuryCard
            padding="lg"
            className="max-w-sm w-full"
          >
            <h2 className="text-2xl font-serif font-bold text-[var(--text-primary)] mb-[var(--spacing-lg)]">
              🎉 Join Us!
            </h2>
            <p className="text-[var(--text-secondary)] mb-[var(--spacing-xl)]">
              You need to be logged in to add items to cart. We'd be happy to have you join us!
            </p>
            <div className="flex gap-[var(--spacing-lg)]">
              <LuxuryButton
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={() => setLoginModalOpen(false)}
              >
                Continue Shopping
              </LuxuryButton>
              <LuxuryButton
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => {
                  window.location.href = '/login';
                }}
              >
                Login
              </LuxuryButton>
            </div>
          </LuxuryCard>
        </div>
      )}
    </>
  );
};

export default ProductCard;