import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getOrCreateConversation,
  sendMessage,
  getAllConversations,
  getUserConversation,
  markAsRead,
  closeConversation,
  reopenConversation
} from "../controllers/chatController.js";

const router = express.Router();

// Customer routes
router.get("/user-conversation", protect, getUserConversation);
router.post("/send/:conversationId", protect, sendMessage);
router.put("/mark-read/:conversationId", protect, markAsRead);

// Admin routes
router.get("/all-conversations", protect, getAllConversations);
router.get("/conversation", protect, getOrCreateConversation);
router.put("/close/:conversationId", protect, closeConversation);
router.put("/reopen/:conversationId", protect, reopenConversation);

export default router;