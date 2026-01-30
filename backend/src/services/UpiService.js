/**
 * UPI Service
 * Manages UPI configuration, validation, and business logic
 */

import UPIConfig from "../models/UpiConfig.js";
import UpiPayment from "../models/UpiPayment.js";
import Order from "../models/Order.js";
import { compareUtrs } from "../utils/utrValidator.js";

class UpiService {
  /**
   * Get active UPI configuration
   * @returns {Promise<Object>} - UPI config or null
   */
  async getUpiConfig() {
    try {
      const config = await UPIConfig.findOne({ isActive: true });
      
      if (!config) {
        console.warn("⚠️  No active UPI configuration found");
        return null;
      }

      return {
        upiId: config.upiId,
        merchantName: config.merchantName,
        qrCodeImage: config.qrCodeImage,
        instructions: config.instructions
      };
    } catch (error) {
      console.error("Error fetching UPI config:", error);
      throw new Error("Failed to fetch UPI configuration");
    }
  }

  /**
   * Update UPI configuration (Admin only)
   * @param {Object} updateData - { upiId, qrCodeImage, merchantName, instructions }
   * @param {string} adminId - Admin user ID
   * @returns {Promise<Object>} - Updated config
   */
  async updateUpiConfig(updateData, adminId) {
    try {
      let config = await UPIConfig.findOne({ isActive: true });

      if (!config) {
        config = new UPIConfig({
          isActive: true,
          upiId: updateData.upiId,
          merchantName: updateData.merchantName || "Siri Taste Craft",
          qrCodeImage: updateData.qrCodeImage,
          instructions: updateData.instructions,
          updatedBy: adminId
        });
      } else {
        if (updateData.upiId) config.upiId = updateData.upiId;
        if (updateData.qrCodeImage) config.qrCodeImage = updateData.qrCodeImage;
        if (updateData.merchantName) config.merchantName = updateData.merchantName;
        if (updateData.instructions) config.instructions = updateData.instructions;
        config.updatedBy = adminId;
      }

      await config.save();
      console.log("✅ UPI Configuration updated successfully");

      return {
        upiId: config.upiId,
        merchantName: config.merchantName,
        qrCodeImage: config.qrCodeImage,
        instructions: config.instructions
      };
    } catch (error) {
      console.error("Error updating UPI config:", error);
      throw new Error("Failed to update UPI configuration");
    }
  }

  /**
   * Check if UTR is already used
   * @param {string} utr - UTR to check
   * @param {string} excludeOrderId - Exclude this order from check (optional)
   * @returns {Promise<Object>} - { isDuplicate, existingPaymentId }
   */
  async checkDuplicateUtr(utr, excludeOrderId = null) {
    try {
      const query = {
        $or: [
          { extractedUtr: utr },
          { manualUtr: utr }
        ],
        status: { $in: ["verified", "pending_verification"] }
      };

      // Optionally exclude an order
      if (excludeOrderId) {
        query.order = { $ne: excludeOrderId };
      }

      const existing = await UpiPayment.findOne(query);

      if (existing) {
        console.log(`⚠️  Duplicate UTR found: ${utr}`);
        return {
          isDuplicate: true,
          existingPaymentId: existing._id,
          existingOrderId: existing.order
        };
      }

      return { isDuplicate: false };
    } catch (error) {
      console.error("Error checking duplicate UTR:", error);
      throw new Error("Failed to verify UTR uniqueness");
    }
  }

