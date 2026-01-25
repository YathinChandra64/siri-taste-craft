import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  getUserProfile,
  updateUserProfile,
  getCartSummary,
  getOrderHistory,
  getOrderDetails,
  getAdminProfile,
  getAllOrders,
  updateOrderStatus,
  getDashboardStats
} from "../controllers/profileController.js";

const router = express.Router();

// User routes (protected)
router.use(protect);
router.get("/", getUserProfile);
router.put("/", updateUserProfile);
router.get("/cart/summary", getCartSummary);
router.get("/orders", getOrderHistory);
router.get("/orders/:orderId", getOrderDetails);

// Admin routes (protected + admin only)
router.use(adminOnly);
router.get("/admin/profile", getAdminProfile);
router.get("/admin/orders", getAllOrders);
router.put("/admin/orders/:orderId/status", updateOrderStatus);
router.get("/admin/stats", getDashboardStats);

export default router;