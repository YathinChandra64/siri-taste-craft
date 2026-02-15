import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Package, ShoppingCart, Plus, Minus, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/useCart";
import UPIPaymentModal from "./UPIPaymentModal";

interface Product {
  _id?: string;
  id?: number | string;
  name: string;
  category: string;
  price: number;
  pricePerKg?: number;
  description: string;
  image?: string;
  imageUrl?: string;
  weight?: number;
  unit?: string;
  stock?: number;
}

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  type: "saree" | "sweet";
}

const ProductDetailModal = ({ product, isOpen, onClose, type }: ProductDetailModalProps) => {
  const [showQR, setShowQR] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [currentStock, setCurrentStock] = useState(0);
  const [loadingStock, setLoadingStock] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addItem } = useCart();

  // ✅ FIXED: Move useEffect BEFORE the early return
  // This ensures the hook is called in the same order every render
  useEffect(() => {
    const fetchStock = async () => {
      if (!product) return;

      try {
        setLoadingStock(true);
        
        // If product has stock property, use it directly
        if (product.stock) {
          setCurrentStock(product.stock);
          return;
        }

        // Otherwise, fetch from API
        const productId = product._id || product.id;
        if (!productId) {
          setCurrentStock(0);
          return;
        }

        const response = await fetch(`http://localhost:5000/api/sarees/${productId}`);
        if (response.ok) {
          const data = await response.json();
          const sareeData = data.data || data;
          setCurrentStock(sareeData.stock || 0);
        } else {
          setCurrentStock(0);
        }
      } catch (error) {
        console.error("Error fetching stock:", error);
        setCurrentStock(0);
      } finally {
        setLoadingStock(false);
      }
    };

    // Only fetch when modal is open
    if (isOpen && product) {
      fetchStock();
    }
  }, [isOpen, product]); // ✅ Dependencies ensure hook is called properly

  // ✅ Now the early return is AFTER all hooks
  if (!product) return null;

  const inStock = currentStock > 0;
  const gradientClass = type === "saree" ? "bg-gradient-saree" : "bg-gradient-sweet";

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to add items to cart.",
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

    try {
      setAddingToCart(true);
      
      const productIdStr = product._id || product.id?.toString() || "";
      
      if (!productIdStr) {
        throw new Error("Product ID not found");
      }

      await addItem(productIdStr, quantity);

      toast({
        title: "Added to Cart",
        description: `${quantity} ${product.unit || 'item(s)'} of ${product.name} added to cart.`,
      });

      setQuantity(1);
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add item to cart",
        variant: "destructive",
      });
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
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

    try {
      const productIdStr = product._id || product.id?.toString() || "";
      if (!productIdStr) {
        throw new Error("Product ID not found");
      }

      await addItem(productIdStr, quantity);
      
      const tempOrderId = `order-${Date.now()}`;
      setOrderId(tempOrderId);
      setShowQR(true);
    } catch (error) {
      console.error("Error in buy now:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process payment",
        variant: "destructive",
      });
    }
  };

  const increaseQuantity = () => {
    if (quantity < currentStock) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const totalPrice = type === 'sweet' && product.pricePerKg 
    ? product.pricePerKg * quantity 
    : product.price * quantity;

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
                src={product.image || product.imageUrl || "https://via.placeholder.com/400"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <div className={`absolute top-4 right-4 px-4 py-2 rounded-full text-sm font-medium ${gradientClass} text-white shadow-lg`}>
                {product.category}
              </div>
            </motion.div>

            {/* Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex flex-col justify-between"
            >
              {/* Price and Stock */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Price {type === 'sweet' && product.pricePerKg ? 'per kg' : ''}
                    </p>
                    <p className="text-3xl font-bold text-primary">
                      ₹{type === 'sweet' && product.pricePerKg ? product.pricePerKg : product.price}
                    </p>
                  </div>
                  {loadingStock ? (
                    <Badge variant="outline">Loading...</Badge>
                  ) : inStock ? (
                    <Badge className="bg-green-500 text-white">In Stock</Badge>
                  ) : (
                    <Badge className="bg-red-500 text-white">Out of Stock</Badge>
                  )}
                </div>

                {inStock && currentStock < 10 && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-yellow-700">Only {currentStock} items left</span>
                  </div>
                )}

                {/* Description */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                </div>
              </div>

              {/* Quantity and Actions */}
              <div className="space-y-4">
                {/* Quantity Selector */}
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Quantity:</span>
                  <div className="flex items-center border rounded-lg bg-muted">
                    <button
                      onClick={decreaseQuantity}
                      disabled={quantity <= 1}
                      className="p-2 hover:bg-background transition-colors disabled:opacity-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-2 font-semibold w-12 text-center">{quantity}</span>
                    <button
                      onClick={increaseQuantity}
                      disabled={quantity >= currentStock}
                      className="p-2 hover:bg-background transition-colors disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Total Price */}
                <div className="p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Total Price</p>
                  <p className="text-2xl font-bold text-primary">₹{totalPrice.toFixed(2)}</p>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleAddToCart}
                    disabled={!inStock || addingToCart || loadingStock}
                    className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {addingToCart ? "Adding..." : "Add to Cart"}
                  </Button>
                  <Button
                    onClick={handleBuyNow}
                    disabled={!inStock || loadingStock}
                    variant="outline"
                    className="gap-2"
                  >
                    <Package className="w-4 h-4" />
                    Buy Now
                  </Button>
                </div>

                {/* Trust Badge */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                  <Shield className="w-4 h-4" />
                  <span>Secure checkout • Money-back guarantee</span>
                </div>
              </div>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>

      {/* UPI Payment Modal with correct props */}
      {showQR && orderId && (
        <UPIPaymentModal
          isOpen={showQR}
          onClose={() => {
            setShowQR(false);
            setOrderId(null);
          }}
          orderId={orderId}
          totalAmount={totalPrice}
        />
      )}
    </>
  );
};

export default ProductDetailModal;