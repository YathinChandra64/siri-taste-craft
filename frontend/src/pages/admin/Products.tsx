import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Eye,
  EyeOff,
  Package,
  TrendingUp,
  AlertCircle,
  Loader,
} from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Saree {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
}

interface Stats {
  totalSarees: number;
  outOfStock: number;
  inStock: number;
  categories: string[];
  totalInventoryValue: number;
}

const AdminProducts = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [sarees, setSarees] = useState<Saree[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSaree, setSelectedSaree] = useState<Saree | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Silk",
    stock: "",
    imageUrl: "",
  });

  // Check auth
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }

    if (!authLoading && user?.role !== "admin") {
      navigate("/");
      return;
    }

    if (!authLoading) {
      fetchSarees();
      fetchStats();
    }
  }, [authLoading, user, navigate]);

  const fetchSarees = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:5000/api/sarees", {
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        // Extract the data array from the API response object
        const sareeList = Array.isArray(data) ? data : (data.data || []);
        setSarees(sareeList);
        console.log("✅ Sarees loaded:", sareeList.length);
      }
    } catch (error) {
      console.error("Failed to fetch sarees:", error);
      toast({ title: "Error", description: "Failed to load sarees", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:5000/api/sarees/stats", {
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const handleAddSaree = async () => {
    try {
      if (!formData.name || !formData.description || !formData.price || !formData.stock) {
        toast({ title: "Error", description: "All fields are required", variant: "destructive" });
        return;
      }

      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:5000/api/sarees", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          price: parseInt(formData.price),
          stock: parseInt(formData.stock),
        }),
      });

      if (response.ok) {
        toast({ title: "Success", description: "Saree added successfully" });
        setIsAddDialogOpen(false);
        setFormData({ name: "", description: "", price: "", category: "Silk", stock: "", imageUrl: "" });
        fetchSarees();
        fetchStats();
      } else {
        const error = await response.json();
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to add saree:", error);
      toast({ title: "Error", description: "Failed to add saree", variant: "destructive" });
    }
  };

  const handleUpdateSaree = async () => {
    if (!selectedSaree) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`http://localhost:5000/api/sarees/${selectedSaree._id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          price: parseInt(formData.price),
          stock: parseInt(formData.stock),
        }),
      });

      if (response.ok) {
        toast({ title: "Success", description: "Saree updated successfully" });
        setIsEditDialogOpen(false);
        setSelectedSaree(null);
        setFormData({ name: "", description: "", price: "", category: "Silk", stock: "", imageUrl: "" });
        fetchSarees();
        fetchStats();
      } else {
        const error = await response.json();
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to update saree:", error);
      toast({ title: "Error", description: "Failed to update saree", variant: "destructive" });
    }
  };

  const handleDeleteSaree = async (id: string) => {
    if (!confirm("Are you sure you want to delete this saree?")) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`http://localhost:5000/api/sarees/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (response.ok) {
        toast({ title: "Success", description: "Saree deleted successfully" });
        fetchSarees();
        fetchStats();
      }
    } catch (error) {
      console.error("Failed to delete saree:", error);
      toast({ title: "Error", description: "Failed to delete saree", variant: "destructive" });
    }
  };

  const handleToggleActive = async (saree: Saree) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`http://localhost:5000/api/sarees/${saree._id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !saree.isActive }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: saree.isActive ? "Product hidden" : "Product shown",
        });
        fetchSarees();
      }
    } catch (error) {
      console.error("Failed to toggle product:", error);
      toast({ title: "Error", description: "Failed to update product", variant: "destructive" });
    }
  };

  const openEditDialog = (saree: Saree) => {
    setSelectedSaree(saree);
    setFormData({
      name: saree.name,
      description: saree.description,
      price: saree.price.toString(),
      category: saree.category,
      stock: saree.stock.toString(),
      imageUrl: saree.imageUrl || "",
    });
    setIsEditDialogOpen(true);
  };

  const filteredSarees = sarees.filter((saree) => {
    const matchesSearch = saree.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || saree.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex justify-center items-center">
        <Loader className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />

      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Manage Products</h1>
              <p className="text-slate-400">Add, edit, and manage your saree collection</p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700 flex gap-2">
                  <Plus size={20} /> Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700 text-white">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Product Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="e.g., Pure Silk Saree"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 text-white rounded p-2 text-sm"
                      placeholder="Product description"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Price (₹)</Label>
                      <Input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label>Stock</Label>
                      <Input
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Category</Label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 text-white rounded p-2"
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
                    <Label>Image URL</Label>
                    <Input
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="https://..."
                    />
                  </div>
                  <Button onClick={handleAddSaree} className="w-full bg-purple-600 hover:bg-purple-700">
                    Add Product
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          >
            <Card className="p-4 bg-slate-800 border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Products</p>
                  <p className="text-3xl font-bold text-white">{stats.totalSarees}</p>
                </div>
                <Package className="w-10 h-10 text-purple-600" />
              </div>
            </Card>
            <Card className="p-4 bg-slate-800 border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">In Stock</p>
                  <p className="text-3xl font-bold text-green-500">{stats.inStock}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-600" />
              </div>
            </Card>
            <Card className="p-4 bg-slate-800 border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Out of Stock</p>
                  <p className="text-3xl font-bold text-red-500">{stats.outOfStock}</p>
                </div>
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
            </Card>
            <Card className="p-4 bg-slate-800 border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Inventory Value</p>
                  <p className="text-2xl font-bold text-amber-500">₹{stats.totalInventoryValue.toLocaleString()}</p>
                </div>
                <Package className="w-10 h-10 text-amber-600" />
              </div>
            </Card>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex gap-4 flex-wrap"
        >
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white pl-10"
              />
            </div>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded px-4 py-2"
          >
            <option value="">All Categories</option>
            {stats?.categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </motion.div>

        {/* Products Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="w-12 h-12 animate-spin text-purple-600" />
          </div>
        ) : filteredSarees.length === 0 ? (
          <Card className="p-8 text-center bg-slate-800 border-slate-700">
            <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No products found</p>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {filteredSarees.map((saree, index) => (
              <motion.div
                key={saree._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-4 bg-slate-800 border-slate-700 hover:border-purple-600/50 transition-all">
                  <div className="flex items-center justify-between gap-4 flex-wrap md:flex-nowrap">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-white">{saree.name}</h3>
                        <Badge className={saree.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                          {saree.isActive ? "Active" : "Hidden"}
                        </Badge>
                        {saree.stock === 0 && (
                          <Badge className="bg-red-500/20 text-red-400">Out of Stock</Badge>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm mb-2 line-clamp-1">{saree.description}</p>
                      <div className="flex gap-4 text-sm text-slate-400">
                        <span>Category: <span className="text-purple-400">{saree.category}</span></span>
                        <span>Price: <span className="text-green-400">₹{saree.price}</span></span>
                        <span>Stock: <span className="text-amber-400">{saree.stock}</span></span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(saree)}
                        className="border-slate-600"
                      >
                        {saree.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(saree)}
                        className="border-slate-600"
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteSaree(saree._id)}
                        className="border-red-600 hover:bg-red-500/10"
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Product Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label>Description</Label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded p-2 text-sm"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label>Stock</Label>
                  <Input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              <div>
                <Label>Category</Label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded p-2"
                >
                  <option>Silk</option>
                  <option>Cotton</option>
                  <option>Bridal</option>
                  <option>Designer</option>
                  <option>Casual</option>
                  <option>Traditional</option>
                </select>
              </div>
              <Button onClick={handleUpdateSaree} className="w-full bg-purple-600 hover:bg-purple-700">
                Update Product
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminProducts;