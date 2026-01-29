import mongoose from "mongoose";
import Order from "../models/Order.js";
import Saree from "../models/Saree.js";

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

      // ✅ Use Saree model instead of Product
      const saree = await Saree.findById(productId);

      if (!saree) {
        return res.status(404).json({
          success: false,
          message: `Saree not found with ID: ${item.product}`
        });
      }

      // Check stock availability
      if (saree.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${saree.name}". Available: ${saree.stock}, Requested: ${item.quantity}`
        });
      }

      // ✅ Deduct stock from saree
      saree.stock = (saree.stock || 0) - item.quantity;
      await saree.save();

      // Build processed item with correct data
      processedItems.push({
        product: productId,
        name: item.name || saree.name,
        quantity: item.quantity,
        price: item.price || saree.price
      });

      // Calculate total
      calculatedTotal += (item.price || saree.price) * item.quantity;
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
      orders: orders || []
    });
  } catch (error) {
    console.error("❌ Get orders error:", error);
    return res.status(500).json({ 
      success: false,
      message: error.message || "Error fetching orders",
      orders: []
    });
  }
};

// 🛠 Admin: Get All Orders
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("items.product", "name price image")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      orders: orders || [],
      total: orders.length
    });
  } catch (error) {
    console.error("❌ Get all orders error:", error);
    return res.status(500).json({ 
      success: false,
      message: error.message || "Error fetching orders",
      orders: []
    });
  }
};

// ✅ Verify Payment
export const verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, paymentReference } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.status = status === "confirmed" ? "confirmed" : "payment_rejected";
    if (paymentReference) order.paymentReference = paymentReference;
    
    await order.save();

    return res.json({
      success: true,
      message: `Payment ${status}`,
      order
    });
  } catch (error) {
    console.error("❌ Payment verification error:", error);
    return res.status(500).json({ 
      success: false,
      message: error.message || "Error verifying payment"
    });
  }
};

// 📝 Get Order Details
export const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    const order = await Order.findById(orderId)
      .populate("user", "name email phone")
      .populate("items.product", "name price image");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error("❌ Get order details error:", error);
    return res.status(500).json({ 
      success: false,
      message: error.message || "Error fetching order details"
    });
  }
};

// 📋 Get Order By ID (alias for getOrderDetails)
export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid order ID" 
      });
    }

    const order = await Order.findById(orderId)
      .populate("user", "name email phone")
      .populate("items.product", "name price image");

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    // ✅ Verify ownership: user can only see their own orders
    if (order.user._id.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized to view this order" 
      });
    }

    return res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error("❌ Get order by ID error:", error);
    return res.status(500).json({ 
      success: false,
      message: error.message || "Error fetching order"
    });
  }
};

// ✏️ Update Order Status (Admin Only)
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    // ✅ Validate status
    const validStatuses = ["pending_payment", "confirmed", "processing", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
      });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid order ID" 
      });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status, updatedAt: new Date() },
      { new: true }
    ).populate("user", "name email").populate("items.product", "name price");

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    console.log(`✅ Order ${orderId} status updated to: ${status}`);

    return res.json({
      success: true,
      message: `Order status updated to ${status}`,
      order
    });
  } catch (error) {
    console.error("❌ Update order status error:", error);
    return res.status(500).json({ 
      success: false,
      message: error.message || "Error updating order status"
    });
  }
};

// ❌ Cancel Order
export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid order ID" 
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    // ✅ Verify ownership: user can only cancel their own orders
    if (order.user.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized to cancel this order" 
      });
    }

    // ✅ Check if order can be cancelled (only pending or confirmed orders)
    const cancellableStatuses = ["pending_payment", "confirmed"];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: ${order.status}. Only pending or confirmed orders can be cancelled.`
      });
    }

    // ✅ Restore stock for cancelled items
    for (const item of order.items) {
      const saree = await Saree.findById(item.product);
      if (saree) {
        saree.stock = (saree.stock || 0) + item.quantity;
        await saree.save();
      }
    }

    // ✅ Update order status to cancelled
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        status: "cancelled",
        cancelledAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    ).populate("user", "name email").populate("items.product", "name price");

    console.log(`✅ Order ${orderId} cancelled successfully`);

    return res.json({
      success: true,
      message: "Order cancelled successfully and stock restored",
      order: updatedOrder
    });
  } catch (error) {
    console.error("❌ Cancel order error:", error);
    return res.status(500).json({ 
      success: false,
      message: error.message || "Error cancelling order"
    });
  }
};