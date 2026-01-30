/**
 * UPI Payment Routes
 * Handles all UPI payment related API endpoints
 */

import express from "express";
import multer from "multer";
import path from "path";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import UpiPaymentController from "../controllers/UpiPaymentController.js";

const router = express.Router();

// Configure multer for file uploads
const uploadDir = process.env.UPI_UPLOAD_DIR || "./uploads/upi-payments";

// Create storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `upi-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: JPEG, PNG, WebP`));
  }
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

/**
 * Public Routes (No Authentication Required)
 */

// Get UPI Configuration
router.get("/config", UpiPaymentController.getUpiConfig);

// Get Receipt Reference/Example
router.get("/receipt-reference", UpiPaymentController.getReceiptReference);

/**
 * Protected Routes (Authentication Required)
 */

// Upload Payment Screenshot
router.post(
  "/upload",
  protect,
  upload.single("screenshot"),
  (req, res, next) => {
    // Handle multer errors
    if (req.fileValidationError) {
      return res.status(400).json({
        success: false,
        message: req.fileValidationError
      });
    }
    next();
  },
  UpiPaymentController.uploadPaymentScreenshot
);

// Resubmit Payment (for failed attempts)
router.post(
  "/resubmit",
  protect,
  upload.single("screenshot"),
  UpiPaymentController.resubmitPayment
);

// Get Payment Status
router.get(
  "/status/:orderId",
  protect,
  UpiPaymentController.getPaymentStatus
);

/**
 * Admin Routes (Admin Only)
 */

// Verify Payment
router.post(
  "/verify",
  protect,
  adminOnly,
  UpiPaymentController.verifyPayment
);

// List Pending Payments
router.get(
  "/admin/pending",
  protect,
  adminOnly,
  UpiPaymentController.listPendingPayments
);

// Get Payment Statistics
router.get(
  "/admin/statistics",
  protect,
  adminOnly,
  UpiPaymentController.getPaymentStatistics
);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size exceeds 5MB limit"
      });
    }
  }

  if (error && error.message) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next();
});

export default router;