  /**
   * Create new UPI payment record
   * @param {Object} paymentData - Payment information
   * @returns {Promise<Object>} - Created payment record
   */
  async createPayment(paymentData) {
    try {
      const {
        orderId,
        userId,
        amount,
        upiId,
        screenshotUrl,
        screenshotFileName,
        extractedUtr,
        ocrConfidence
      } = paymentData;

      // Check duplicate UTR
      if (extractedUtr) {
        const duplicate = await this.checkDuplicateUtr(extractedUtr, orderId);
        if (duplicate.isDuplicate) {
          throw new Error(
            `This UTR has already been used for another payment. Please check your screenshot and try again.`
          );
        }
      }

      // Determine initial status
      let initialStatus = "submitted";
      if (extractedUtr) {
        initialStatus = "pending_verification";
      } else {
        initialStatus = "utr_detection_failed";
      }

      const payment = new UpiPayment({
        order: orderId,
        user: userId,
        amount,
        upiId,
        screenshotUrl,
        screenshotFileName,
        extractedUtr: extractedUtr || null,
        ocrConfidence: ocrConfidence || null,
        status: initialStatus,
        submittedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });

      await payment.save();
      console.log(`✅ Payment record created: ${payment._id}`);

      return payment;
    } catch (error) {
      console.error("Error creating payment:", error);
      throw error;
    }
  }

  /**
   * Get payment by order ID
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} - Payment record or null
   */
  async getPaymentByOrderId(orderId) {
    try {
      return await UpiPayment.findOne({ order: orderId }).populate("user", "name email");
    } catch (error) {
      console.error("Error fetching payment:", error);
      throw new Error("Failed to fetch payment information");
    }
  }

  /**
   * Get payment status
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} - Payment status details
   */
  async getPaymentStatus(orderId) {
    try {
      const payment = await this.getPaymentByOrderId(orderId);

      if (!payment) {
        return {
          hasPayment: false,
          message: "No payment found for this order"
        };
      }

      // Check if expired
      if (payment.isExpired()) {
        payment.status = "expired";
        await payment.save();
      }

      return {
        hasPayment: true,
        paymentId: payment._id,
        orderId: payment.order,
        status: payment.status,
        utr: payment.extractedUtr || payment.manualUtr || null,
        amount: payment.amount,
        submittedAt: payment.submittedAt,
        verifiedAt: payment.verificationDate,
        adminNotes: payment.verificationNotes,
        attempts: payment.attemptCount,
        expiresAt: payment.expiresAt,
        isExpired: payment.isExpired()
      };
    } catch (error) {
      console.error("Error getting payment status:", error);
      throw new Error("Failed to get payment status");
    }
  }

