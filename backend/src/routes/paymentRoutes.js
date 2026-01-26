import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  uploadUpiQrCode,
  getUpiQrCode,
  createOrder,
  submitPaymentProof,
  verifyPayment,
  getPendingPaymentOrders,
  getOrderStatus,
  getNotifications,
  markNotificationAsRead,
  clearNotifications
} from "../controllers/paymentController.js";

const router = express.Router();

// 🔓 PUBLIC ROUTES
// Get UPI QR code (customers can see payment details)
router.get("/upi-qr", getUpiQrCode);

// 🔐 CUSTOMER ROUTES (Protected)
// Create order (awaiting payment)
router.post("/create-order", protect, createOrder);

// Submit payment proof (customer uploads screenshot)
router.post("/submit-proof", protect, submitPaymentProof);

// Get order status
router.get("/order-status/:orderId", protect, getOrderStatus);

// ✅ Get notifications (Customer & Admin)
router.get("/notifications", protect, getNotifications);

// ✅ Mark notification as read
router.put("/notifications/:notificationId/read", protect, markNotificationAsRead);

// ✅ Clear all notifications
router.delete("/notifications/clear", protect, clearNotifications);

// 👨‍💼 ADMIN ROUTES (Protected + Admin only)
// Upload UPI QR code
router.post("/upload-qr", protect, adminOnly, uploadUpiQrCode);

// Get pending payment orders
router.get("/pending-orders", protect, adminOnly, getPendingPaymentOrders);

// Verify payment
router.post("/verify-payment", protect, adminOnly, verifyPayment);

export default router;