import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  getUPIConfig,
  updateUPIConfig,
  getUPIConfigAdmin
} from "../controllers/Upicontroller.js";

const router = express.Router();

// Customer routes (no auth needed to get config)
router.get("/config", getUPIConfig);

// Admin routes
router.get("/admin/config", protect, adminOnly, getUPIConfigAdmin);
router.put("/admin/config", protect, adminOnly, updateUPIConfig);

export default router;