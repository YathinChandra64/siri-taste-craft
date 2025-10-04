import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";

interface QRPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    name: string;
    price: number;
  };
}

const QRPaymentModal = ({ isOpen, onClose, product }: QRPaymentModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            Complete Your Payment
          </DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="py-6"
        >
          {/* Product Info */}
          <div className="text-center mb-6">
            <p className="text-lg font-semibold text-foreground mb-1">{product.name}</p>
            <p className="text-3xl font-bold text-primary">₹{product.price.toLocaleString()}</p>
          </div>

          {/* QR Code Placeholder */}
          <div className="bg-muted rounded-lg p-8 mb-6 flex items-center justify-center aspect-square">
            <div className="text-center">
              <div className="w-48 h-48 bg-card border-4 border-dashed border-border rounded-lg flex items-center justify-center mb-4">
                <p className="text-muted-foreground text-sm px-4">
                  QR Code will appear here
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Scan with any UPI app to pay
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-sm text-center text-muted-foreground">
              <span className="font-medium text-foreground">Instructions:</span>
              <br />
              Scan the QR code with any UPI app (Google Pay, PhonePe, Paytm, etc.) to complete your payment securely.
            </p>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default QRPaymentModal;
