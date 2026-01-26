import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

// 🛒 Place Order
export const placeOrder = async (req, res) => {
  try {
    const { items, totalAmount } = req.body;

    // ✅ Validation
    if (!items || items.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "No items in order"
      });
    }

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid total amount"
      });
    }

    // ✅ Process each item and validate product IDs
    let calculatedTotal = 0;
    const processedItems = [];

    for (const item of items) {
      // Validate item has required fields
      if (!item.product || !item.quantity) {
        return res.status(400).json({ 
          success: false,
          message: "Each item must have product ID and quantity"
        });
      }

      // ✅ CRITICAL FIX: Validate and convert product ID to MongoDB ObjectId
      let productId;
      
      // Check if the product ID is a valid MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(item.product)) {
        productId = new mongoose.Types.ObjectId(item.product);
      } else {
        // If not valid, return error
        return res.status(400).json({
          success: false,
          message: `Invalid product ID format: "${item.product}". Must be a valid MongoDB ID.`
        });
      }

      // Fetch product from database
      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found with ID: ${item.product}`
        });
      }

      // Check stock availability
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`
        });
      }

      // Deduct stock from product
      product.stock -= item.quantity;
      await product.save();

      // Build processed item with correct data
      processedItems.push({
        product: productId,
        name: item.name || product.name,
        quantity: item.quantity,
        price: item.price || product.price
      });

      // Calculate total
      calculatedTotal += (item.price || product.price) * item.quantity;
    }

    // ✅ Create order with validated data
    const order = await Order.create({
      user: new mongoose.Types.ObjectId(req.user.id),
      items: processedItems,
      totalAmount: calculatedTotal || totalAmount,
      status: "pending_payment",
      paymentMethod: "upi"
    });

    console.log("✅ Order created successfully:", order._id);

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      _id: order._id,
      order: order
    });

  } catch (error) {
    console.error("❌ Order creation error:", error);
    
    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        message: "Validation failed: " + messages.join(", "),
        errors: messages
      });
    }

    // Handle other errors
    return res.status(500).json({ 
      success: false,
      message: error.message || "Error creating order",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// 👤 Get User's Orders
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate("items.product", "name price image")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      orders: orders
    });
  } catch (error) {
    console.error("❌ Get orders error:", error);
    return res.status(500).json({ 
      success: false,
      message: error.message || "Error fetching orders"
    });
  }
};

// 🛠 Admin: Get All Orders
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "email name")
      .populate("items.product", "name price image")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      orders: orders,
      total: orders.length
    });
  } catch (error) {
    console.error("❌ Get all orders error:", error);
    return res.status(500).json({ 
      success: false,
      message: error.message || "Error fetching orders"
    });
  }
};