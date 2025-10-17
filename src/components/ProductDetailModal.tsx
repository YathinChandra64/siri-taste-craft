import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Package } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import QRPaymentModal from "./QRPaymentModal";
import { getProductWithStock } from "@/utils/inventory";

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
  type: "saree" | "sweet";
}

const ProductDetailModal = ({ product, isOpen, onClose, type }: ProductDetailModalProps) => {
  const [showQR, setShowQR] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (!product) return null;

  const productWithStock = getProductWithStock(product.id, type);
  const currentStock = productWithStock?.stock ?? 0;
  const inStock = currentStock > 0;

  const gradientClass = type === "saree" ? "bg-gradient-saree" : "bg-gradient-sweet";

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to make a purchase.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    if (!inStock) {
      toast({
        title: "Out of Stock",
        description: "This item is currently unavailable.",
        variant: "destructive",
      });
      return;
    }

    setShowQR(true);
  };

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
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Package size={16} />
                      Stock
                    </span>
                    <Badge 
                      variant={inStock ? "default" : "destructive"}
                      className={inStock ? "bg-green-500" : ""}
                    >
                      {inStock ? `${currentStock} Available` : "Out of Stock"}
                    </Badge>
                  </div>
                </div>

                {!isAuthenticated && (
                  <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-3">
                    <AlertCircle size={20} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-yellow-700 dark:text-yellow-500">
                      You must be logged in to make a purchase. View-only mode is active.
                    </p>
                  </div>
                )}
              </div>

              <Button
                onClick={handleBuyNow}
                size="lg"
                disabled={!inStock}
                className={`w-full ${gradientClass} text-white border-0 shadow-hover hover:shadow-soft transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {inStock ? "Buy Now" : "Out of Stock"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <QRPaymentModal
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        product={product}
        type={type}
      />
    </>
  );
};

export default ProductDetailModal;
