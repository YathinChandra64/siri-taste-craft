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

// ✅ PUBLIC: Customer sends message
router.post("/", submitContact);

// ✅ CUSTOMER ROUTES (auth required)
router.get("/customer/messages", protect, getCustomerMessages);
router.get("/customer/notifications", protect, getCustomerNotifications);

// ✅ ADMIN ROUTES (auth + admin role required)
router.get("/admin/notifications", protect, adminOnly, getAdminNotifications);
router.get("/", protect, adminOnly, getAllContacts);
router.get("/:id", protect, adminOnly, getContactById);
router.put("/:id/reply", protect, adminOnly, replyToContact);
router.delete("/:id", protect, adminOnly, deleteContact);

// ✅ NOTIFICATION ROUTES (auth required)
router.put("/notification/:id/read", protect, markNotificationAsRead);
router.get("/notification/unread-count", protect, getUnreadCount);

export default router;