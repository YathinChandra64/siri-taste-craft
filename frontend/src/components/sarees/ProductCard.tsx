import React, { useState } from 'react';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
import { colors } from '@/design/colors';
import { spacing } from '@/design/spacing';

type Product = {
  _id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  averageRating?: number;
  reviewCount?: number;
  stock?: number;
  originalPrice?: number;
};

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onWishlistToggle: (productId: string, wishlisted: boolean) => void;
  isInCart?: boolean;
}

export const PremiumProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onWishlistToggle,
  isInCart = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsWishlisted(!isWishlisted);
    onWishlistToggle(product._id, !isWishlisted);
  };

  const outOfStock = product.stock === 0;

  return (
    <div
      className="premium-card"
      style={{
        backgroundColor: colors.bg.secondary,
        borderRadius: '8px',
        overflow: 'hidden',
        border: `1px solid ${colors.bg.border}`,
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isHovered
          ? `0 8px 24px ${colors.accent.gold}26`
          : '0 2px 4px rgba(0, 0, 0, 0.2)',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* IMAGE SECTION - 220px height, 4:5.5 ratio */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '220px',
          backgroundColor: colors.bg.tertiary,
          overflow: 'hidden',
        }}
      >
        <img
          src={product.imageUrl}
          alt={product.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            transition: 'transform 0.3s ease-out',
            transform: isHovered ? 'scale(1.08)' : 'scale(1)',
          }}
        />

        {/* QUICK VIEW OVERLAY */}
        {!outOfStock && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.3s ease 0.1s',
            }}
          >
            <button
              style={{
                padding: '8px 16px',
                backgroundColor: colors.accent.gold,
                color: colors.text.primary,
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Eye size={14} />
              Quick View
            </button>
          </div>
        )}

        {/* DISCOUNT BADGE */}
        {discount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '-16px',
              right: '-16px',
              width: '48px',
              height: '48px',
              backgroundColor: `linear-gradient(135deg, ${colors.accent.red}, #FF8A80)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: 'rotate(45deg)',
              fontSize: '12px',
              fontWeight: '700',
              color: 'white',
              boxShadow: `0 2px 8px ${colors.accent.red}4D`,
              zIndex: 6,
            }}
          >
            -{discount}%
          </div>
        )}

        {/* OUT OF STOCK BADGE */}
        {outOfStock && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>⊗</div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: colors.accent.red }}>
              Out of Stock
            </div>
          </div>
        )}
      </div>

      {/* CONTENT SECTION */}
      <div style={{ padding: spacing.md }}>
        {/* CATEGORY TAG */}
        <div
          style={{
            fontSize: '10px',
            fontWeight: '600',
            textTransform: 'uppercase',
            color: `rgba(218, 165, 105, 0.6)`,
            letterSpacing: '0.5px',
            marginBottom: spacing.xs,
          }}
        >
          {product.category}
        </div>

        {/* TITLE - 2 lines max */}
        <h3
          style={{
            fontSize: '14px',
            fontWeight: '500',
            color: colors.text.primary,
            lineHeight: '1.4',
            marginBottom: spacing.sm,
            height: '32px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {product.name}
        </h3>

        {/* RATING */}
        <div
          style={{
            fontSize: '12px',
            color: `rgba(245, 245, 245, 0.7)`,
            marginBottom: spacing.md,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>★ {product.averageRating || 0}</span>
          <span>({product.reviewCount || 0})</span>
          <span>|</span>
          <span style={{ cursor: 'pointer' }}>Size</span>
        </div>

        {/* PRICE */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: spacing.md,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: colors.accent.gold,
            }}
          >
            ₹{product.price.toLocaleString()}
          </span>
          {product.originalPrice && (
            <>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '400',
                  textDecoration: 'line-through',
                  color: `rgba(245, 245, 245, 0.5)`,
                }}
              >
                ₹{product.originalPrice.toLocaleString()}
              </span>
              {discount > 0 && (
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: colors.accent.red,
                  }}
                >
                  -{discount}%
                </span>
              )}
            </>
          )}
        </div>

        {/* CTA BUTTONS */}
        <div style={{ display: 'flex', gap: spacing.sm }}>
          <button
            onClick={() => onAddToCart(product)}
            disabled={outOfStock}
            style={{
              flex: 1,
              padding: '8px 12px',
              height: '36px',
              background: outOfStock
                ? `rgba(245, 245, 245, 0.2)`
                : `linear-gradient(135deg, ${colors.accent.purple}, ${colors.accent.purpleLight})`,
              color: colors.text.primary,
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
              cursor: outOfStock ? 'not-allowed' : 'pointer',
              opacity: outOfStock ? 0.5 : 1,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
            onMouseEnter={(e) => {
              if (!outOfStock) {
                (e.target as HTMLButtonElement).style.transform = 'scale(1.02)';
                (e.target as HTMLButtonElement).style.boxShadow = `0 6px 16px ${colors.accent.purple}4D`;
              }
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.transform = 'scale(1)';
              (e.target as HTMLButtonElement).style.boxShadow = 'none';
            }}
          >
            <ShoppingBag size={16} />
            {isInCart ? 'In Cart' : 'Add'}
          </button>

          <button
            onClick={handleWishlist}
            style={{
              width: '36px',
              height: '36px',
              backgroundColor: isWishlisted
                ? `rgba(255, 107, 107, 0.1)`
                : `rgba(218, 165, 105, 0.1)`,
              border: `1px solid ${isWishlisted ? colors.accent.red : `rgba(218, 165, 105, 0.2)`}`,
              borderRadius: '4px',
              color: isWishlisted ? colors.accent.red : colors.accent.gold,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              background: isWishlisted
                ? `rgba(255, 107, 107, 0.1)`
                : `rgba(218, 165, 105, 0.1)`,
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.transform = 'scale(1.05)';
              (e.target as HTMLButtonElement).style.borderColor = colors.accent.red;
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.transform = 'scale(1)';
            }}
            title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <Heart
              size={18}
              fill={isWishlisted ? colors.accent.red : 'none'}
              color={isWishlisted ? colors.accent.red : colors.accent.gold}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PremiumProductCard;