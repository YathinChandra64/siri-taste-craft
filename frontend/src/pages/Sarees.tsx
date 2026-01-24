import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import AnimatedBackground from "@/components/AnimatedBackground";
import { StaggerContainer, StaggerItem } from "@/components/StaggerContainer";
import { ShoppingCart, Heart, Share2, Trash2, Check, X } from "lucide-react";
import { addToCart, removeFromCart, getCart } from "@/utils/cart";

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
  id?: string;
  type?: string;
};

const Sarees = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sarees, setSarees] = useState<Saree[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Saree[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cartItems, setCartItems] = useState(getCart());
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSarees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sarees, selectedCategory, priceRange, searchTerm]);

  const fetchSarees = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/sarees");
      if (response.ok) {
        const data: Saree[] = await response.json();
        const formattedData = data.map((saree) => ({
          ...saree,
          id: saree._id,
          type: "saree"
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

  const filterProducts = () => {
    let filtered = sarees;

    // Category filter
    if (selectedCategory !== "All") {
      filtered = filtered.filter(s => s.category === selectedCategory);
    }

    // Price filter
    filtered = filtered.filter(s => s.price >= priceRange[0] && s.price <= priceRange[1]);

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const handleAddToCart = (saree: Saree) => {
    const cartId = saree._id ? parseInt(saree._id.slice(-4)) || Math.floor(Math.random() * 10000) : Math.floor(Math.random() * 10000);
    
    addToCart(cartId, "saree");
    setCartItems(getCart());
    setAddedItems(prev => new Set(prev).add(saree._id));

    // Show cool animation toast
    toast({
      title: "✨ Added to Cart!",
      description: `${saree.name} is ready to make you look stunning!`,
    });

    // Reset added state after animation
    setTimeout(() => {
      setAddedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(saree._id);
        return newSet;
      });
    }, 2000);
  };

  const handleRemoveFromCart = (saree: Saree) => {
    const cartId = saree._id ? parseInt(saree._id.slice(-4)) || Math.floor(Math.random() * 10000) : Math.floor(Math.random() * 10000);
    removeFromCart(cartId, "saree");
    setCartItems(getCart());

    // Show encouraging toast
    toast({
      title: "Removed from Cart",
      description: "It's okay! We'll keep this beauty available for you. Come back anytime! 💕",
    });
  };

  const isInCart = (sareeId: string) => {
    const cartId = parseInt(sareeId.slice(-4)) || 0;
    return cartItems.some(item => item.id === cartId);
  };

  const categories = ["All", "Silk", "Cotton", "Bridal", "Designer", "Casual", "Traditional"];
  const minPrice = Math.min(...sarees.map(s => s.price), 1000);
  const maxPrice = Math.max(...sarees.map(s => s.price), 100000);

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
            {/* Sidebar Filters */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-1"
            >
              <div className="sticky top-24 space-y-6">
                {/* Search */}
                <div>
                  <label className="block text-sm font-semibold mb-3">Search</label>
                  <input
                    type="text"
                    placeholder="Search sarees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-semibold mb-3">Category</label>
                  <div className="space-y-2">
                    {categories.map(cat => (
                      <motion.button
                        key={cat}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedCategory(cat)}
                        className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-300 ${
                          selectedCategory === cat
                            ? "bg-gradient-saree text-white font-medium shadow-md"
                            : "bg-muted hover:bg-muted/80 text-foreground"
                        }`}
                      >
                        {cat}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Price Filter */}
                <div>
                  <label className="block text-sm font-semibold mb-3">Price Range</label>
                  <div className="space-y-3">
                    <input
                      type="range"
                      min={minPrice}
                      max={maxPrice}
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                      className="w-full"
                    />
                    <input
                      type="range"
                      min={minPrice}
                      max={maxPrice}
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm">
                      <span>₹{priceRange[0].toLocaleString()}</span>
                      <span>₹{priceRange[1].toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Reset Filters */}
                <Button
                  onClick={() => {
                    setSelectedCategory("All");
                    setPriceRange([minPrice, maxPrice]);
                    setSearchTerm("");
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Reset Filters
                </Button>
              </div>
            </motion.div>

            {/* Products Grid */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-3"
            >
              {loading ? (
                <div className="flex justify-center items-center h-96">
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
                      setSelectedCategory("All");
                      setPriceRange([minPrice, maxPrice]);
                      setSearchTerm("");
                    }}
                    className="bg-gradient-saree text-white"
                  >
                    View All Sarees
                  </Button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {filteredProducts.map((saree, index) => (
                      <motion.div
                        key={saree._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ y: -8 }}
                      >
                        <Card className="overflow-hidden h-full flex flex-col hover:shadow-2xl transition-all duration-300 group">
                          {/* Image Container */}
                          <div className="relative aspect-square overflow-hidden bg-muted">
                            <motion.img
                              src={saree.imageUrl || "https://via.placeholder.com/500x500?text=Saree"}
                              alt={saree.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              loading="lazy"
                            />

                            {/* Stock Badge */}
                            <div className="absolute top-4 right-4">
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${
                                  saree.stock > 0
                                    ? "bg-green-500/80 text-white"
                                    : "bg-red-500/80 text-white"
                                }`}
                              >
                                {saree.stock > 0 ? `${saree.stock} in stock` : "Out of stock"}
                              </motion.span>
                            </div>

                            {/* Category Badge */}
                            <div className="absolute top-4 left-4">
                              <motion.span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/80 text-white">
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
                              >
                                <Heart className="w-5 h-5 text-red-500" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-2 bg-white/90 rounded-full hover:bg-white transition-all"
                              >
                                <Share2 className="w-5 h-5 text-blue-500" />
                              </motion.button>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-4 flex flex-col flex-1">
                            <h3 className="font-bold text-lg mb-1 line-clamp-2 text-foreground">
                              {saree.name}
                            </h3>
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

                            {/* Cart Button */}
                            {isInCart(saree._id) ? (
                              <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onClick={() => handleRemoveFromCart(saree)}
                                className="w-full mt-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all duration-300"
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
                                className={`w-full mt-4 py-3 font-semibold rounded-lg flex items-center justify-center gap-2 transition-all duration-300 ${
                                  saree.stock === 0
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-gradient-saree text-white hover:shadow-lg"
                                }`}
                              >
                                <ShoppingCart size={18} />
                                {saree.stock === 0 ? "Out of Stock" : "Add to Cart"}
                              </motion.button>
                            )}
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Results Count */}
              {filteredProducts.length > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center mt-8 text-muted-foreground"
                >
                  Showing {filteredProducts.length} of {sarees.length} sarees
                </motion.p>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sarees;