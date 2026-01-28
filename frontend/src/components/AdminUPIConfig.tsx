import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Upload, CheckCircle } from "lucide-react";

const AdminUPIConfig = () => {
  const [upiConfig, setUpiConfig] = useState({
    upiId: "",
    merchantName: "",
    instructions: "",
    qrCodeImage: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [qrPreview, setQrPreview] = useState("");

  useEffect(() => {
    fetchUPIConfig();
  }, []);

  const fetchUPIConfig = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/upi/admin/config", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setUpiConfig(data);
      if (data.qrCodeImage) {
        setQrPreview(data.qrCodeImage);
      }
    } catch (error) {
      console.error("Error fetching UPI config:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleQRUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrPreview(reader.result);
        setUpiConfig({ ...upiConfig, qrCodeImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!upiConfig.upiId.trim()) {
      alert("UPI ID is required");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/upi/admin/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(upiConfig)
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert("Error saving UPI configuration");
      }
    } catch (error) {
      console.error("Error saving UPI config:", error);
      alert("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="py-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">💳 UPI Payment Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {success && (
          <div className="p-4 bg-green-600/20 border border-green-600/50 rounded-lg flex items-center gap-2 text-green-400">
            <CheckCircle className="w-5 h-5" />
            <span>Configuration saved successfully!</span>
          </div>
        )}

        {/* UPI ID */}
        <div>
          <Label htmlFor="upiId" className="text-slate-200 block mb-2">
            UPI ID
          </Label>
          <Input
            id="upiId"
            type="text"
            value={upiConfig.upiId}
            onChange={(e) =>
              setUpiConfig({ ...upiConfig, upiId: e.target.value })
            }
            placeholder="e.g., siri@upi"
            className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
          />
          <p className="text-xs text-slate-400 mt-1">
            This UPI ID will be displayed to customers during checkout
          </p>
        </div>

        {/* Merchant Name */}
        <div>
          <Label htmlFor="merchantName" className="text-slate-200 block mb-2">
            Merchant Name
          </Label>
          <Input
            id="merchantName"
            type="text"
            value={upiConfig.merchantName}
            onChange={(e) =>
              setUpiConfig({ ...upiConfig, merchantName: e.target.value })
            }
            placeholder="Your business name"
            className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
          />
        </div>

        {/* Instructions */}
        <div>
          <Label htmlFor="instructions" className="text-slate-200 block mb-2">
            Payment Instructions
          </Label>
          <textarea
            id="instructions"
            value={upiConfig.instructions}
            onChange={(e) =>
              setUpiConfig({ ...upiConfig, instructions: e.target.value })
            }
            placeholder="Instructions for customers (optional)"
            rows={3}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-purple-600 resize-none"
          />
        </div>

        {/* QR Code */}
        <div>
          <Label className="text-slate-200 block mb-2">QR Code Image</Label>

          {qrPreview && (
            <div className="mb-4 p-4 bg-white rounded-lg">
              <img
                src={qrPreview}
                alt="UPI QR Code Preview"
                className="w-40 h-40 mx-auto object-contain"
              />
            </div>
          )}

          <div className="flex gap-2">
            <label className="flex-1 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleQRUpload}
                className="hidden"
              />
              <div className="bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 transition flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" />
                Upload QR Code
              </div>
            </label>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Upload a PNG or JPG file of your UPI QR code
          </p>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Configuration"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AdminUPIConfig;