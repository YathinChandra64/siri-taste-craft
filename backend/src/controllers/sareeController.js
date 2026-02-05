import mongoose from "mongoose";
import Saree from "../models/Saree.js";

// 📦 Get all sarees (Public)
export const getAllSarees = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice } = req.query;
    let filter = { isActive: true };

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice);
    }

    const sarees = await Saree.find(filter).sort({ createdAt: -1 });
    res.json(sarees);
  } catch (error) {
    console.error("Get sarees error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🔍 Get saree by ID (Public)
export const getSareeById = async (req, res) => {
  try {
    const saree = await Saree.findById(req.params.id);

    if (!saree || !saree.isActive) {
      return res.status(404).json({ message: "Saree not found" });
    }

    res.json(saree);
  } catch (error) {
    console.error("Get saree error:", error);
    res.status(400).json({ message: "Invalid saree ID" });
  }
};

// ➕ Create single saree (Admin only)
export const createSaree = async (req, res) => {
  try {
    const { name, description, price, category, material, color, stock, imageUrl, sku } = req.body;

    if (!name || !description || !price || stock === undefined) {
      return res.status(400).json({ 
        message: "Name, description, price, and stock are required" 
      });
    }

    // ✅ FIX: Check if SKU already exists (only if provided)
    if (sku && sku.trim() !== "") {
      const existingSaree = await Saree.findOne({ sku: sku.trim() });
      if (existingSaree) {
        return res.status(409).json({ message: "SKU already exists" });
      }
    }

    const saree = await Saree.create({
      name,
      description,
      price: parseFloat(price),
      category: category || "Traditional",
      material: material || "",
      color: color || "",
      stock: parseInt(stock),
      imageUrl: imageUrl || "",
      sku: (sku && sku.trim() !== "") ? sku.trim() : null  // ✅ Use null for empty SKU
    });

    console.log("✅ Saree created:", saree._id);

    res.status(201).json({
      message: "Saree created successfully",
      saree
    });

  } catch (error) {
    console.error("❌ Create saree error:", error);
    res.status(500).json({ 
      message: error.message || "Failed to create saree",
      error: process.env.NODE_ENV === "development" ? error : undefined
    });
  }
};

// ✏️ Update saree (Admin only) - FIXED FOR E11000 DUPLICATE KEY ERROR
export const updateSaree = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log("📝 Update request for saree:", id);
    console.log("📝 Update data:", updateData);

    // ✅ Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error("❌ Invalid saree ID format:", id);
      return res.status(400).json({ message: "Invalid saree ID format" });
    }

    // ✅ CRITICAL FIX: Remove empty strings to avoid duplicate key error
    if (updateData.sku !== undefined) {
      if (updateData.sku === "" || (updateData.sku && updateData.sku.trim() === "")) {
        delete updateData.sku;  // Don't update SKU if it's empty
        console.log("⚠️ Empty SKU provided - skipping SKU update");
      } else if (updateData.sku) {
        updateData.sku = updateData.sku.trim();
      }
    }

    // Remove empty strings from other optional fields
    if (updateData.material === "") delete updateData.material;
    if (updateData.color === "") delete updateData.color;

    // Convert types properly
    if (updateData.price !== undefined) {
      updateData.price = parseFloat(updateData.price);
    }
    if (updateData.stock !== undefined) {
      updateData.stock = parseInt(updateData.stock);
    }

    // Don't allow changing SKU to a duplicate (only check if SKU is being updated)
    if (updateData.sku) {
      const existingSaree = await Saree.findOne({ 
        sku: updateData.sku, 
        _id: { $ne: id } 
      });
      if (existingSaree) {
        return res.status(409).json({ message: "SKU already exists" });
      }
    }

    const saree = await Saree.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: false }
    );

    if (!saree) {
      console.error("❌ Saree not found:", id);
      return res.status(404).json({ message: "Saree not found" });
    }

    console.log("✅ Saree updated successfully:", saree._id);

    res.json({
      message: "Saree updated successfully",
      saree
    });
  } catch (error) {
    console.error("❌ Update saree error:", error);
    
    // Handle duplicate key error specifically
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: "Duplicate value error - SKU might already exist. Try updating without SKU or use a unique SKU."
      });
    }

    res.status(500).json({ 
      message: error.message || "Failed to update saree",
      error: process.env.NODE_ENV === "development" ? error.toString() : undefined
    });
  }
};

