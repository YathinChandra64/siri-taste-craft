import express from "express";
import {
  placeOrder,
  getMyOrders,
  getOrderDetails,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  verifyPayment
} from "../controllers/orderController.js";

import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ CRITICAL: SPECIFIC ROUTES MUST COME BEFORE GENERIC /:id ROUTES

// 🛒 CUSTOMER ROUTES (Protected)
router.post("/", protect, placeOrder);              // Create new order
router.get("/my-orders", protect, getMyOrders);     // Get user's orders
router.get("/details/:id", protect, getOrderDetails); // Get order details (BEFORE /:id!)

// 👨‍💼 ADMIN ROUTES (Protected + Admin)
router.get("/admin/all", protect, adminOnly, getAllOrders);  // Get all orders

// ✅ GENERIC SINGLE ORDER ROUTES (must come LAST)
router.get("/:id", protect, getOrderById);          // Get single order
router.put("/:id/status", protect, adminOnly, updateOrderStatus); // Update status
router.put("/:id/verify-payment", protect, adminOnly, verifyPayment); // Verify payment
router.delete("/:id/cancel", protect, cancelOrder); // Cancel order
router.get("/", authMiddleware, adminOnly, getAllOrders);
router.get("/my", authMiddleware, getMyOrders);
export default router;