import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/useAuth";

const IssueReportForm = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    issueType: "website",
    description: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description.trim() || formData.description.length < 10) {
      setError("Description must be at least 10 characters");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:5000/api/issues/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess(true);
        setFormData({ issueType: "website", description: "" });
        setTimeout(() => setSuccess(false), 5000);
      } else {
        const data = await response.json();
        setError(data.message || "Failed to report issue");
      }
    } catch (err) {
      setError("Error reporting issue");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-400" />
          Report an Issue
        </CardTitle>
        <p className="text-slate-400 text-sm mt-2">
          Let us know if you're facing any problems. We'll respond promptly!
        </p>
      </CardHeader>
      <CardContent>
        {success && (
          <div className="mb-4 p-4 bg-green-600/20 border border-green-600/50 rounded-lg flex items-center gap-2 text-green-400">
            <CheckCircle className="w-5 h-5" />
            <span>Issue reported successfully! We'll review it soon.</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-600/20 border border-red-600/50 rounded-lg flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Issue Type */}
          <div>
            <Label htmlFor="issueType" className="text-slate-200 mb-2 block">
              Issue Type
            </Label>
            <select
              id="issueType"
              value={formData.issueType}
              onChange={(e) =>
                setFormData({ ...formData, issueType: e.target.value })
              }
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-600"
            >
              <option value="website">Website/App Issue</option>
              <option value="payment">Payment Issue</option>
              <option value="product">Product Quality</option>
              <option value="shipping">Shipping/Delivery</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-slate-200 mb-2 block">
              Describe the Issue
            </Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Please provide detailed information about the issue..."
              rows={4}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-purple-600 resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">
              Minimum 10 characters ({formData.description.length}/10)
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium"
          >
            {loading ? "Submitting..." : "Report Issue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default IssueReportForm;