import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FilterBar from "@/components/FilterBar";
import ProductCard from "@/components/ProductCard";
import ProductDetailModal from "@/components/ProductDetailModal";
import { pickles, categories } from "@/data/products";

const Pickles = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState<typeof pickles[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredPickles = activeCategory === "All"
    ? pickles
    : pickles.filter(pickle => pickle.category === activeCategory);

  const handleViewDetails = (product: typeof pickles[0]) => {
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
              <span className="bg-gradient-pickle bg-clip-text text-transparent">
                Homemade Pickles
              </span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Authentic homemade pickles crafted with traditional recipes and 
              the finest ingredients
            </p>
          </motion.div>

          {/* Filters */}
          <FilterBar
            categories={categories.pickles}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            type="pickle"
          />

          {/* Product Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredPickles.map((pickle, index) => (
              <motion.div
                key={pickle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <ProductCard
                  product={pickle}
                  type="pickle"
                  onViewDetails={() => handleViewDetails(pickle)}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* No Results */}
          {filteredPickles.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <p className="text-muted-foreground text-lg">
                No pickles found in this category
              </p>
            </motion.div>
          )}
        </div>
      </main>

      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type="pickle"
      />

      <Footer />
    </div>
  );
};

export default Pickles;
