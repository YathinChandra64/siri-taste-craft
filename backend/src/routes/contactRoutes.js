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

// ✅ Public routes
router.post("/", submitContact); // Customer sends message

// ✅ Customer routes (logged-in customers)
router.get("/customer/messages", protect, getCustomerMessages); // Customer views their messages
router.get("/customer/notifications", protect, getCustomerNotifications); // Customer views replies

// ✅ Admin routes
router.get("/", protect, adminOnly, getAllContacts); // Admin views all messages
router.get("/admin/notifications", protect, adminOnly, getAdminNotifications); // Admin views new message notifications
router.get("/:id", protect, adminOnly, getContactById); // Admin views specific message
router.put("/:id/reply", protect, adminOnly, replyToContact); // Admin replies to message
router.delete("/:id", protect, adminOnly, deleteContact); // Admin deletes message

// ✅ Notification routes
router.put("/notification/:id/read", protect, markNotificationAsRead); // Mark notification as read
router.get("/notification/unread-count", protect, getUnreadCount); // Get unread count

export default router;