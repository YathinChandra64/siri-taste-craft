import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ShippingInfoFormProps {
  orderId: string;
  onSubmit: (data: ShippingData) => void;
  isLoading?: boolean;
}

interface ShippingData {
  shipper: string;
  trackingNumber: string;
  trackingUrl?: string;
  estimatedDeliveryDate?: string;
}

export const ShippingInfoForm = ({ orderId, onSubmit, isLoading }: ShippingInfoFormProps) => {
  const [formData, setFormData] = useState<ShippingData>({
    shipper: "",
    trackingNumber: "",
    trackingUrl: "",
    estimatedDeliveryDate: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Courier Service</Label>
        <Input
          placeholder="e.g., Fedex, DHL, DTDC"
          value={formData.shipper}
          onChange={(e) => setFormData({ ...formData, shipper: e.target.value })}
          required
        />
      </div>

      <div>
        <Label>Tracking Number</Label>
        <Input
          placeholder="Enter tracking number"
          value={formData.trackingNumber}
          onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
          required
        />
      </div>

      <div>
        <Label>Tracking URL (Optional)</Label>
        <Input
          placeholder="https://tracking.courier.com/..."
          value={formData.trackingUrl}
          onChange={(e) => setFormData({ ...formData, trackingUrl: e.target.value })}
        />
      </div>

      <div>
        <Label>Estimated Delivery Date</Label>
        <Input
          type="datetime-local"
          value={formData.estimatedDeliveryDate}
          onChange={(e) => setFormData({ ...formData, estimatedDeliveryDate: e.target.value })}
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Updating..." : "Update Shipping Info"}
      </Button>
    </form>
  );
};