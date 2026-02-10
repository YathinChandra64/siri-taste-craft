import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/useAuth";
import AnimatedBackground from "@/components/AnimatedBackground";
import { StaggerContainer, StaggerItem } from "@/components/StaggerContainer";
import { ShoppingCart, Heart, Share2, Trash2, Check, X, Star, ChevronLeft, ChevronRight, Sliders } from "lucide-react";
import { addToCart, removeFromCart, getCart } from "@/utils/cart";
import SareeFilters from "@/components/sarees/SareeFilters";
import SareePagination from "@/components/sarees/SareePagination";

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
    setCurrentPage(1); // Reset to first page when filters change
  }, [sarees, filters]);

  const fetchSarees = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/sarees");
      if (response.ok) {
        const data = await response.json();
        // Extract the data array from the API response object
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

    // Price filter
    filtered = filtered.filter(
      (s) => s.price >= filters.priceRange[0] && s.price <= filters.priceRange[1]
    );

    // Category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter((s) => filters.categories.includes(s.category));
    }

    // Material filter
    if (filters.materials.length > 0 && filters.materials[0]) {
      filtered = filtered.filter((s) =>
        s.material && filters.materials.some((m) =>
          s.material.toLowerCase().includes(m.toLowerCase())
        )
      );
    }

    // Occasion filter
    if (filters.occasions.length > 0 && filters.occasions[0]) {
      filtered = filtered.filter((s) =>
        s.occasion && filters.occasions.some((o) =>
          s.occasion.toLowerCase().includes(o.toLowerCase())
        )
      );
    }

    // Color filter
    if (filters.colors.length > 0 && filters.colors[0]) {
      filtered = filtered.filter((s) =>
        s.color && filters.colors.some((c) =>
          s.color.toLowerCase().includes(c.toLowerCase())
        )
      );
    }

    // Availability filter
    if (filters.availability.includes("in-stock")) {
      filtered = filtered.filter((s) => s.stock > 0);
    }
    if (filters.availability.includes("out-of-stock")) {
      filtered = filtered.filter((s) => s.stock === 0);
    }

    // Rating filter
    if (filters.minRating > 0) {
      filtered = filtered.filter((s) => (s.averageRating || 0) >= filters.minRating);
    }

    // Sorting
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

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={14}
            className={i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-1">({rating.toFixed(1)})</span>
      </div>
    );
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
                  {/* Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence>
                      {paginatedProducts.map((saree, index) => (
                        <motion.div
                          key={saree._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ y: -8 }}
                        >
                          <Card className="overflow-hidden h-full flex flex-col hover:shadow-2xl transition-all duration-300 group cursor-pointer">
                            {/* Image Container */}
                            <div
                              className="relative aspect-square overflow-hidden bg-muted"
                              onClick={() => handleViewDetails(saree._id)}
                            >
                              <motion.img
                                src={saree.imageUrl}
                                alt={saree.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                loading="lazy"
                                onError={(e) => {
                                  const img = e.currentTarget;
                                  const colors = ["8B4513", "C71585", "FF1493", "DA70D6", "DDA0DD"];
                                  const hashCode = saree.name
                                    .split("")
                                    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
                                  const color = colors[hashCode % colors.length];
                                  img.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='500'%3E%3Crect fill='%23${color}' width='500' height='500'/%3E%3Ctext x='50%' y='50%' font-size='24' fill='white' text-anchor='middle' dy='.3em' font-family='Arial'%3E${saree.name
                                    .substring(0, 5)
                                    .toUpperCase()}%3C/text%3E%3C/svg%3E`;
                                }}
                              />

                              {/* Stock Badge */}
                              <div className="absolute top-4 right-4">
                                {saree.stock === 0 ? (
                                  <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/90 text-white"
                                  >
                                    Out of Stock
                                  </motion.span>
                                ) : saree.stock <= 5 ? (
                                  <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="px-3 py-1 rounded-full text-xs font-bold bg-orange-500/90 text-white"
                                  >
                                    Only {saree.stock} left
                                  </motion.span>
                                ) : null}
                              </div>

                              {/* Category Badge */}
                              <div className="absolute top-4 left-4">
                                <motion.span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/90 text-white">
                                  {saree.category}
                                </motion.span>
                              </div>

                              {/* Added to Cart Animation */}
                              <AnimatePresence>
                                {addedItems.has(saree._id) && (
                                  <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    className="absolute inset-0 bg-green-500/90 flex items-center justify-center backdrop-blur-sm"
                                  >
                                    <motion.div
                                      animate={{ scale: [1, 1.2, 1] }}
                                      transition={{ duration: 0.5 }}
                                      className="flex flex-col items-center gap-2"
                                    >
                                      <Check className="w-12 h-12 text-white" />
                                      <p className="text-white font-bold text-lg">Added to Cart!</p>
                                    </motion.div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Quick Actions */}
                              <div className="absolute bottom-4 left-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="p-2 bg-white/90 rounded-full hover:bg-white transition-all"
                                  title="Add to Wishlist"
                                >
                                  <Heart className="w-5 h-5 text-red-500" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="p-2 bg-white/90 rounded-full hover:bg-white transition-all"
                                  title="Share"
                                >
                                  <Share2 className="w-5 h-5 text-blue-500" />
                                </motion.button>
                              </div>
                            </div>

                            {/* Content */}
                            <div className="p-4 flex flex-col flex-1">
                              <h3
                                className="font-bold text-lg mb-2 line-clamp-2 text-foreground hover:text-primary transition-colors cursor-pointer"
                                onClick={() => handleViewDetails(saree._id)}
                              >
                                {saree.name}
                              </h3>

                              {/* Rating */}
                              {saree.averageRating ? (
                                <div className="mb-2">
                                  {renderStarRating(saree.averageRating)}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground mb-2">No reviews yet</p>
                              )}

                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {saree.description}
                              </p>

                              {saree.material && (
                                <p className="text-xs text-muted-foreground mb-2">
                                  <span className="font-semibold">Material:</span> {saree.material}
                                </p>
                              )}

                              <div className="flex justify-between items-end flex-1 mt-4 pt-4 border-t">
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  className="text-2xl font-bold bg-gradient-saree bg-clip-text text-transparent"
                                >
                                  ₹{saree.price.toLocaleString()}
                                </motion.div>
                              </div>

                              {/* Action Buttons */}
                              {!isAdmin ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewDetails(saree._id)}
                                    className="w-full mt-3"
                                  >
                                    View Details
                                  </Button>
                                  {isInCart(saree._id) ? (
                                    <motion.button
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      onClick={() => handleRemoveFromCart(saree)}
                                      className="w-full mt-2 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all duration-300"
                                    >
                                      <Trash2 size={18} />
                                      Remove from Cart
                                    </motion.button>
                                  ) : (
                                    <motion.button
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => handleAddToCart(saree)}
                                      disabled={saree.stock === 0}
                                      className={`w-full mt-2 py-2 font-semibold rounded-lg flex items-center justify-center gap-2 transition-all duration-300 ${
                                        saree.stock === 0
                                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                          : "bg-gradient-saree text-white hover:shadow-lg"
                                      }`}
                                    >
                                      <ShoppingCart size={18} />
                                      {saree.stock === 0 ? "Out of Stock" : "Add to Cart"}
                                    </motion.button>
                                  )}
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/admin/sarees/${saree._id}/edit`)}
                                    className="w-full mt-3"
                                  >
                                    Edit Saree
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      // Add delete functionality
                                      toast({
                                        title: "Delete",
                                        description: "Delete functionality coming soon",
                                      });
                                    }}
                                    className="w-full mt-2"
                                  >
                                    Delete Saree
                                  </Button>
                                </>
                              )}
                            </div>
                          </Card>
                        </motion.div>
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