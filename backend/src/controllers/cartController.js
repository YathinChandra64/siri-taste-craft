import Cart from "../models/Cart.js";
import Saree from "../models/Saree.js";

// ➕ Add to cart
export const addToCart = async (req, res) => {
  try {
    const { sareeId, quantity } = req.body;
    const userId = req.user.id;

    if (!sareeId || !quantity || quantity < 1) {
      return res.status(400).json({ message: "Invalid saree or quantity" });
    }

    // Check if saree exists and has stock
    const saree = await Saree.findById(sareeId);
    if (!saree || !saree.isActive) {
      return res.status(404).json({ message: "Saree not found" });
    }

    if (saree.stock < quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    // Check if already in cart
    let cartItem = await Cart.findOne({ user: userId, saree: sareeId });

    if (cartItem) {
      cartItem.quantity += quantity;
    } else {
      cartItem = await Cart.create({
        user: userId,
        saree: sareeId,
        quantity
      });
    }

    await cartItem.save();
    await cartItem.populate("saree");

    res.status(201).json({
      message: "Added to cart",
      cartItem
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🛒 Get user's cart
export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cartItems = await Cart.find({ user: userId })
      .populate("saree")
      .sort({ createdAt: -1 });

    res.json(cartItems);
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🗑️ Remove from cart
export const removeFromCart = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const userId = req.user.id;

    const cartItem = await Cart.findOneAndDelete({
      _id: cartItemId,
      user: userId
    });

    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    res.json({
      message: "Removed from cart",
      cartItem
    });
  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✏️ Update quantity
export const updateCartQuantity = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: "Invalid quantity" });
    }

    const cartItem = await Cart.findOne({ _id: cartItemId, user: userId })
      .populate("saree");

    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    if (cartItem.saree.stock < quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    res.json({
      message: "Cart updated",
      cartItem
    });
  } catch (error) {
    console.error("Update quantity error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🧹 Clear cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    await Cart.deleteMany({ user: userId });

    res.json({ message: "Cart cleared" });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({ message: error.message });
  }
};