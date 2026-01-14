import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getProductWithStock } from "@/utils/inventory";

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    category: string;
    price: number;
    pricePerKg?: number;
    description: string;
    image: string;
  };
  type: "saree" | "sweet";
  onViewDetails: () => void;
}

const ProductCard = ({ product, type, onViewDetails }: ProductCardProps) => {
  const { user } = useAuth();
  const productWithStock = getProductWithStock(product.id, type);
  const currentStock = productWithStock?.stock ?? 0;
  const inStock = currentStock > 0;
  const gradientClass = type === "saree" ? "bg-gradient-saree" : "bg-gradient-sweet";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      className="group bg-card rounded-xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-300"
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-foreground/10" />
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium ${gradientClass} text-white`}>
          {product.category}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-1">
          {product.name}
        </h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2 min-h-[40px]">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-xl font-bold text-foreground">
            ₹{(product.pricePerKg || product.price).toLocaleString()}{type === 'sweet' ? '/kg' : ''}
          </span>
          <Button
            onClick={onViewDetails}
            variant="outline"
            size="sm"
            className="hover:bg-primary hover:text-primary-foreground transition-all duration-300"
          >
            View Details
          </Button>
        </div>

        {/* Stock Badge - Admin Only */}
        {user?.isAdmin && (
          <div className="flex items-center gap-2 text-sm">
            <Shield size={14} className="text-primary" />
            <Badge 
              variant={inStock ? "default" : "destructive"}
              className={`text-xs ${inStock ? "bg-green-500" : ""}`}
            >
              {inStock ? `${currentStock} ${type === 'sweet' ? 'kg' : ''} in stock` : "Out of Stock"}
            </Badge>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProductCard;
