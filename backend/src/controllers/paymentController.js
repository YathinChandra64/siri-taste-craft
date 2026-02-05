import Order from "../models/Order.js";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import Notification from "../models/Notification.js";
import mongoose from "mongoose";
import crypto from "crypto";
import razorpayInstance from "../config/razorpay.js";

// ========================================
// EXISTING UPI FUNCTIONS (KEEP ALL)
// ========================================

export const uploadUpiQrCode = async (req, res) => {
  try {
    const { qrCodeUrl, upiId } = req.body;

    if (!qrCodeUrl && !upiId) {
      return res.status(400).json({ 
        success: false,
        message: "Either QR code URL or UPI ID is required" 
      });
    }

    if (upiId) {
      const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/;
      if (!upiRegex.test(upiId)) {
        console.warn(`⚠️  UPI ID format warning: ${upiId} may not be valid`);
      }
    }

    const admin = await Admin.findOneAndUpdate(
      { role: "admin" },
      { 
        upiQrCode: qrCodeUrl,
        upiId: upiId,
        upiUpdatedAt: new Date(),
        enablePayments: true
      },
      { new: true, upsert: true }
    );

    console.log("✅ UPI settings updated successfully");

    res.json({
      success: true,
      message: "UPI QR code and UPI ID updated successfully",
      admin: {
        _id: admin._id,
        role: admin.role,
        upiQrCode: admin.upiQrCode,
        upiId: admin.upiId,
        upiUpdatedAt: admin.upiUpdatedAt
      }
    });
  } catch (error) {
    console.error("❌ Upload QR error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const getUpiQrCode = async (req, res) => {
  try {
    const admin = await Admin.findOne({ role: "admin" });

    if (!admin) {
      return res.status(404).json({ 
        success: false,
        message: "Admin settings not found. Please contact site administrator." 
      });
    }

    if (!admin.upiQrCode && !admin.upiId) {
      return res.status(404).json({ 
        success: false,
        message: "Payment details not configured by administrator yet" 
      });
    }

    if (!admin.enablePayments) {
      return res.status(503).json({
        success: false,
        message: "Payments are currently disabled. Please try again later."
      });
    }

    res.json({
      success: true,
      upiQrCode: admin.upiQrCode || null,
      upiId: admin.upiId || null,
      businessName: admin.businessName || "Siri Taste Craft"
    });
  } catch (error) {
    console.error("❌ Get QR error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { items, totalAmount } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required"
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
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

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    const order = await Order.create({
      user: new mongoose.Types.ObjectId(userId),
      items,
      totalAmount,
      status: "pending_payment",
      paymentMethod: "upi",
      paymentReference: null,
      paymentProof: null,
      paymentVerifiedAt: null
    });

    console.log(`✅ Payment order created: ${order._id}`);

    res.status(201).json({
      success: true,
      message: "Order created. Please complete payment.",
      _id: order._id,
      orderId: order._id,
      order
    });
  } catch (error) {
    console.error("❌ Create order error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const submitPaymentProof = async (req, res) => {
  try {
    const { orderId, paymentReference, paymentProofUrl } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!orderId || !paymentReference) {
      return res.status(400).json({ 
        success: false,
        message: "Order ID and payment reference are required" 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format"
      });
    }

    const order = await Order.findById(orderId).populate("user");

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: "Order not found" 
      });
    }

    if (order.user._id.toString() !== userId.toString()) {
      return res.status(403).json({ 
        success: false,
        message: "Unauthorized" 
      });
    }

    if (order.status !== "pending_payment") {
      return res.status(400).json({ 
        success: false,
        message: "Order is not awaiting payment" 
      });
    }

    order.paymentReference = paymentReference;
    order.paymentProof = paymentProofUrl;
    order.status = "payment_submitted";
    order.paymentSubmittedAt = new Date();
    await order.save();

    await Notification.create({
      type: "payment_received",
      targetUser: null,
      title: "Payment Received! 💰",
      message: `Customer ${order.user.name} submitted payment proof for Order #${orderId.slice(-6).toUpperCase()}. Amount: ₹${order.totalAmount}. Please verify.`,
      orderId: orderId,
      relatedUserId: order.user._id,
      isRead: false
    });

    console.log(`✅ Payment proof submitted for order: ${orderId}`);

    res.json({
      success: true,
      message: "Payment proof submitted. Admin will verify shortly.",
      _id: order._id,
      orderId: order._id,
      order
    });
  } catch (error) {
    console.error("❌ Submit payment proof error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { orderId, isVerified } = req.body;

    if (!orderId) {
      return res.status(400).json({ 
        success: false,
        message: "Order ID is required" 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format"
      });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        status: isVerified ? "confirmed" : "payment_rejected",
        paymentVerifiedAt: isVerified ? new Date() : null
      },
      { new: true }
    ).populate("user");

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: "Order not found" 
      });
    }

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

    console.log(`✅ Payment ${isVerified ? "verified" : "rejected"} for order: ${orderId}`);

    res.json({
      success: true,
      message: isVerified ? "Payment verified" : "Payment rejected",
      _id: order._id,
      orderId: order._id,
      order
    });
  } catch (error) {
    console.error("❌ Verify payment error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const getPendingPaymentOrders = async (req, res) => {
  try {
    const orders = await Order.find({ 
      status: { $in: ["pending_payment", "payment_submitted"] } 
    })
      .populate("user", "name email phone")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error("❌ Get pending orders error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const getOrderStatus = async (req, res) => {
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

    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({ 
        success: false,
        message: "Unauthorized" 
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error("❌ Get order status error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const isAdmin = req.user?.role === "admin";

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    let notifications;
    if (isAdmin) {
      notifications = await Notification.find({ targetUser: null })
        .sort({ createdAt: -1 })
        .limit(50);
    } else {
      notifications = await Notification.find({ targetUser: new mongoose.Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .limit(50);
    }

    res.json({
      success: true,
      count: notifications.length,
      notifications
    });
  } catch (error) {
    console.error("❌ Get notifications error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID"
      });
    }

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ 
        success: false,
        message: "Notification not found" 
      });
    }

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error("❌ Mark as read error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const clearNotifications = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const isAdmin = req.user?.role === "admin";

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    let result;
    if (isAdmin) {
      result = await Notification.deleteMany({ targetUser: null });
    } else {
      result = await Notification.deleteMany({ targetUser: new mongoose.Types.ObjectId(userId) });
    }

    res.json({
      success: true,
      message: `${result.deletedCount} notifications cleared`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("❌ Clear notifications error:", error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ========================================
// NEW RAZORPAY FUNCTIONS (ADD THESE)
// ========================================

export const createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;

    const order = await Order.findOne({ _id: orderId, user: userId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (order.paymentMethod !== "RAZORPAY") {
      return res.status(400).json({
        success: false,
        message: "This order does not use Razorpay payment method"
      });
    }

    if (order.orderStatus === "PAID" || order.orderStatus === "CONFIRMED") {
      return res.status(400).json({
        success: false,
        message: "Order is already paid"
      });
    }

    const razorpayOrderOptions = {
      amount: Math.round(order.totalAmount * 100),
      currency: "INR",
      receipt: `order_${order._id}`,
      notes: {
        orderId: order._id.toString(),
        userId: userId.toString()
      }
    };

    const razorpayOrder = await razorpayInstance.orders.create(razorpayOrderOptions);

    order.razorpayOrderId = razorpayOrder.id;
    order.orderStatus = "PAYMENT_PENDING";
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Razorpay order created successfully",
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      orderId: order._id
    });

  } catch (error) {
    console.error("❌ Error creating Razorpay order:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Error creating Razorpay order"
    });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;
    const userId = req.user.id;

    const order = await Order.findOne({ _id: orderId, user: userId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed"
      });
    }

    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    order.orderStatus = "PAID";
    order.paymentStatus = "VERIFIED";
    order.paymentVerifiedAt = new Date();
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order: {
        _id: order._id,
        orderStatus: order.orderStatus,
        razorpayPaymentId: order.razorpayPaymentId
      }
    });

  } catch (error) {
    console.error("❌ Error verifying payment:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Error verifying payment"
    });
  }
};