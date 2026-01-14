import Product from "../models/Product.js";

// ➕ Add Product (Admin)
export const createProduct = async (req, res) => {
  try {
    console.log("Incoming body:", req.body); // 👈 ADD THIS

    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    console.error("Create product error:", error.message); // 👈 ADD THIS
    res.status(400).json({ message: error.message });
  }
};


// 📦 Get All Products
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔍 Get Single Product
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    res.json(product);
  } catch (error) {
    res.status(404).json({ message: "Product not found" });
  }
};
