import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Upload, Edit, Trash2, Eye, Search, FileDown, X } from "lucide-react";
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
  const [editingSaree, setEditingSaree] = useState<Saree | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
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
        // Extract the data array from the API response object
        const sareeList = Array.isArray(data) ? data : (data.data || []);
        setSarees(sareeList);
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

  // ✅ FIXED: Add Saree Handler
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

  // ✅ NEW: Edit Saree Handler
  const handleEditSaree = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSaree) return;

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`http://localhost:5000/api/sarees/${editingSaree._id}`, {
        method: "PUT",
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
          description: "Saree updated successfully",
        });
        setShowEditDialog(false);
        setEditingSaree(null);
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
          description: error.message || "Failed to update saree",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to update saree:", error);
      toast({
        title: "Error",
        description: "Failed to update saree",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ NEW: Open Edit Dialog
  const openEditDialog = (saree: Saree) => {
    setEditingSaree(saree);
    setFormData({
      name: saree.name,
      description: saree.description,
      price: saree.price.toString(),
      category: saree.category,
      material: "",
      color: "",
      stock: saree.stock.toString(),
      imageUrl: saree.imageUrl,
      sku: ""
    });
    setShowEditDialog(true);
  };

  // ✅ NEW: Delete Saree
  const handleDeleteSaree = async (sareeId: string) => {
    if (!confirm("Are you sure you want to delete this saree?")) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`http://localhost:5000/api/sarees/${sareeId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Saree deleted successfully",
        });
        fetchSarees();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete saree",
          variant: "destructive",
        });
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

  // File upload handler (keeping original logic)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError("");
    setParsedSarees([]);

    try {
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        setFileError("Please upload a valid Excel file (.xlsx or .xls)");
        return;
      }

      const fileReader = new FileReader();
      fileReader.onload = async (event) => {
        try {
          const data = event.target?.result;
          if (!data) {
            setFileError("Failed to read file");
            return;
          }

          const { read, utils } = await import("xlsx");
          const workbook = read(data, { type: "array" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          
          if (!worksheet) {
            setFileError("No data found in Excel file");
            return;
          }

          const jsonData: ExcelRow[] = utils.sheet_to_json(worksheet);

          if (jsonData.length === 0) {
            setFileError("Excel file is empty");
            return;
          }

          const validatedData: ParsedSaree[] = jsonData.map((row: ExcelRow) => ({
            name: row.name || row.Name || "",
            description: row.description || row.Description || "",
            price: parseFloat(String(row.price || row.Price || 0)),
            stock: parseInt(String(row.stock || row.Stock || 0)),
            category: row.category || row.Category || "Traditional",
            material: row.material || row.Material || "",
            color: row.color || row.Color || "",
            imageUrl: row.imageUrl || row.ImageUrl || "",
            sku: row.sku || row.SKU || ""
          }));

          setParsedSarees(validatedData);
        } catch (error) {
          console.error("Error parsing file:", error);
          setFileError("Error parsing Excel file. Please check format.");
        }
      };
      fileReader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("File upload error:", error);
      setFileError("Failed to upload file");
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:5000/api/sarees/bulk", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sarees: parsedSarees })
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: `${parsedSarees.length} sarees uploaded successfully`,
        });
        setShowBulkDialog(false);
        setParsedSarees([]);
        fetchSarees();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to upload sarees",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Bulk upload error:", error);
      toast({
        title: "Error",
        description: "Failed to upload sarees",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadTemplate = () => {
    const template = `Name,Description,Price,Stock,Category,Material,Color,ImageUrl,SKU
Gadwal pattu,Beautiful traditional saree,4000,10,Traditional,Cotton,Red,https://example.com/img1.jpg,SAR-001
Kurnool pattu,Designer saree,6000,5,Designer,Silk,Blue,https://example.com/img2.jpg,SAR-002`;

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(template));
    element.setAttribute("download", "sarees_template.csv");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const filteredSarees = sarees.filter(saree =>
    saree.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    saree.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <AnimatedBackground />

      <div className="relative z-10 p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Manage Sarees</h1>
          <p className="text-purple-200">Add, edit, and manage your saree collection</p>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row gap-4 mb-8"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <Input
              placeholder="Search sarees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Button
            onClick={() => {
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
              setShowAddDialog(true);
            }}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus size={20} className="mr-2" />
            Add Saree
          </Button>

          <Button
            onClick={() => setShowBulkDialog(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Upload size={20} className="mr-2" />
            Bulk Upload
          </Button>
        </motion.div>

        {/* ✅ FIXED: Better grid layout - 4-5 cards per row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
        >
          {filteredSarees.map((saree, index) => (
            <motion.div
              key={saree._id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="h-full overflow-hidden bg-slate-800 border-purple-500/20 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/20">
                {/* Image */}
                <div className="relative h-40 overflow-hidden bg-slate-700">
                  <img
                    src={saree.imageUrl}
                    alt={saree.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => setSelectedSaree(saree)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Eye size={16} />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => openEditDialog(saree)}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDeleteSaree(saree._id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3">
                  <h3 className="font-semibold text-white text-sm truncate">{saree.name}</h3>
                  <p className="text-xs text-purple-300 mb-2">{saree.category}</p>
                  <p className="text-lg font-bold text-green-400">₹{saree.price.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">Stock: {saree.stock}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 p-3 border-t border-purple-500/20">
                  <Button
                    size="sm"
                    onClick={() => setSelectedSaree(saree)}
                    variant="outline"
                    className="flex-1 text-xs h-8"
                  >
                    View
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => openEditDialog(saree)}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-xs h-8"
                  >
                    Edit
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {filteredSarees.length === 0 && (
          <div className="text-center text-gray-400 mt-12">
            <p>No sarees found</p>
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={showAddDialog || showEditDialog} onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setShowEditDialog(false);
            setEditingSaree(null);
          }
        }}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSaree ? "Edit Saree" : "Add New Saree"}</DialogTitle>
              <DialogDescription>
                {editingSaree ? "Update the saree details" : "Fill in the details to add a new saree"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={editingSaree ? handleEditSaree : handleAddSaree} className="space-y-4">
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

              <Button
                type="submit"
                disabled={isSubmitting}
                className={`w-full ${editingSaree ? "bg-orange-600 hover:bg-orange-700" : "bg-green-600 hover:bg-green-700"}`}
              >
                {isSubmitting ? "Saving..." : (editingSaree ? "Update Saree" : "Add Saree")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Bulk Upload Dialog */}
        <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Bulk Upload Sarees from Excel</DialogTitle>
              <DialogDescription>Upload an Excel file (.xlsx) with saree details</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleBulkUpload} className="space-y-4">
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

              {fileError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
                  {fileError}
                </div>
              )}

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

        {/* View Dialog */}
        {selectedSaree && (
          <Dialog open={!!selectedSaree} onOpenChange={() => setSelectedSaree(null)}>
            <DialogContent className="max-w-2xl">
              <div className="grid md:grid-cols-2 gap-6">
                <img src={selectedSaree.imageUrl} alt={selectedSaree.name} className="w-full rounded-lg" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedSaree.name}</h2>
                  <p className="text-muted-foreground mb-4">{selectedSaree.description}</p>
                  <p className="text-3xl font-bold text-green-500 mb-4">₹{selectedSaree.price.toLocaleString()}</p>
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