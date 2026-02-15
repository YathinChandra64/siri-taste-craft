import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import AnimatedBackground from "@/components/AnimatedBackground";
import { StaggerContainer, StaggerItem } from "@/components/StaggerContainer";
import { ShoppingCart, Heart, Share2, Trash2, Check, X, Star, ChevronLeft, ChevronRight, Sliders, Eye } from "lucide-react";
import { addToCart, removeFromCart, getCart } from "@/utils/cart";
import SareeFilters from "@/components/sarees/SareeFilters";
import SareePagination from "@/components/sarees/SareePagination";

// Premium Colors
const colors = {
  bg: {
    primary: '#0D0D0D',
    secondary: '#1A1A1A',
    tertiary: '#252525',
    border: '#2D2D2D',
  },
  text: {
    primary: '#F5F5F5',
    secondary: '#B0B0B0',
    tertiary: '#808080',
  },
  accent: {
    gold: '#DAA569',
    goldBright: '#FFD700',
    goldLight: '#F4D9A8',
    goldMuted: '#8B7355',
    purple: '#7C3AED',
    purpleDark: '#6D28D9',
    purpleLight: '#9333EA',
    red: '#FF6B6B',
    orange: '#FFA500',
  },
};

type Saree = {
  _id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string;
  description: string;
  material?: string;
  color?: string;
  occasion?: string;
  averageRating?: number;
  reviewCount?: number;
  id?: string;
  type?: string;
  originalPrice?: number;
};

type FilterState = {
  priceRange: [number, number];
  categories: string[];
  materials: string[];
  occasions: string[];
  colors: string[];
  availability: string[];
  minRating: number;
  sortBy: string;
};

const ITEMS_PER_PAGE = 8;

