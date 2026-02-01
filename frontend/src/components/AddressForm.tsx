import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, MapPin } from "lucide-react";
import { Address } from "@/types/checkout";
import { useToast } from "@/hooks/use-toast";

interface AddressFormProps {
  onSubmit: (address: Address) => void;
  onBack: () => void;
  isLoading?: boolean;
}

const AddressForm = ({ onSubmit, onBack, isLoading = false }: AddressFormProps) => {
  const [formData, setFormData] = useState<Address>({
    fullName: "",
    mobileNumber: "",
    houseFlat: "",
    streetArea: "",
    city: "",
    state: "",
    pincode: "",
    addressType: "Home"
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName?.trim()) {
      newErrors.fullName = "Full name is required";
    }
    if (!formData.mobileNumber) {
      newErrors.mobileNumber = "Mobile number is required";
    } else if (!/^\d{10}$/.test(formData.mobileNumber)) {
      newErrors.mobileNumber = "Must be 10 digits";
    }

    if (!formData.houseFlat?.trim()) {
      newErrors.houseFlat = "House/Flat is required";
    }
    if (!formData.streetArea?.trim()) {
      newErrors.streetArea = "Street/Area is required";
    }
    if (!formData.city?.trim()) {
      newErrors.city = "City is required";
    }
    if (!formData.state?.trim()) {
      newErrors.state = "State is required";
    }
    if (!formData.pincode) {
      newErrors.pincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = "Must be 6 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill all fields correctly",
        variant: "destructive"
      });
      return;
    }

    onSubmit(formData);
  };

  const handleChange = (field: keyof Address, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="p-0 h-auto"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Add New Address
        </h3>
      </div>

      <Card className="p-6 space-y-4">
        {/* Full Name */}
        <div>
          <Label className="text-sm font-semibold">Full Name</Label>
          <Input
            type="text"
            value={formData.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            placeholder="John Doe"
            className={`mt-1 ${errors.fullName ? "border-red-500" : ""}`}
          />
          {errors.fullName && (
            <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>
          )}
        </div>

        {/* Mobile Number */}
        <div>
          <Label className="text-sm font-semibold">Mobile Number</Label>
          <Input
            type="tel"
            value={formData.mobileNumber}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 10);
              handleChange("mobileNumber", value);
            }}
            placeholder="9876543210"
            maxLength={10}
            className={`mt-1 ${errors.mobileNumber ? "border-red-500" : ""}`}
          />
          {errors.mobileNumber && (
            <p className="text-xs text-red-500 mt-1">{errors.mobileNumber}</p>
          )}
        </div>

        {/* House/Flat */}
        <div>
          <Label className="text-sm font-semibold">House/Flat/Building</Label>
          <Input
            type="text"
            value={formData.houseFlat}
            onChange={(e) => handleChange("houseFlat", e.target.value)}
            placeholder="Apt 101, Tower A"
            className={`mt-1 ${errors.houseFlat ? "border-red-500" : ""}`}
          />
          {errors.houseFlat && (
            <p className="text-xs text-red-500 mt-1">{errors.houseFlat}</p>
          )}
        </div>

        {/* Street/Area */}
        <div>
          <Label className="text-sm font-semibold">Street/Area</Label>
          <Input
            type="text"
            value={formData.streetArea}
            onChange={(e) => handleChange("streetArea", e.target.value)}
            placeholder="MG Road, Banjara Hills"
            className={`mt-1 ${errors.streetArea ? "border-red-500" : ""}`}
          />
          {errors.streetArea && (
            <p className="text-xs text-red-500 mt-1">{errors.streetArea}</p>
          )}
        </div>

        {/* City */}
        <div>
          <Label className="text-sm font-semibold">City</Label>
          <Input
            type="text"
            value={formData.city}
            onChange={(e) => handleChange("city", e.target.value)}
            placeholder="Hyderabad"
            className={`mt-1 ${errors.city ? "border-red-500" : ""}`}
          />
          {errors.city && (
            <p className="text-xs text-red-500 mt-1">{errors.city}</p>
          )}
        </div>

        {/* State */}
        <div>
          <Label className="text-sm font-semibold">State</Label>
          <Input
            type="text"
            value={formData.state}
            onChange={(e) => handleChange("state", e.target.value)}
            placeholder="Telangana"
            className={`mt-1 ${errors.state ? "border-red-500" : ""}`}
          />
          {errors.state && (
            <p className="text-xs text-red-500 mt-1">{errors.state}</p>
          )}
        </div>

        {/* Pincode */}
        <div>
          <Label className="text-sm font-semibold">Pincode</Label>
          <Input
            type="text"
            value={formData.pincode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 6);
              handleChange("pincode", value);
            }}
            placeholder="500001"
            maxLength={6}
            className={`mt-1 ${errors.pincode ? "border-red-500" : ""}`}
          />
          {errors.pincode && (
            <p className="text-xs text-red-500 mt-1">{errors.pincode}</p>
          )}
        </div>

        {/* Address Type */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">Address Type</Label>
          <RadioGroup 
            value={formData.addressType} 
            onValueChange={(value) => handleChange("addressType", value)}
          >
            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Home" id="home" />
                <Label htmlFor="home" className="font-normal cursor-pointer">
                  Home
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Work" id="work" />
                <Label htmlFor="work" className="font-normal cursor-pointer">
                  Work
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-purple-600 hover:bg-purple-700"
        >
          {isLoading ? "Saving..." : "Save Address"}
        </Button>
      </div>
    </motion.form>
  );
};

export default AddressForm;