  /**
   * Get pending payments for admin verification
   * @param {Object} filters - Filter options (status, userId, limit, offset)
   * @returns {Promise<Object>} - Pending payments with pagination
   */
  async getPendingPayments(filters = {}) {
    try {
      const {
        status = "pending_verification",
        limit = 20,
        offset = 0,
        userId = null,
        sortBy = "-submittedAt"
      } = filters;

      const query = { status };

      if (userId) {
        query.user = userId;
      }

      const payments = await UpiPayment.find(query)
        .populate("user", "name email phone")
        .populate("order", "totalAmount items")
        .sort(sortBy)
        .limit(limit)
        .skip(offset)
        .lean();

      const total = await UpiPayment.countDocuments(query);

      return {
        payments: payments.map(p => ({
          paymentId: p._id,
          orderId: p.order._id,
          customerName: p.user.name,
          customerEmail: p.user.email,
          amount: p.order.totalAmount,
          extractedUtr: p.extractedUtr,
          submittedAt: p.submittedAt,
          screenshotUrl: p.screenshotUrl,
          attemptCount: p.attemptCount
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      };
    } catch (error) {
      console.error("Error fetching pending payments:", error);
      throw new Error("Failed to fetch pending payments");
    }
  }

  /**
   * Verify payment (Admin action)
   * @param {string} paymentId - Payment ID to verify
   * @param {string} action - 'approve' or 'reject'
   * @param {string} adminId - Admin user ID
   * @param {string} notes - Verification notes
   * @returns {Promise<Object>} - Updated payment and order
   */
  async verifyPayment(paymentId, action, adminId, notes = "") {
    try {
      const payment = await UpiPayment.findById(paymentId);

      if (!payment) {
        throw new Error("Payment record not found");
      }

      if (payment.status !== "pending_verification") {
        throw new Error(
          `Cannot verify payment with status: ${payment.status}. Expected: pending_verification`
        );
      }

      let updatedOrder = null;

      if (action === "approve") {
        // Mark payment as verified
        await payment.markAsVerified(adminId, notes);

        // Update order status
        updatedOrder = await Order.findByIdAndUpdate(
          payment.order,
          {
            status: "confirmed",
            paymentVerifiedAt: new Date(),
            paymentReference: payment.extractedUtr || payment.manualUtr
          },
          { new: true }
        );

        console.log(`✅ Payment verified: ${paymentId}`);
      } else if (action === "reject") {
        // Mark payment as rejected
        await payment.reject(adminId, notes);

        // Update order status
        updatedOrder = await Order.findByIdAndUpdate(
          payment.order,
          {
            status: "payment_failed",
            adminNotes: notes
          },
          { new: true }
        );

        console.log(`❌ Payment rejected: ${paymentId}`);
      } else {
        throw new Error(`Invalid action: ${action}. Expected: 'approve' or 'reject'`);
      }

      return {
        success: true,
        payment: {
          paymentId: payment._id,
          status: payment.status,
          action: payment.adminAction,
          verifiedAt: payment.verificationDate
        },
        order: {
          orderId: updatedOrder._id,
          status: updatedOrder.status
        }
      };
    } catch (error) {
      console.error("Error verifying payment:", error);
      throw error;
    }
  }

  /**
   * Resubmit payment (Customer action)
   * @param {string} orderId - Order ID
   * @param {Object} newPaymentData - New payment data
   * @returns {Promise<Object>} - Updated payment record
   */
  async resubmitPayment(orderId, newPaymentData) {
    try {
      const existing = await UpiPayment.findOne({ order: orderId });

      if (!existing) {
        throw new Error("No previous payment found for this order");
      }

      // Check attempt limit
      if (existing.attemptCount >= 3) {
        throw new Error("Maximum retry attempts (3) exceeded. Please contact support.");
      }

      // Update payment with new data
      existing.status = newPaymentData.extractedUtr ? "pending_verification" : "utr_detection_failed";
      existing.screenshotUrl = newPaymentData.screenshotUrl;
      existing.screenshotFileName = newPaymentData.screenshotFileName;
      existing.extractedUtr = newPaymentData.extractedUtr || null;
      existing.ocrConfidence = newPaymentData.ocrConfidence || null;
      existing.attemptCount += 1;
      existing.lastAttemptAt = new Date();

      await existing.save();
      console.log(`✅ Payment resubmitted: ${orderId}`);

      return existing;
    } catch (error) {
      console.error("Error resubmitting payment:", error);
      throw error;
    }
  }

  /**
   * Get payment statistics for dashboard
   * @returns {Promise<Object>} - Payment statistics
   */
  async getPaymentStatistics() {
    try {
      const totalPayments = await UpiPayment.countDocuments();
      const verifiedPayments = await UpiPayment.countDocuments({ status: "verified" });
      const pendingPayments = await UpiPayment.countDocuments({ status: "pending_verification" });
      const rejectedPayments = await UpiPayment.countDocuments({ status: "rejected" });

      const totalVerifiedAmount = await UpiPayment.aggregate([
        { $match: { status: "verified" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);

      return {
        totalPayments,
        verifiedPayments,
        pendingPayments,
        rejectedPayments,
        verificationRate: totalPayments > 0 ? ((verifiedPayments / totalPayments) * 100).toFixed(2) : 0,
        totalVerifiedAmount: totalVerifiedAmount[0]?.total || 0
      };
    } catch (error) {
      console.error("Error getting payment statistics:", error);
      throw new Error("Failed to fetch payment statistics");
    }
  }
}

export default new UpiService();