// Premium Product Card Component
const PremiumProductCard = ({
  product,
  onAddToCart,
  onWishlistToggle,
  isInCart = false,
  onViewDetails,
}: {
  product: Saree;
  onAddToCart: (product: Saree) => void;
  onWishlistToggle: (productId: string, wishlisted: boolean) => void;
  isInCart?: boolean;
  onViewDetails: (id: string) => void;
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div
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
            onError={(e) => {
              const img = e.currentTarget;
              const colorList = ["8B4513", "C71585", "FF1493", "DA70D6", "DDA0DD"];
              const hashCode = product.name
                .split("")
                .reduce((acc, char) => acc + char.charCodeAt(0), 0);
              const color = colorList[hashCode % colorList.length];
              img.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='500'%3E%3Crect fill='%23${color}' width='500' height='500'/%3E%3Ctext x='50%' y='50%' font-size='24' fill='white' text-anchor='middle' dy='.3em' font-family='Arial'%3E${product.name
                .substring(0, 5)
                .toUpperCase()}%3C/text%3E%3C/svg%3E`;
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
                onClick={() => onViewDetails(product._id)}
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
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.accent.goldBright;
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.accent.gold;
                  e.currentTarget.style.transform = 'scale(1)';
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

          {/* STOCK BADGE */}
          {!outOfStock && product.stock <= 5 && (
            <div
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                padding: '4px 8px',
                backgroundColor: `rgba(255, 165, 0, 0.15)`,
                border: `1px solid ${colors.accent.orange}`,
                borderRadius: '12px',
                fontSize: '9px',
                fontWeight: '600',
                color: colors.accent.orange,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                whiteSpace: 'nowrap',
              }}
            >
              ⚡ Only {product.stock} Left
            </div>
          )}

          {/* CATEGORY BADGE */}
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              padding: '4px 8px',
              backgroundColor: `rgba(218, 165, 105, 0.15)`,
              border: `1px solid rgba(218, 165, 105, 0.4)`,
              borderRadius: '12px',
              fontSize: '9px',
              fontWeight: '600',
              color: colors.accent.gold,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            ✨ {product.category}
          </div>
        </div>

        {/* CONTENT SECTION */}
        <div style={{ padding: '12px' }}>
          {/* CATEGORY TAG */}
          <div
            style={{
              fontSize: '10px',
              fontWeight: '600',
              textTransform: 'uppercase',
              color: `rgba(218, 165, 105, 0.6)`,
              letterSpacing: '0.5px',
              marginBottom: '4px',
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
              marginBottom: '8px',
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
              marginBottom: '12px',
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
              marginBottom: '12px',
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
          <div style={{ display: 'flex', gap: '8px' }}>
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
              <ShoppingCart size={16} />
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
    </motion.div>
  );
};

const Sarees = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // Data states
  const [sarees, setSarees] = useState<Saree[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Saree[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState(getCart());
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 100000],
    categories: [],
    materials: [],
    occasions: [],
    colors: [],
    availability: [],
    minRating: 0,
    sortBy: "newest",
  });

  useEffect(() => {
    fetchSarees();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
    setCurrentPage(1);
  }, [sarees, filters]);

  const fetchSarees = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/sarees");
      if (response.ok) {
        const data = await response.json();
        const sareeList = Array.isArray(data) ? data : (data.data || []);
        const formattedData = sareeList.map((saree) => ({
          ...saree,
          id: saree._id,
          type: "saree",
          averageRating: saree.averageRating || 0,
          reviewCount: saree.reviewCount || 0,
        }));
        setSarees(formattedData);
      }
    } catch (error) {
      console.error("Failed to fetch sarees:", error);
      toast({
        title: "Error",
        description: "Failed to load sarees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProducts = useCallback(() => {
    let filtered = [...sarees];

    filtered = filtered.filter(
      (s) => s.price >= filters.priceRange[0] && s.price <= filters.priceRange[1]
    );

    if (filters.categories.length > 0) {
      filtered = filtered.filter((s) => filters.categories.includes(s.category));
    }

    if (filters.materials.length > 0 && filters.materials[0]) {
      filtered = filtered.filter((s) =>
        s.material && filters.materials.some((m) =>
          s.material.toLowerCase().includes(m.toLowerCase())
        )
      );
    }

    if (filters.occasions.length > 0 && filters.occasions[0]) {
      filtered = filtered.filter((s) =>
        s.occasion && filters.occasions.some((o) =>
          s.occasion.toLowerCase().includes(o.toLowerCase())
        )
      );
    }

    if (filters.colors.length > 0 && filters.colors[0]) {
      filtered = filtered.filter((s) =>
        s.color && filters.colors.some((c) =>
          s.color.toLowerCase().includes(c.toLowerCase())
        )
      );
    }

    if (filters.availability.includes("in-stock")) {
      filtered = filtered.filter((s) => s.stock > 0);
    }
    if (filters.availability.includes("out-of-stock")) {
      filtered = filtered.filter((s) => s.stock === 0);
    }

    if (filters.minRating > 0) {
      filtered = filtered.filter((s) => (s.averageRating || 0) >= filters.minRating);
    }

    switch (filters.sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        filtered.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case "newest":
      default:
        break;
    }

    setFilteredProducts(filtered);
  }, [sarees, filters]);

  const handleAddToCart = (saree: Saree) => {
    const cartItem = {
      id: saree._id,
      name: saree.name,
      price: saree.price,
      image: saree.imageUrl,
      type: "saree" as const,
      quantity: 1,
    };

    addToCart(cartItem);
    setCartItems(getCart());
    setAddedItems((prev) => new Set(prev).add(saree._id));

    toast({
      title: "✨ Added to Cart!",
      description: `${saree.name} is ready to make you look stunning!`,
    });

    setTimeout(() => {
      setAddedItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(saree._id);
        return newSet;
      });
    }, 2000);
  };

  const handleRemoveFromCart = (saree: Saree) => {
    removeFromCart(saree._id, "saree");
    setCartItems(getCart());

    toast({
      title: "Removed from Cart",
      description: "It's okay! We'll keep this beauty available for you. Come back anytime! 💕",
    });
  };

  const handleViewDetails = (sareeId: string) => {
    navigate(`/saree/${sareeId}`);
  };

  const isInCart = (sareeId: string) => {
    return cartItems.some((item) => item.id === sareeId);
  };

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />

      <div className="relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 py-12 px-4 border-b"
        >
          <div className="container mx-auto max-w-7xl">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
              <span className="bg-gradient-saree bg-clip-text text-transparent">
                Saree Collections
              </span>
            </h1>
            <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto">
              Discover our exquisite range of traditional and designer sarees, curated with love for every occasion
            </p>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="container mx-auto max-w-7xl px-4 py-12">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar Filters - Desktop */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="hidden lg:block lg:col-span-1"
            >
              <div className="sticky top-24">
                <SareeFilters
                  filters={filters}
                  onFilterChange={setFilters}
                  sarees={sarees}
                />
              </div>
            </motion.div>

            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-4">
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              >
                <Sliders size={18} />
                Filters & Sort
              </Button>
            </div>

            {/* Mobile Filters Modal */}
            <AnimatePresence>
              {mobileFiltersOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur"
                  onClick={() => setMobileFiltersOpen(false)}
                >
                  <motion.div
                    className="bg-background rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <SareeFilters
                      filters={filters}
                      onFilterChange={setFilters}
                      sarees={sarees}
                    />
                    <Button
                      onClick={() => setMobileFiltersOpen(false)}
                      className="w-full mt-4 bg-gradient-saree text-white"
                    >
                      Apply Filters
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Products Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-3 space-y-8"
            >
              {/* Results Info */}
              {filteredProducts.length > 0 && (
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredProducts.length)} of{" "}
                    {filteredProducts.length} sarees
                  </p>
                </div>
              )}

              {loading ? (
                <div className="flex justify-center items-center min-h-96">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
                  />
                </div>
              ) : filteredProducts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-20"
                >
                  <p className="text-lg text-muted-foreground mb-4">No sarees found matching your filters</p>
                  <Button
                    onClick={() => {
                      setFilters({
                        priceRange: [0, 100000],
                        categories: [],
                        materials: [],
                        occasions: [],
                        colors: [],
                        availability: [],
                        minRating: 0,
                        sortBy: "newest",
                      });
                      setCurrentPage(1);
                    }}
                    className="bg-gradient-saree text-white"
                  >
                    Clear All Filters
                  </Button>
                </motion.div>
              ) : (
                <>
                  {/* Grid - PREMIUM 4 COLUMNS WITH RESPONSIVE */}
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <AnimatePresence>
                      {paginatedProducts.map((saree, index) => (
                        <PremiumProductCard
                          key={saree._id}
                          product={saree}
                          onAddToCart={handleAddToCart}
                          onWishlistToggle={(id, wishlisted) => {
                            console.log('Wishlist toggled:', id, wishlisted);
                          }}
                          isInCart={isInCart(saree._id)}
                          onViewDetails={handleViewDetails}
                        />
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <SareePagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sarees;