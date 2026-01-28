import Cart from "../models/Cart.js";
import Saree from "../models/Saree.js";
import mongoose from "mongoose";

// ✅ FIXED: Cart Controller with proper MongoDB ObjectId validation

// ➕ Add to cart
export const addToCart = async (req, res) => {
  try {
    const { sareeId, quantity } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "User not authenticated" 
      });
    }

    if (!sareeId || !quantity || quantity < 1) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid saree ID or quantity. Quantity must be at least 1." 
      });
    }

    // ✅ Validate saree ID format
    if (!mongoose.Types.ObjectId.isValid(sareeId)) {
      return res.status(400).json({
        success: false,
        message: `Invalid saree ID format: "${sareeId}". Must be a valid MongoDB ID.`
      });
    }

    // Check if saree exists and has stock
    const saree = await Saree.findById(new mongoose.Types.ObjectId(sareeId));
    if (!saree || !saree.isActive) {
      return res.status(404).json({ 
        success: false,
        message: "Saree not found or no longer available" 
      });
    }

    if (saree.stock < quantity) {
      return res.status(400).json({ 
        success: false,
        message: `Insufficient stock. Available: ${saree.stock}, Requested: ${quantity}` 
      });
    }

    // ✅ Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    // Check if already in cart
    let cartItem = await Cart.findOne({ 
      user: new mongoose.Types.ObjectId(userId), 
      saree: new mongoose.Types.ObjectId(sareeId) 
    });

    if (cartItem) {
      cartItem.quantity += quantity;
    } else {
      cartItem = await Cart.create({
        user: new mongoose.Types.ObjectId(userId),
        saree: new mongoose.Types.ObjectId(sareeId),
        quantity
      });
    }

    await cartItem.save();
    await cartItem.populate("saree");

    console.log(`✅ Added to cart: ${saree.name} (Qty: ${quantity})`);

    res.status(201).json({
      success: true,
      message: "Added to cart",
      cartItem
    });
  } catch (error) {
    console.error("❌ Add to cart error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// 🛒 Get user's cart
export const getCart = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "User not authenticated" 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    const cartItems = await Cart.find({ user: new mongoose.Types.ObjectId(userId) })
      .populate("saree")
      .sort({ createdAt: -1 });

    // Calculate total
    const total = cartItems.reduce((sum, item) => {
      return sum + ((item.saree?.price || 0) * item.quantity);
    }, 0);

    console.log(`✅ Fetched cart for user: ${userId}, Items: ${cartItems.length}`);

    res.json({
      success: true,
      count: cartItems.length,
      total: total,
      cartItems: cartItems
    });
  } catch (error) {
    console.error("❌ Get cart error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// 🗑️ Remove from cart
export const removeFromCart = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "User not authenticated" 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(cartItemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart item ID"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    const cartItem = await Cart.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(cartItemId),
      user: new mongoose.Types.ObjectId(userId)
    });

    if (!cartItem) {
      return res.status(404).json({ 
        success: false,
        message: "Cart item not found" 
      });
    }

    console.log(`✅ Removed from cart: ${cartItemId}`);

    res.json({
      success: true,
      message: "Removed from cart",
      cartItem
    });
  } catch (error) {
    console.error("❌ Remove from cart error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✏️ Update quantity
export const updateCartQuantity = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "User not authenticated" 
      });
    }

    if (!quantity || quantity < 1) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid quantity. Must be at least 1." 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(cartItemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart item ID"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    const cartItem = await Cart.findOne({ 
      _id: new mongoose.Types.ObjectId(cartItemId), 
      user: new mongoose.Types.ObjectId(userId) 
    })
      .populate("saree");

    if (!cartItem) {
      return res.status(404).json({ 
        success: false,
        message: "Cart item not found" 
      });
    }

    if (cartItem.saree.stock < quantity) {
      return res.status(400).json({ 
        success: false,
        message: `Insufficient stock. Available: ${cartItem.saree.stock}` 
      });
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    console.log(`✅ Updated cart quantity: ${cartItemId} -> ${quantity}`);

    res.json({
      success: true,
      message: "Cart updated",
      cartItem
    });
  } catch (error) {
    console.error("❌ Update quantity error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// 🧹 Clear cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "User not authenticated" 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    const result = await Cart.deleteMany({ user: new mongoose.Types.ObjectId(userId) });

    console.log(`✅ Cleared cart: ${result.deletedCount} items removed`);

    res.json({ 
      success: true,
      message: `Cart cleared. ${result.deletedCount} items removed`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("❌ Clear cart error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};