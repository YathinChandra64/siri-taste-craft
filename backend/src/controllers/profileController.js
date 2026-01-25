import User from "../models/User.js";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";

// 👤 Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✏️ Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const { name, phone, address, city, state, zipCode, profileImage } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        name,
        phone,
        address,
        city,
        state,
        zipCode,
        profileImage
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🛒 Get cart summary
export const getCartSummary = async (req, res) => {
  try {
    const cartItems = await Cart.find({ user: req.user.id })
      .populate("saree");

    const total = cartItems.reduce((sum, item) => {
      return sum + (item.saree.price * item.quantity);
    }, 0);

    res.json({
      items: cartItems,
      total,
      itemCount: cartItems.length
    });
  } catch (error) {
    console.error("Get cart summary error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 📦 Get order history
export const getOrderHistory = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate("items.product", "name price")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Get order history error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 📋 Get order details
export const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      user: req.user.id
    }).populate("items.product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Get order details error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ========== ADMIN ENDPOINTS ==========

// 👤 Get admin profile
export const getAdminProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get admin profile error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 👥 Get all orders (Admin)
export const getAllOrders = async (req, res) => {
  try {
    const { status, userId } = req.query;
    let filter = {};

    if (status) {
      filter.status = status;
    }
    if (userId) {
      filter.user = userId;
    }

    const orders = await Order.find(filter)
      .populate("user", "name email phone")
      .populate("items.product", "name price")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🔄 Update order status (Admin)
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!["pending", "confirmed", "shipped", "delivered"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    ).populate("user").populate("items.product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      message: "Order status updated",
      order
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 📊 Get dashboard statistics (Admin)
export const getDashboardStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    const ordersByStatus = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const recentOrders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      ordersByStatus,
      recentOrders
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ message: error.message });
  }
};