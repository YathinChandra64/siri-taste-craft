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

// ✅ CRITICAL: SPECIFIC ROUTES MUST COME BEFORE GENERIC /:id ROUTES

// ✅ Public routes - GET all sarees
router.get("/", getAllSarees);

// ✅ ADMIN STATS ROUTE - MUST COME BEFORE /:id route
router.get("/admin/stats", protect, adminOnly, getSareeStats);

// ✅ CREATE - before GET by ID
router.post("/", protect, adminOnly, createSaree);

// ✅ BULK UPLOAD - FIXED path (both variations supported)
router.post("/bulk", protect, adminOnly, bulkUploadSarees);
router.post("/bulk/upload", protect, adminOnly, bulkUploadSarees);

// ✅ GENERIC ROUTES - MUST COME LAST
router.get("/:id", getSareeById);
router.put("/:id", protect, adminOnly, updateSaree);           // ✅ UPDATE
router.delete("/:id", protect, adminOnly, deleteSaree);        // ✅ DELETE

export default router;