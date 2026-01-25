import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CartSummary } from "@/types/profile";
import { ShoppingCart, Plus, Minus, Trash2 } from "lucide-react";

interface CartSectionProps {
  cart: CartSummary;
  onRemove: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onCheckout: () => void;
  isLoading?: boolean;
}

export const CartSection = ({
  cart,
  onRemove,
  onUpdateQuantity,
  onCheckout,
  isLoading
}: CartSectionProps) => {
  // Safety check - make sure cart and items exist
  if (!cart || !cart.items) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Shopping Cart (0)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Your cart is empty</p>
            <p className="text-sm text-muted-foreground mt-2">Add sarees to get started!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const itemCount = cart.items?.length || 0;
  const total = cart.total || 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Shopping Cart ({itemCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {itemCount === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Your cart is empty</p>
              <p className="text-sm text-muted-foreground mt-2">Add sarees to get started!</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {cart.items.map((item) => {
                  // Safety check for each item
                  if (!item || !item.saree) {
                    return null;
                  }

                  const itemTotal = (item.saree.price || 0) * (item.quantity || 1);

                  return (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                    >
                      <img
                        src={item.saree.imageUrl || "https://via.placeholder.com/80"}
                        alt={item.saree.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{item.saree.name}</h4>
                        <p className="text-sm text-muted-foreground">{item.saree.category}</p>
                        <p className="text-lg font-bold text-primary mt-1">
                          ₹{itemTotal.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemove(item._id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onUpdateQuantity(item._id, (item.quantity || 1) - 1)}
                            disabled={(item.quantity || 1) <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity || 1}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onUpdateQuantity(item._id, (item.quantity || 1) + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-primary text-xl">
                    ₹{total.toLocaleString()}
                  </span>
                </div>
                <Button
                  onClick={onCheckout}
                  className="w-full bg-gradient-saree text-white"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Proceed to Checkout"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CartSection;