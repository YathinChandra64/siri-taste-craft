import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import QRPaymentModal from "./QRPaymentModal";

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
}

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  type: "saree" | "pickle";
}

const ProductDetailModal = ({ product, isOpen, onClose, type }: ProductDetailModalProps) => {
  const [showQR, setShowQR] = useState(false);

  if (!product) return null;

  const gradientClass = type === "saree" ? "bg-gradient-saree" : "bg-gradient-pickle";

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{product.name}</DialogTitle>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-6 mt-4">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="relative aspect-square rounded-lg overflow-hidden bg-muted"
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <div className={`absolute top-4 right-4 px-4 py-2 rounded-full text-sm font-medium ${gradientClass} text-white shadow-lg`}>
                {product.category}
              </div>
            </motion.div>

            {/* Details */}
            <div className="flex flex-col justify-between">
              <div>
                <div className="mb-6">
                  <h3 className="text-3xl font-bold text-foreground mb-2">
                    ₹{product.price.toLocaleString()}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Category</span>
                    <span className="font-medium text-foreground">{product.category}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Product ID</span>
                    <span className="font-medium text-foreground">#{product.id}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setShowQR(true)}
                size="lg"
                className={`w-full ${gradientClass} text-white border-0 shadow-hover hover:shadow-soft transition-all duration-300`}
              >
                Buy Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <QRPaymentModal
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        product={product}
      />
    </>
  );
};

export default ProductDetailModal;
