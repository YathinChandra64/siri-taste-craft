import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, MapPin, Plus, Trash2 } from "lucide-react";
import { Address } from "@/types/checkout";
import { getAddressAPI, deleteAddressAPI, setDefaultAddressAPI } from "@/services/addressService";
import { useToast } from "@/hooks/use-toast";

interface AddressSelectionProps {
  onAddressSelect: (address: Address) => void;
  onNewAddressClick: () => void;
  selectedAddressId?: string;
  isLoadingAddresses?: boolean;
}

const AddressSelection = ({
  onAddressSelect,
  onNewAddressClick,
  selectedAddressId,
  isLoadingAddresses = false
}: AddressSelectionProps) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setLoading(true);
        const fetchedAddresses = await getAddressAPI();
        setAddresses(fetchedAddresses);
        
        // Auto-select default if available
        const defaultAddr = fetchedAddresses.find((a: Address) => a.isDefault);
        if (defaultAddr) {
          onAddressSelect(defaultAddr);
        }
      } catch (error) {
        console.error("Error loading addresses:", error);
        toast({
          title: "Error",
          description: "Failed to load addresses",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, [onAddressSelect, toast]);

  const handleDeleteAddress = async (addressId: string | undefined) => {
    if (!addressId) return;
    
    try {
      setDeleting(addressId);
      await deleteAddressAPI(addressId);
      setAddresses((prev) => prev.filter((a) => a._id !== addressId));
      toast({
        title: "Success",
        description: "Address deleted"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete",
        variant: "destructive"
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleSetDefault = async (addressId: string | undefined) => {
    if (!addressId) return;
    
    try {
      await setDefaultAddressAPI(addressId);
      const updated = await getAddressAPI();
      setAddresses(updated);
      toast({
        title: "Success",
        description: "Default address updated"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Delivery Address
        </h3>
      </div>

      {loading || isLoadingAddresses ? (
        <Card className="p-6 bg-slate-50">
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-slate-400">Loading addresses...</div>
          </div>
        </Card>
      ) : addresses.length > 0 ? (
        <ScrollArea className="h-auto max-h-[400px] border rounded-lg p-3">
          <div className="space-y-3">
            {addresses.map((addr) => (
              <motion.div
                key={addr._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card 
                  className={`p-4 cursor-pointer border-2 transition-all ${
                    selectedAddressId === addr._id 
                      ? "border-purple-500 bg-purple-50" 
                      : "border-transparent hover:border-slate-200"
                  }`}
                  onClick={() => onAddressSelect(addr)}
                >
                  <div className="flex items-start gap-3">
                    <input 
                      type="radio" 
                      name="address" 
                      checked={selectedAddressId === addr._id}
                      onChange={() => onAddressSelect(addr)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-sm">{addr.fullName}</p>
                          <p className="text-xs text-slate-500">{addr.addressType}</p>
                        </div>
                        {addr.isDefault && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-700">
                        {addr.houseFlat}, {addr.streetArea}
                      </p>
                      <p className="text-sm text-slate-700">
                        {addr.city}, {addr.state} {addr.pincode}
                      </p>
                      <p className="text-sm text-slate-600 mt-1">
                        📞 {addr.mobileNumber}
                      </p>
                      
                      {selectedAddressId === addr._id && (
                        <div className="flex gap-2 mt-3 pt-3 border-t">
                          {!addr.isDefault && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetDefault(addr._id);
                              }}
                              className="text-xs"
                            >
                              Set as Default
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAddress(addr._id);
                            }}
                            disabled={deleting === addr._id}
                            className="text-xs"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <Card className="p-6 bg-slate-50 text-center">
          <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="text-slate-500 text-sm">No saved addresses</p>
        </Card>
      )}

      <Button
        onClick={onNewAddressClick}
        variant="outline"
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add New Address
      </Button>
    </div>
  );
};

export default AddressSelection;