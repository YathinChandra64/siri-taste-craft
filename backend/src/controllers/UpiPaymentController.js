/**
 * UPI Payment Controller
 * Handles UPI payment submission, verification, and status tracking
 */

import OcrService from "../services/OcrService.js";
import UpiService from "../services/UpiService.js";
import NotificationService from "../services/NotificationService.js";
import UpiPayment from "../models/UpiPayment.js";
import Order from "../models/Order.js";
import { sanitizeUtr } from "../utils/utrValidator.js";
import fs from "fs/promises";

class UpiPaymentController {
  /**
   * Get UPI Configuration
   * GET /api/upi-payments/config
   */
  async getUpiConfig(req, res) {
    try {
      const config = await UpiService.getUpiConfig();

      if (!config) {
        return res.status(503).json({
          success: false,
          message: "UPI payment system is not configured"
        });
      }

      return res.status(200).json({
        success: true,
        data: config
      });
    } catch (error) {
      console.error("Error getting UPI config:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch UPI configuration"
      });
    }
  }

  /**
   * Upload Payment Screenshot and Extract UTR
   * POST /api/upi-payments/upload
   */
  async uploadPaymentScreenshot(req, res) {
    let uploadedFilePath = null;

    try {
      const { orderId } = req.body;
      const userId = req.user._id;

      // Validate input
      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: "Order ID is required"
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No screenshot provided"
        });
      }

      // Verify order exists and belongs to user
      const order = await Order.findOne({ _id: orderId, user: userId });
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }

      // Save file path for cleanup if needed
      uploadedFilePath = req.file.path;

      // Process screenshot with OCR
      console.log("\n🎬 Processing UPI Payment Screenshot...");
      const ocrResult = await OcrService.processPaymentScreenshot(
        uploadedFilePath,
        req.file
      );

      if (!ocrResult.success) {
        await OcrService.deleteFile(uploadedFilePath);
        
        return res.status(400).json({
          success: false,
          stage: ocrResult.stage,
          message: ocrResult.error || "Failed to process screenshot",
          debugInfo: ocrResult.debugInfo
        });
      }

      // Extract UTR data
      const extractedUtr = ocrResult.utrData?.utr || null;
      const ocrConfidence = ocrResult.utrData?.confidence || 0;

      // Generate screenshot URL (you can store on cloud storage)
      const screenshotUrl = `/uploads/upi-payments/${req.file.filename}`;

      // Create payment record
      const paymentData = {
        orderId,
        userId,
        amount: order.totalAmount,
        upiId: (await UpiService.getUpiConfig()).upiId,
        screenshotUrl,
        screenshotFileName: req.file.filename,
        extractedUtr,
        ocrConfidence
      };

      const payment = await UpiService.createPayment(paymentData);

      // Update order status
      if (extractedUtr) {
        order.status = "payment_submitted";
        order.paymentReference = extractedUtr;
        order.paymentSubmittedAt = new Date();
      } else {
        order.status = "payment_submitted";
      }
      await order.save();

      // Notify admin
      await NotificationService.notifyAdminPaymentSubmitted({
        paymentId: payment._id,
        orderId,
        customerName: req.user.name,
        customerEmail: req.user.email,
        amount: order.totalAmount,
        extractedUtr,
        screenshotUrl,
        ocrConfidence
      });

      // Notify customer
      await NotificationService.notifyCustomerPaymentSubmitted({
        paymentId: payment._id,
        orderId,
        customerEmail: req.user.email,
        amount: order.totalAmount,
        extractedUtr,
        utrDetected: !!extractedUtr
      });

      console.log(`✅ Payment submission successful: ${payment._id}`);

      return res.status(201).json({
        success: true,
        message: "Payment screenshot processed successfully",
        data: {
          paymentId: payment._id,
          orderId,
          status: payment.status,
          utrDetected: !!extractedUtr,
          utr: extractedUtr ? sanitizeUtr(extractedUtr) : null,
          ocrConfidence: Math.round(ocrConfidence),
          ocrData: {
            text: ocrResult.ocrData.text,
            confidence: Math.round(ocrResult.ocrData.confidence),
            lineCount: ocrResult.ocrData.lineCount
          }
        }
      });
    } catch (error) {
      console.error("Error uploading payment screenshot:", error);

      // Clean up file on error
      if (uploadedFilePath) {
        await OcrService.deleteFile(uploadedFilePath);
      }

      return res.status(500).json({
        success: false,
        message: error.message || "Failed to process payment screenshot"
      });
    }
  }

  /**
   * Get Payment Status
   * GET /api/upi-payments/status/:orderId
   */
  async getPaymentStatus(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user._id;

      // Verify order belongs to user
      const order = await Order.findOne({ _id: orderId, user: userId });
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }

      const status = await UpiService.getPaymentStatus(orderId);

      return res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error("Error getting payment status:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch payment status"
      });
    }
  }

  /**
   * Verify Payment (Admin Only)
   * POST /api/upi-payments/verify
   */
  async verifyPayment(req, res) {
    try {
      // Verify admin access
      if (req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admins can verify payments"
        });
      }

      const { paymentId, action, notes } = req.body;

      // Validate input
      if (!paymentId || !action) {
        return res.status(400).json({
          success: false,
          message: "Payment ID and action are required"
        });
      }

      if (!["approve", "reject"].includes(action)) {
        return res.status(400).json({
          success: false,
          message: "Action must be 'approve' or 'reject'"
        });
      }

      // Verify payment
      const result = await UpiService.verifyPayment(
        paymentId,
        action,
        req.user._id,
        notes || ""
      );

      // Get payment and order details for notification
      const payment = await UpiService.getPaymentByOrderId(result.order.orderId);
      const order = await Order.findById(result.order.orderId).populate("user", "name email");

      // Notify customer
      if (action === "approve") {
        await NotificationService.notifyCustomerPaymentApproved({
          orderId: result.order.orderId,
          customerEmail: order.user.email,
          customerName: order.user.name,
          amount: order.totalAmount,
          extractedUtr: payment.extractedUtr || payment.manualUtr
        });
      } else {
        await NotificationService.notifyCustomerPaymentRejected({
          orderId: result.order.orderId,
          customerEmail: order.user.email,
          customerName: order.user.name,
          reason: notes || "Payment verification failed",
          retryAvailable: payment.attemptCount < 3
        });
      }

      return res.status(200).json({
        success: true,
        message: `Payment ${action}ed successfully`,
        data: result
      });
    } catch (error) {
      console.error("Error verifying payment:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to verify payment"
      });
    }
  }

  /**
   * Resubmit Payment
   * POST /api/upi-payments/resubmit
   */
  async resubmitPayment(req, res) {
    let uploadedFilePath = null;

    try {
      const { orderId } = req.body;
      const userId = req.user._id;

      // Validate input
      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: "Order ID is required"
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No screenshot provided"
        });
      }

      // Verify order exists and belongs to user
      const order = await Order.findOne({ _id: orderId, user: userId });
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }

      uploadedFilePath = req.file.path;

      // Process screenshot
      const ocrResult = await OcrService.processPaymentScreenshot(
        uploadedFilePath,
        req.file
      );

      if (!ocrResult.success) {
        await OcrService.deleteFile(uploadedFilePath);
        
        return res.status(400).json({
          success: false,
          message: ocrResult.error || "Failed to process screenshot"
        });
      }

      // Prepare new payment data
      const extractedUtr = ocrResult.utrData?.utr || null;
      const screenshotUrl = `/uploads/upi-payments/${req.file.filename}`;

      const newPaymentData = {
        screenshotUrl,
        screenshotFileName: req.file.filename,
        extractedUtr,
        ocrConfidence: ocrResult.utrData?.confidence || 0
      };

      // Resubmit payment
      const updatedPayment = await UpiService.resubmitPayment(orderId, newPaymentData);

      console.log(`✅ Payment resubmitted: ${orderId}`);

      return res.status(200).json({
        success: true,
        message: "Payment resubmitted successfully",
        data: {
          paymentId: updatedPayment._id,
          status: updatedPayment.status,
          utrDetected: !!extractedUtr,
          utr: extractedUtr ? sanitizeUtr(extractedUtr) : null,
          attempts: updatedPayment.attemptCount
        }
      });
    } catch (error) {
      console.error("Error resubmitting payment:", error);

      if (uploadedFilePath) {
        await OcrService.deleteFile(uploadedFilePath);
      }

      return res.status(500).json({
        success: false,
        message: error.message || "Failed to resubmit payment"
      });
    }
  }

  /**
   * List Pending Payments (Admin Only)
   * GET /api/admin/payments/pending
   */
  async listPendingPayments(req, res) {
    try {
      // Verify admin access
      if (req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admins can access this endpoint"
        });
      }

      const { limit = 20, offset = 0, status = "pending_verification" } = req.query;

      const result = await UpiService.getPendingPayments({
        status,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error("Error listing pending payments:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch pending payments"
      });
    }
  }

  /**
   * Get Payment Statistics (Admin Only)
   * GET /api/admin/payments/statistics
   */
  async getPaymentStatistics(req, res) {
    try {
      // Verify admin access
      if (req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admins can access this endpoint"
        });
      }

      const stats = await UpiService.getPaymentStatistics();

      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error("Error getting payment statistics:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch payment statistics"
      });
    }
  }

  /**
   * Get Receipt Example/Reference
   * GET /api/upi-payments/receipt-reference
   */
  async getReceiptReference(req, res) {
    try {
      const reference = await OcrService.generateReceiptReference();

      return res.status(200).json({
        success: true,
        data: reference
      });
    } catch (error) {
      console.error("Error getting receipt reference:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch receipt reference"
      });
    }
  }
}

export default new UpiPaymentController();