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

    if (!name || !description || !price || !stock) {
      return res.status(400).json({ message: "Name, description, price, and stock are required" });
    }

    // Check if SKU already exists
    if (sku) {
      const existingSaree = await Saree.findOne({ sku });
      if (existingSaree) {
        return res.status(409).json({ message: "SKU already exists" });
      }
    }

    const saree = await Saree.create({
      name,
      description,
      price,
      category,
      material,
      color,
      stock,
      imageUrl,
      sku
    });

    res.status(201).json({
      message: "Saree created successfully",
      saree
    });

  } catch (error) {
    console.error("Create saree error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✏️ Update saree (Admin only)
export const updateSaree = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Don't allow changing SKU to a duplicate
    if (updateData.sku) {
      const existingSaree = await Saree.findOne({ sku: updateData.sku, _id: { $ne: id } });
      if (existingSaree) {
        return res.status(409).json({ message: "SKU already exists" });
      }
    }

    const saree = await Saree.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!saree) {
      return res.status(404).json({ message: "Saree not found" });
    }

    res.json({
      message: "Saree updated successfully",
      saree
    });
  } catch (error) {
    console.error("Update saree error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🗑️ Delete saree (Admin only - Soft delete)
export const deleteSaree = async (req, res) => {
  try {
    const { id } = req.params;

    const saree = await Saree.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!saree) {
      return res.status(404).json({ message: "Saree not found" });
    }

    res.json({
      message: "Saree deactivated successfully",
      saree
    });
  } catch (error) {
    console.error("Delete saree error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 📤 Bulk upload sarees (Admin only)
export const bulkUploadSarees = async (req, res) => {
  try {
    const sarees = req.body;

    if (!Array.isArray(sarees) || sarees.length === 0) {
      return res.status(400).json({ message: "Invalid data format. Expected array of sarees." });
    }

    // Validate each saree
    const validationErrors = [];
    sarees.forEach((saree, index) => {
      if (!saree.name || !saree.description || !saree.price || saree.stock === undefined) {
        validationErrors.push(`Row ${index + 1}: Missing required fields`);
      }
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: "Validation failed",
        errors: validationErrors 
      });
    }

    // Insert all sarees
    const createdSarees = await Saree.insertMany(sarees);

    res.status(201).json({
      message: `${createdSarees.length} sarees uploaded successfully`,
      count: createdSarees.length,
      sarees: createdSarees
    });

  } catch (error) {
    console.error("Bulk upload error:", error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({ 
        message: `Duplicate ${field} found. Please ensure all SKUs are unique.` 
      });
    }

    res.status(500).json({ message: error.message });
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
    console.error("Get stats error:", error);
    res.status(500).json({ message: error.message });
  }
};