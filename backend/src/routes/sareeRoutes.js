import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  getAllSarees,
  getSareeById,
  createSaree,
  updateSaree,
  deleteSaree,
  bulkUploadSarees,
  getSareeStats
} from "../controllers/sareeController.js";

const router = express.Router();

// Public routes
router.get("/", getAllSarees);
router.get("/:id", getSareeById);

// Admin only routes
router.post("/", protect, adminOnly, createSaree);
router.put("/:id", protect, adminOnly, updateSaree);
router.delete("/:id", protect, adminOnly, deleteSaree);
router.post("/bulk/upload", protect, adminOnly, bulkUploadSarees);
router.get("/admin/stats", protect, adminOnly, getSareeStats);

export default router;