// 🗑️ Delete saree (Admin only - Soft delete)
export const deleteSaree = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("🗑️ Delete request for saree:", id);

    // ✅ Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error("❌ Invalid saree ID format:", id);
      return res.status(400).json({ message: "Invalid saree ID format" });
    }

    const saree = await Saree.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!saree) {
      console.error("❌ Saree not found:", id);
      return res.status(404).json({ message: "Saree not found" });
    }

    console.log("✅ Saree deleted successfully:", saree._id);

    res.json({
      message: "Saree deleted successfully",
      saree
    });
  } catch (error) {
    console.error("❌ Delete saree error:", error);
    res.status(500).json({ 
      message: error.message || "Failed to delete saree",
      error: process.env.NODE_ENV === "development" ? error.toString() : undefined
    });
  }
};

// 📤 Bulk upload sarees (Admin only)
export const bulkUploadSarees = async (req, res) => {
  try {
    // Handle both { sarees: [] } and direct array format
    let sarees = req.body;
    
    if (req.body.sarees && Array.isArray(req.body.sarees)) {
      sarees = req.body.sarees;
    }

    if (!Array.isArray(sarees) || sarees.length === 0) {
      return res.status(400).json({ 
        message: "Invalid data format. Expected array of sarees." 
      });
    }

    console.log("📤 Bulk upload:", sarees.length, "sarees");

    // Validate and process each saree
    const validationErrors = [];
    const processedSarees = sarees.map((saree, index) => {
      if (!saree.name || !saree.description || !saree.price || saree.stock === undefined) {
        validationErrors.push(`Row ${index + 1}: Missing required fields`);
      }
      
      return {
        ...saree,
        price: parseFloat(saree.price),
        stock: parseInt(saree.stock),
        // ✅ FIX: Use null for empty SKU instead of empty string
        sku: (saree.sku && saree.sku.trim() !== "") ? saree.sku.trim() : null,
        isActive: true
      };
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: "Validation failed",
        errors: validationErrors 
      });
    }

    // Insert all sarees
    const createdSarees = await Saree.insertMany(processedSarees);

    console.log("✅ Bulk upload completed:", createdSarees.length, "sarees");

    res.status(201).json({
      message: `${createdSarees.length} sarees uploaded successfully`,
      count: createdSarees.length,
      sarees: createdSarees
    });

  } catch (error) {
    console.error("❌ Bulk upload error:", error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({ 
        message: `Duplicate ${field} found. Please ensure all SKUs are unique.` 
      });
    }

    res.status(500).json({ 
      message: error.message || "Failed to upload sarees",
      error: process.env.NODE_ENV === "development" ? error.toString() : undefined
    });
  }
};

// 📊 Get saree statistics (Admin only)
export const getSareeStats = async (req, res) => {
  try {
    const totalSarees = await Saree.countDocuments({ isActive: true });
    const outOfStock = await Saree.countDocuments({ isActive: true, stock: 0 });
    const categories = await Saree.distinct("category", { isActive: true });

    const totalValue = await Saree.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: { $multiply: ["$price", "$stock"] } } } }
    ]);

    res.json({
      totalSarees,
      outOfStock,
      inStock: totalSarees - outOfStock,
      categories,
      totalInventoryValue: totalValue[0]?.total || 0
    });
  } catch (error) {
    console.error("❌ Get stats error:", error);
    res.status(500).json({ 
      message: error.message || "Failed to get statistics",
      error: process.env.NODE_ENV === "development" ? error.toString() : undefined
    });
  }
};