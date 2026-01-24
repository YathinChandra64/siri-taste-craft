import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  submitContact,
  getAllContacts,
  getContactById,
  replyToContact,
  deleteContact
} from "../controllers/contactController.js";

const router = express.Router();

// Public route - submit contact form (NO authentication needed)
router.post("/", submitContact);

// Admin only routes (Protected)
router.get("/", protect, adminOnly, getAllContacts);
router.get("/:id", protect, adminOnly, getContactById);
router.put("/:id/reply", protect, adminOnly, replyToContact);
router.delete("/:id", protect, adminOnly, deleteContact);

export default router;