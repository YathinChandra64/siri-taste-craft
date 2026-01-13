import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdvancedFilterBar from "@/components/AdvancedFilterBar";
import ProductCard from "@/components/ProductCard";
import ProductDetailModal from "@/components/ProductDetailModal";
import AnimatedBackground from "@/components/AnimatedBackground";
import { StaggerContainer, StaggerItem } from "@/components/StaggerContainer";
import { sweets } from "@/data/products";

const Sweets = () => {
  const [filteredProducts, setFilteredProducts] = useState(sweets);
  const [selectedProduct, setSelectedProduct] = useState<typeof sweets[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewDetails = (product: typeof sweets[0]) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <AnimatedBackground />
      <Navbar />

      <main className="flex-1 py-12 px-4 relative z-10">
        <div className="container mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <motion.h1 
              className="text-4xl md:text-5xl font-bold mb-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, type: "spring" }}
            >
              <span className="bg-gradient-sweet bg-clip-text text-transparent">
                Traditional Sweets
              </span>
            </motion.h1>
            <motion.p 
              className="text-muted-foreground text-lg max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Authentic homemade sweets crafted with traditional recipes and 
              the finest ingredients
            </motion.p>
          </motion.div>

          {/* Advanced Filters */}
          <AdvancedFilterBar
            products={sweets}
            type="sweet"
            onFilterChange={setFilteredProducts}
          />

          {/* Product Grid */}
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((sweet) => (
              <StaggerItem key={sweet.id}>
                <ProductCard
                  product={sweet}
                  type="sweet"
                  onViewDetails={() => handleViewDetails(sweet)}
                />
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* No Results */}
          {filteredProducts.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <p className="text-muted-foreground text-lg">
                No sweets found matching your filters
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
