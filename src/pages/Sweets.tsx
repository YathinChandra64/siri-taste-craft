import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FilterBar from "@/components/FilterBar";
import ProductCard from "@/components/ProductCard";
import ProductDetailModal from "@/components/ProductDetailModal";
import { sweets } from "@/data/products";

const Sweets = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState<typeof sweets[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Generate dynamic categories from products
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(sweets.map(sweet => sweet.category))) as string[];
    return ["All", ...uniqueCategories];
  }, []);

  const filteredSweets = activeCategory === "All"
    ? sweets
    : sweets.filter(sweet => sweet.category === activeCategory);

  const handleViewDetails = (product: typeof sweets[0]) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-12 px-4">
        <div className="container mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-sweet bg-clip-text text-transparent">
                Traditional Sweets
              </span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Authentic homemade sweets crafted with traditional recipes and 
              the finest ingredients
            </p>
          </motion.div>

          {/* Filters */}
          <FilterBar
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            type="sweet"
          />

          {/* Product Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredSweets.map((sweet, index) => (
              <motion.div
                key={sweet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <ProductCard
                  product={sweet}
                  type="sweet"
                  onViewDetails={() => handleViewDetails(sweet)}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* No Results */}
          {filteredSweets.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <p className="text-muted-foreground text-lg">
                No sweets found in this category
              </p>
            </motion.div>
          )}
        </div>
      </main>

      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type="sweet"
      />

      <Footer />
    </div>
  );
};

export default Sweets;
