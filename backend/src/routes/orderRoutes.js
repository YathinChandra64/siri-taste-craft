import express from "express";
import {
  placeOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder
} from "../controllers/orderController.js";

import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ FIXED: Complete Order Routes with all functionality

// 🛒 CUSTOMER ROUTES
router.post("/", protect, placeOrder);              // Create new order
router.get("/my-orders", protect, getMyOrders);     // Get user's orders
router.get("/:orderId", protect, getOrderById);     // Get single order details
router.delete("/:orderId/cancel", protect, cancelOrder); // Cancel order

// 👨‍💼 ADMIN ROUTES
router.get("/", protect, adminOnly, getAllOrders);  // Get all orders
router.put("/:orderId/status", protect, adminOnly, updateOrderStatus); // Update order status

export default router;