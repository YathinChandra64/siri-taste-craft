import Order from "../models/Order.js";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import Notification from "../models/Notification.js"; // ✅ NEW

// 📸 Upload UPI QR Code (Admin only)
export const uploadUpiQrCode = async (req, res) => {
  try {
    const { qrCodeUrl, upiId } = req.body;

    if (!qrCodeUrl && !upiId) {
      return res.status(400).json({ 
        message: "Either QR code URL or UPI ID is required" 
      });
    }

    // Update admin settings with UPI QR code
    const admin = await Admin.findOneAndUpdate(
      { role: "admin" },
      { 
        upiQrCode: qrCodeUrl,
        upiId: upiId,
        upiUpdatedAt: new Date()
      },
      { new: true, upsert: true }
    );

    res.json({
      message: "UPI QR code updated successfully",
      admin
    });
  } catch (error) {
    console.error("Upload QR error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🔍 Get UPI QR Code (Public - for customers to see)
export const getUpiQrCode = async (req, res) => {
  try {
    const admin = await Admin.findOne({ role: "admin" });

    if (!admin || (!admin.upiQrCode && !admin.upiId)) {
      return res.status(404).json({ 
        message: "Payment details not configured" 
      });
    }

    res.json({
      upiQrCode: admin.upiQrCode,
      upiId: admin.upiId
    });
  } catch (error) {
    console.error("Get QR error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 📝 Create Order (Awaiting Payment)
export const createOrder = async (req, res) => {
  try {
    const { items, totalAmount } = req.body;
    const userId = req.user.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items in order" });
    }

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ message: "Invalid total amount" });
    }

    // Create order with "pending_payment" status
    const order = await Order.create({
      user: userId,
      items,
      totalAmount,
      status: "pending_payment",
      paymentMethod: "upi",
      paymentReference: null,
      paymentProof: null,
      paymentVerifiedAt: null
    });

    res.status(201).json({
      message: "Order created. Please complete payment.",
      order
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 📸 Submit Payment Proof (Customer uploads screenshot)
export const submitPaymentProof = async (req, res) => {
  try {
    const { orderId, paymentReference, paymentProofUrl } = req.body;
    const userId = req.user.id;

    if (!orderId || !paymentReference) {
      return res.status(400).json({ 
        message: "Order ID and payment reference are required" 
      });
    }

    // Find order
    const order = await Order.findById(orderId).populate("user");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Verify order belongs to user
    if (order.user._id.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Check order status
    if (order.status !== "pending_payment") {
      return res.status(400).json({ 
        message: "Order is not awaiting payment" 
      });
    }

    // Update order with payment proof
    order.paymentReference = paymentReference;
    order.paymentProof = paymentProofUrl;
    order.status = "payment_submitted";
    order.paymentSubmittedAt = new Date();
    await order.save();

    // ✅ Create in-app notification for admin
    await Notification.create({
      type: "payment_received",
      targetUser: null, // null = for admin
      title: "Payment Received! 💰",
      message: `Customer ${order.user.name} submitted payment proof for Order #${orderId.slice(-6).toUpperCase()}. Amount: ₹${order.totalAmount}. Please verify.`,
      orderId: orderId,
      relatedUserId: order.user._id,
      isRead: false
    });

    res.json({
      message: "Payment proof submitted. Admin will verify shortly.",
      order
    });
  } catch (error) {
    console.error("Submit payment proof error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Verify Payment (Admin only)
export const verifyPayment = async (req, res) => {
  try {
    const { orderId, isVerified } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    // Find order
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        status: isVerified ? "confirmed" : "payment_rejected",
        paymentVerifiedAt: isVerified ? new Date() : null
      },
      { new: true }
    ).populate("user");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // ✅ Create in-app notification for customer
    await Notification.create({
      type: isVerified ? "order_confirmed" : "payment_rejected",
      targetUser: order.user._id,
      title: isVerified ? "Order Confirmed! ✅" : "Payment Not Verified ❌",
      message: isVerified 
        ? `Your payment has been verified! Order #${orderId.slice(-6).toUpperCase()} is confirmed. We'll process it soon.`
        : `Your payment for order #${orderId.slice(-6).toUpperCase()} could not be verified. Please contact us.`,
      orderId: orderId,
      isRead: false
    });

    res.json({
      message: isVerified ? "Payment verified" : "Payment rejected",
      order
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 📋 Get Pending Payment Orders (Admin only)
export const getPendingPaymentOrders = async (req, res) => {
  try {
    const orders = await Order.find({ 
      status: { $in: ["pending_payment", "payment_submitted"] } 
    })
      .populate("user", "name email phone")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Get pending orders error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🔔 Get Order Status (Customer)
export const getOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Verify order belongs to user
    if (order.user.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json(order);
  } catch (error) {
    console.error("Get order status error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get Notifications (Customer & Admin)
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";

    let notifications;
    if (isAdmin) {
      // Admin sees all notifications (where targetUser is null = admin notifications)
      notifications = await Notification.find({ targetUser: null })
        .sort({ createdAt: -1 })
        .limit(50);
    } else {
      // Customer sees only their notifications
      notifications = await Notification.find({ targetUser: userId })
        .sort({ createdAt: -1 })
        .limit(50);
    }

    res.json(notifications);
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Mark Notification as Read
export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Clear All Notifications (Customer & Admin)
export const clearNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";

    let result;
    if (isAdmin) {
      result = await Notification.deleteMany({ targetUser: null });
    } else {
      result = await Notification.deleteMany({ targetUser: userId });
    }

    res.json({
      message: `${result.deletedCount} notifications cleared`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("Clear notifications error:", error);
    res.status(500).json({ message: error.message });
  }
};