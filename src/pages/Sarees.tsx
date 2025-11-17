import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FilterBar from "@/components/FilterBar";
import ProductCard from "@/components/ProductCard";
import ProductDetailModal from "@/components/ProductDetailModal";
import { sarees } from "@/data/products";

const Sarees = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState<typeof sarees[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Generate dynamic categories from products
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(sarees.map(saree => saree.category))) as string[];
    return ["All", ...uniqueCategories];
  }, []);

  const filteredSarees = activeCategory === "All"
    ? sarees
    : sarees.filter(saree => saree.category === activeCategory);

  const handleViewDetails = (product: typeof sarees[0]) => {
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
              <span className="bg-gradient-saree bg-clip-text text-transparent">
                Saree Collections
              </span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Explore our exquisite range of traditional and designer sarees, 
              perfect for every occasion
            </p>
          </motion.div>

          {/* Filters */}
          <FilterBar
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            type="saree"
          />

          {/* Product Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredSarees.map((saree, index) => (
              <motion.div
                key={saree.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <ProductCard
                  product={saree}
                  type="saree"
                  onViewDetails={() => handleViewDetails(saree)}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* No Results */}
          {filteredSarees.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <p className="text-muted-foreground text-lg">
                No sarees found in this category
              </p>
            </motion.div>
          )}
        </div>
      </main>

      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type="saree"
      />

      <Footer />
    </div>
  );
};

export default Sarees;
