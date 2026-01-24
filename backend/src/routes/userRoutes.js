import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getUserStats
} from "../controllers/userController.js";

const router = express.Router();

// All user routes require authentication + admin privileges
router.use(protect, adminOnly);

// 📊 Get user statistics
router.get("/stats", getUserStats);

// 👥 Get all users
router.get("/", getAllUsers);

// 👤 Get user by ID
router.get("/:id", getUserById);

// 🔄 Update user role
router.put("/:id/role", updateUserRole);

// 🗑️ Delete user
router.delete("/:id", deleteUser);

export default router;