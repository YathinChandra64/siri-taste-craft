import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Upload, Edit, Trash2, Eye, Search, FileDown } from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Saree = {
  _id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string;
  description: string;
  isActive: boolean;
};

interface SareeFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  material: string;
  color: string;
  stock: string;
  imageUrl: string;
  sku: string;
}

interface ParsedSaree {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  material: string;
  color: string;
  imageUrl: string;
  sku: string;
}

interface ExcelRow {
  name?: string;
  Name?: string;
  description?: string;
  Description?: string;
  price?: number | string;
  Price?: number | string;
  stock?: number | string;
  Stock?: number | string;
  category?: string;
  Category?: string;
  material?: string;
  Material?: string;
  color?: string;
  Color?: string;
  imageUrl?: string;
  ImageUrl?: string;
  sku?: string;
  SKU?: string;
}

const AdminSarees = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sarees, setSarees] = useState<Saree[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSaree, setSelectedSaree] = useState<Saree | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileError, setFileError] = useState("");
  const [parsedSarees, setParsedSarees] = useState<ParsedSaree[]>([]);
  const [formData, setFormData] = useState<SareeFormData>({
    name: "",
    description: "",
    price: "",
    category: "Traditional",
    material: "",
    color: "",
    stock: "",
    imageUrl: "",
    sku: ""
  });

  const fetchSarees = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:5000/api/sarees");
      if (response.ok) {
        const data = await response.json();
        setSarees(data);
      }
    } catch (error) {
      console.error("Failed to fetch sarees:", error);
      toast({
        title: "Error",
        description: "Failed to load sarees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSarees();
  }, [fetchSarees]);

  const handleAddSaree = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:5000/api/sarees", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock)
        })
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Saree added successfully",
        });
        setShowAddDialog(false);
        setFormData({
          name: "",
          description: "",
          price: "",
          category: "Traditional",
          material: "",
          color: "",
          stock: "",
          imageUrl: "",
          sku: ""
        });
        fetchSarees();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to add saree",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to add saree:", error);
      toast({
        title: "Error",
        description: "Failed to add saree",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ FIXED: Parse Excel file and extract data with proper typing
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError("");
    setParsedSarees([]);

    try {
      // Validate file type
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        setFileError("Please upload a valid Excel file (.xlsx or .xls)");
        return;
      }

      // Read file as array buffer
      const fileReader = new FileReader();
      fileReader.onload = async (event) => {
        try {
          const data = event.target?.result;
          if (!data) {
            setFileError("Failed to read file");
            return;
          }

          // ✅ FIXED: Use dynamic import to handle xlsx properly
          const { read, utils } = await import("xlsx");
          
          // Parse Excel file
          const workbook = read(data, { type: "array" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          
          if (!worksheet) {
            setFileError("No data found in Excel file");
            return;
          }

          // Convert to JSON
          const jsonData: ExcelRow[] = utils.sheet_to_json(worksheet);

          if (jsonData.length === 0) {
            setFileError("Excel file is empty");
            return;
          }

          // ✅ FIXED: Validate required fields with proper typing
          const validatedData: ParsedSaree[] = jsonData.map((row: ExcelRow, index: number) => {
            const saree: ParsedSaree = {
              name: row.name || row.Name || "",
              description: row.description || row.Description || "",
              price: parseFloat(String(row.price || row.Price || 0)),
              stock: parseInt(String(row.stock || row.Stock || 0)),
              category: row.category || row.Category || "Traditional",
              material: row.material || row.Material || "",
              color: row.color || row.Color || "",
              imageUrl: row.imageUrl || row.ImageUrl || "",
              sku: row.sku || row.SKU || ""
            };

            // Validate required fields
            if (!saree.name || !saree.description || !saree.price || !saree.stock) {
              throw new Error(
                `Row ${index + 2}: Missing required fields (name, description, price, stock)`
              );
            }

            return saree;
          });

          setParsedSarees(validatedData);
          toast({
            title: "Success",
            description: `${validatedData.length} sarees loaded from Excel file`,
          });

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Failed to parse Excel file";
          setFileError(errorMsg);
          toast({
            title: "Error",
            description: errorMsg,
            variant: "destructive",
          });
        }
      };

      fileReader.readAsArrayBuffer(file);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to read file";
      setFileError(errorMsg);
    }
  };

  // ✅ FIXED: Upload parsed sarees to backend
  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (parsedSarees.length === 0) {
        toast({
          title: "Error",
          description: "Please upload and parse an Excel file first",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:5000/api/sarees/bulk/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsedSarees)
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Success!",
          description: `${result.count} sarees uploaded successfully`,
        });
        setShowBulkDialog(false);
        setParsedSarees([]);
        setFileError("");
        fetchSarees();
      } else {
        const error = await response.json();
        toast({
          title: "Upload Failed",
          description: error.message || "Failed to upload sarees",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to bulk upload:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload sarees",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSaree = async (sareeId: string) => {
    if (!confirm("Are you sure you want to delete this saree?")) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`http://localhost:5000/api/sarees/${sareeId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({
          title: "Deleted",
          description: "Saree deleted successfully",
        });
        fetchSarees();
      }
    } catch (error) {
      console.error("Failed to delete saree:", error);
      toast({
        title: "Error",
        description: "Failed to delete saree",
        variant: "destructive",
      });
    }
  };

  // ✅ FIXED: Download Excel template with proper typing
  const downloadTemplate = async () => {
    try {
      const { utils, writeFile } = await import("xlsx");
      
      const templateData: ParsedSaree[] = [
        {
          name: "Silk Saree",
          description: "Beautiful silk saree with traditional design",
          price: 5000,
          stock: 10,
          category: "Silk",
          material: "Silk",
          color: "Red",
          imageUrl: "https://example.com/image.jpg",
          sku: "SAR-001"
        },
        {
          name: "Cotton Saree",
          description: "Comfortable cotton saree for daily wear",
          price: 2000,
          stock: 20,
          category: "Cotton",
          material: "Cotton",
          color: "Blue",
          imageUrl: "https://example.com/image.jpg",
          sku: "SAR-002"
        }
      ];

      const worksheet = utils.json_to_sheet(templateData);
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, "Sarees");
      writeFile(workbook, "saree_template.xlsx");

      toast({
        title: "Template Downloaded",
        description: "Fill in the template and upload it back",
      });
    } catch (error) {
      console.error("Failed to download template:", error);
      toast({
        title: "Error",
        description: "Failed to download template",
        variant: "destructive",
      });
    }
  };

  const filteredSarees = sarees.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />

      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="px-4 py-1 rounded-full bg-purple-100 dark:bg-purple-900">
              <span className="text-sm font-bold text-purple-700 dark:text-purple-200">SAREE MANAGEMENT</span>
            </div>
          </div>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">Manage Sarees</h1>
              <p className="text-muted-foreground">Add, edit, or delete sarees from your inventory</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus size={18} className="mr-2" />
                Single Saree
              </Button>
              <Button
                onClick={() => setShowBulkDialog(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Upload size={18} className="mr-2" />
                Bulk Upload
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <div className="mb-8 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            type="text"
            placeholder="Search sarees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 py-6"
          />
        </div>

        {/* Sarees Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSarees.map((saree, index) => (
              <motion.div
                key={saree._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <img
                      src={saree.imageUrl}
                      alt={saree.name}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        saree.stock > 0
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {saree.stock > 0 ? `${saree.stock} in stock` : "Out of stock"}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-1 line-clamp-2">{saree.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{saree.category}</p>
                    <p className="text-2xl font-bold text-primary mb-4">₹{saree.price.toLocaleString()}</p>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setSelectedSaree(saree)}
                      >
                        <Eye size={16} className="mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-orange-600 hover:bg-orange-700"
                      >
                        <Edit size={16} className="mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteSaree(saree._id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Add Single Saree Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Saree</DialogTitle>
              <DialogDescription>Fill in the details to add a new saree</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddSaree} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Saree name"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe the saree"
                  className="w-full p-2 border rounded text-sm"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Price *</label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Stock *</label>
                  <Input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full p-2 border rounded text-sm"
                  >
                    <option>Silk</option>
                    <option>Cotton</option>
                    <option>Bridal</option>
                    <option>Designer</option>
                    <option>Casual</option>
                    <option>Traditional</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Material</label>
                  <Input
                    value={formData.material}
                    onChange={(e) => setFormData({...formData, material: e.target.value})}
                    placeholder="e.g., Silk, Cotton"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Color</label>
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    placeholder="e.g., Red, Blue"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">SKU</label>
                  <Input
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                    placeholder="e.g., SAR-001"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Image URL</label>
                <Input
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                  placeholder="https://..."
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700">
                {isSubmitting ? "Adding..." : "Add Saree"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Bulk Upload Dialog - Excel File */}
        <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Bulk Upload Sarees from Excel</DialogTitle>
              <DialogDescription>Upload an Excel file (.xlsx) with saree details</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleBulkUpload} className="space-y-4">
              {/* Download Template Button */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={downloadTemplate}
                >
                  <FileDown size={18} className="mr-2" />
                  Download Excel Template
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Download the template to see the required format
                </p>
              </div>

              {/* File Upload */}
              <div>
                <label className="text-sm font-medium block mb-2">Upload Excel File *</label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload size={32} className="mx-auto mb-2 text-muted-foreground" />
                    <p className="font-semibold">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground">Excel files (.xlsx, .xls)</p>
                  </label>
                </div>
              </div>

              {/* Error Message */}
              {fileError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
                  {fileError}
                </div>
              )}

              {/* Preview of Parsed Data */}
              {parsedSarees.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">
                    Preview: {parsedSarees.length} sarees ready to upload
                  </p>
                  <div className="max-h-64 overflow-y-auto border rounded p-3 space-y-2">
                    {parsedSarees.map((saree, idx) => (
                      <div key={idx} className="text-xs p-2 bg-muted rounded">
                        <p className="font-semibold">{saree.name}</p>
                        <p className="text-muted-foreground">
                          ₹{saree.price} | Stock: {saree.stock} | {saree.category}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting || parsedSarees.length === 0}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? "Uploading..." : `Upload ${parsedSarees.length} Sarees`}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Saree Details */}
        {selectedSaree && (
          <Dialog open={!!selectedSaree} onOpenChange={() => setSelectedSaree(null)}>
            <DialogContent className="max-w-2xl">
              <div className="grid md:grid-cols-2 gap-6">
                <img src={selectedSaree.imageUrl} alt={selectedSaree.name} className="w-full rounded-lg" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedSaree.name}</h2>
                  <p className="text-muted-foreground mb-4">{selectedSaree.description}</p>
                  <p className="text-3xl font-bold text-primary mb-4">₹{selectedSaree.price.toLocaleString()}</p>
                  <div className="space-y-2 mb-4">
                    <p><span className="font-semibold">Category:</span> {selectedSaree.category}</p>
                    <p><span className="font-semibold">Stock:</span> {selectedSaree.stock}</p>
                    <p><span className="font-semibold">Status:</span> {selectedSaree.isActive ? "Active" : "Inactive"}</p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default AdminSarees;