import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  reportIssue,
  getAllIssues,
  getUserIssues,
  updateIssueStatus,
  getIssueStats
} from "../controllers/Issuecontroller.js";

const router = express.Router();

// Customer routes
router.post("/report", protect, reportIssue);
router.get("/my-issues", protect, getUserIssues);

// Admin routes
router.get("/all", protect, adminOnly, getAllIssues);
router.put("/:issueId/status", protect, adminOnly, updateIssueStatus);
router.get("/stats", protect, adminOnly, getIssueStats);

export default router;