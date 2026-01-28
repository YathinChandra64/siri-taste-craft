import mongoose from "mongoose";
import Order from "../models/Order.js";
import Saree from "../models/Saree.js";

// ✅ FIXED: Comprehensive Order Controller with MongoDB ObjectId validation

// 🛒 Place Order - WITH PROPER ID VALIDATION AND CONVERSION
export const placeOrder = async (req, res) => {
  try {
    const { items, totalAmount } = req.body;

    // ✅ Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "No items in order. Items must be an array."
      });
    }

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid total amount"
      });
    }

    // ✅ Get user ID from request
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    // ✅ Validate user ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: `Invalid user ID format: "${userId}"`
      });
    }

    // ✅ Process each item and validate product IDs
    let calculatedTotal = 0;
    const processedItems = [];

    for (const item of items) {
      // Validate item has required fields
      if (!item.product && !item.saree) {
        return res.status(400).json({ 
          success: false,
          message: "Each item must have product (saree) ID"
        });
      }

      if (!item.quantity || item.quantity < 1) {
        return res.status(400).json({ 
          success: false,
          message: "Each item must have valid quantity (minimum 1)"
        });
      }

      // ✅ CRITICAL FIX: Extract product ID (handle both 'product' and 'saree' field names)
      const rawProductId = item.product || item.saree;

      console.log(`📝 Processing item with ID: "${rawProductId}" (type: ${typeof rawProductId})`);

      // ✅ Validate and convert product ID to MongoDB ObjectId
      let productId;
      
      if (!mongoose.Types.ObjectId.isValid(rawProductId)) {
        // Try to see if it's a numeric ID that exists in database
        const numericId = parseInt(rawProductId);
        if (!isNaN(numericId)) {
          console.warn(`⚠️  Numeric product ID detected: ${numericId}. Searching database...`);
          
          // Search for product with this numeric ID (from legacy data)
          let product = await Saree.findOne({ 
            $or: [
              { _id: numericId },
              { legacyId: numericId },
              { oldId: numericId }
            ]
          });

          if (!product) {
            return res.status(400).json({
              success: false,
              message: `Invalid product ID format: "${rawProductId}". Product not found. Please ensure you're using valid product IDs.`
            });
          }

          productId = product._id; // Use the MongoDB ObjectId
          console.log(`✅ Found product with legacy ID ${numericId}, using MongoDB ID: ${productId}`);
        } else {
          return res.status(400).json({
            success: false,
            message: `Invalid product ID format: "${rawProductId}". Must be a valid MongoDB ID (24-character hex string).`
          });
        }
      } else {
        // It's a valid MongoDB ObjectId string
        productId = new mongoose.Types.ObjectId(rawProductId);
      }

      // Fetch product from database
      const product = await Saree.findById(productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found with ID: ${rawProductId}`
        });
      }

      if (!product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product "${product.name}" is no longer available`
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

      console.log(`✅ Stock updated for "${product.name}": ${product.stock} remaining`);

      // Build processed item with correct data
      processedItems.push({
        product: productId, // Use the validated MongoDB ObjectId
        name: item.name || product.name,
        quantity: item.quantity,
        price: item.price || product.price
      });

      // Calculate total
      calculatedTotal += (item.price || product.price) * item.quantity;
    }

    // ✅ Create order with validated data
    const order = await Order.create({
      user: new mongoose.Types.ObjectId(userId),
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
      orderId: order._id,
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

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate order entry. Please try again."
      });
    }

    // Handle other errors
    return res.status(500).json({ 
      success: false,
      message: error.message || "Error creating order",
      error: process.env.NODE_ENV === "development" ? error.toString() : undefined
    });
  }
};

// 👤 Get User's Orders
export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    // ✅ Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    const orders = await Order.find({ user: new mongoose.Types.ObjectId(userId) })
      .populate("items.product", "name price imageUrl category")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: orders.length,
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
      .populate("user", "email name phone")
      .populate("items.product", "name price imageUrl category")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: orders.length,
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

// 📝 Get Single Order (by Order ID)
export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format"
      });
    }

    const order = await Order.findById(orderId)
      .populate("user", "email name phone address")
      .populate("items.product", "name price imageUrl category");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    return res.json({
      success: true,
      order: order
    });
  } catch (error) {
    console.error("❌ Get order error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching order"
    });
  }
};

// ✏️ Update Order Status (Admin only)
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, adminNotes } = req.body;

    // Validate order ID
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    // Validate status
    const validStatuses = [
      "pending_payment",
      "payment_submitted",
      "confirmed",
      "payment_rejected",
      "shipped",
      "delivered",
      "cancelled"
    ];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (adminNotes) updateData.adminNotes = adminNotes;

    const order = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true, runValidators: true }
    ).populate("items.product");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    return res.json({
      success: true,
      message: "Order updated successfully",
      order: order
    });
  } catch (error) {
    console.error("❌ Update order error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error updating order"
    });
  }
};

// 🗑️ Cancel Order
export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.id || req.user?._id;

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

    // ✅ Check if user is the order owner or admin
    const isOwner = order.user.toString() === userId;
    const isAdmin = req.user?.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this order"
      });
    }

    // Can only cancel orders that are pending
    if (order.status !== "pending_payment" && order.status !== "payment_submitted") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: ${order.status}`
      });
    }

    // Restore stock for each item
    for (const item of order.items) {
      const product = await Saree.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    // Update order status
    order.status = "cancelled";
    await order.save();

    return res.json({
      success: true,
      message: "Order cancelled successfully. Stock has been restored.",
      order: order
    });
  } catch (error) {
    console.error("❌ Cancel order error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error cancelling order"
    });
  }
};