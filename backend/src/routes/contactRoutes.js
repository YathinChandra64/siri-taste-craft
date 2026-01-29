import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  submitContact,
  getCustomerMessages,
  getCustomerNotifications,
  getAllContacts,
  getContactById,
  replyToContact,
  deleteContact,
  getAdminNotifications,
  markNotificationAsRead,
  getUnreadCount
} from "../controllers/contactController.js";

const router = express.Router();

// ✅ PUBLIC: Customer sends message (no auth needed)
router.post("/", submitContact);

// ✅ CUSTOMER ROUTES (auth required - must come BEFORE admin routes to avoid conflicts)
router.get("/customer/messages", protect, getCustomerMessages);
router.get("/customer/notifications", protect, getCustomerNotifications);

// ✅ NOTIFICATION ROUTES (auth required)
router.get("/notification/unread-count", protect, getUnreadCount); // ✅ Must come before /:id routes
router.put("/notification/:id/read", protect, markNotificationAsRead);

// ✅ ADMIN ROUTES (auth + admin role required - must come LAST)
router.get("/admin/notifications", protect, adminOnly, getAdminNotifications);
router.get("/", protect, adminOnly, getAllContacts);
router.get("/:id", protect, adminOnly, getContactById); // ✅ Generic :id route goes last
router.put("/:id/reply", protect, adminOnly, replyToContact);
router.delete("/:id", protect, adminOnly, deleteContact);

export default router;