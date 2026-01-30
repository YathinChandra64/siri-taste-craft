/**
 * Notification Service
 * Handles sending notifications to admin and customers
 */

import Notification from "../models/Notification.js";
import nodemailer from "nodemailer";

class NotificationService {
  constructor() {
    this.emailEnabled = process.env.NOTIFICATION_SERVICE_ENABLED === "true";
    this.adminEmail = process.env.ADMIN_EMAIL || "admin@siritastecraft.com";
    
    // Initialize email transporter if enabled
    if (this.emailEnabled) {
      this.initializeEmailTransporter();
    }
  }

  /**
   * Initialize email transporter
   */
  initializeEmailTransporter() {
    try {
      // You can configure email service here (Gmail, SendGrid, etc.)
      // For now, we'll use a simple console-based notification
      console.log("📧 Notification Service initialized");
    } catch (error) {
      console.error("Error initializing email transporter:", error);
      this.emailEnabled = false;
    }
  }

  /**
   * Create and save notification in database
   * @param {Object} notificationData - Notification details
   * @returns {Promise<Object>} - Saved notification
   */
  async createNotification(notificationData) {
    try {
      const {
        type, // 'payment_submitted', 'payment_verified', 'payment_rejected', etc.
        recipient, // User ID or 'admin'
        title,
        message,
        relatedData = {},
        priority = "normal"
      } = notificationData;

      const notification = new Notification({
        type,
        recipient,
        title,
        message,
        relatedData,
        priority,
        read: false,
        createdAt: new Date()
      });

      await notification.save();
      console.log(`✅ Notification created: ${notification._id}`);

      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  /**
   * Notify admin about new UPI payment submission
   * @param {Object} paymentData - Payment information
   */
  async notifyAdminPaymentSubmitted(paymentData) {
    try {
      const {
        paymentId,
        orderId,
        customerName,
        customerEmail,
        amount,
        extractedUtr,
        screenshotUrl,
        ocrConfidence
      } = paymentData;

      const title = `💳 New UPI Payment Submitted`;
      const message = `
Payment from ${customerName} (${customerEmail})
Order: ${orderId}
Amount: ₹${amount}
${extractedUtr ? `UTR: ${extractedUtr} (Confidence: ${ocrConfidence}%)` : "UTR: Not detected - manual verification needed"}
      `.trim();

      // Save to database
      await this.createNotification({
        type: "payment_submitted",
        recipient: "admin",
        title,
        message,
        relatedData: {
          paymentId,
          orderId,
          customerName,
          amount,
          extractedUtr,
          screenshotUrl
        },
        priority: "high"
      });

      // Send email if enabled
      if (this.emailEnabled) {
        await this.sendEmail({
          to: this.adminEmail,
          subject: title,
          html: this.generateAdminPaymentEmailHtml({
            customerName,
            amount,
            extractedUtr,
            orderId,
            paymentId,
            screenshotUrl,
            ocrConfidence
          })
        });
      }

      console.log(`📧 Admin notified about payment submission: ${paymentId}`);
    } catch (error) {
      console.error("Error notifying admin:", error);
      // Don't throw - notification failure shouldn't block main flow
    }
  }

  /**
   * Notify customer about payment submission status
   * @param {Object} paymentData - Payment information
   */
  async notifyCustomerPaymentSubmitted(paymentData) {
    try {
      const {
        paymentId,
        orderId,
        customerEmail,
        amount,
        extractedUtr,
        utrDetected
      } = paymentData;

      const title = `✅ Payment Submitted Successfully`;
      const message = utrDetected
        ? `Your payment of ₹${amount} has been submitted with UTR: ${extractedUtr}. We will verify it within 24 hours.`
        : `Your payment of ₹${amount} has been received. We couldn't automatically detect the UTR from your screenshot. Our team will verify it manually.`;

      // Send notification (you can add user ID here)
      console.log(`📧 Customer notified at ${customerEmail}: Payment submitted`);

      // Send email if enabled
      if (this.emailEnabled) {
        await this.sendEmail({
          to: customerEmail,
          subject: title,
          html: this.generateCustomerPaymentEmailHtml({
            title,
            message,
            orderId,
            amount,
            extractedUtr,
            utrDetected
          })
        });
      }
    } catch (error) {
      console.error("Error notifying customer about submission:", error);
    }
  }

  /**
   * Notify customer about payment approval
   * @param {Object} approvalData - Approval information
   */
  async notifyCustomerPaymentApproved(approvalData) {
    try {
      const {
        orderId,
        customerEmail,
        customerName,
        amount,
        extractedUtr
      } = approvalData;

      const title = `🎉 Payment Verified & Order Confirmed!`;
      const message = `
Your payment of ₹${amount} has been verified successfully.
Your order #${orderId} is now confirmed and will be processed for shipment.
Transaction ID: ${extractedUtr}
      `.trim();

      console.log(`📧 Customer notified at ${customerEmail}: Payment approved`);

      // Send email if enabled
      if (this.emailEnabled) {
        await this.sendEmail({
          to: customerEmail,
          subject: title,
          html: this.generatePaymentApprovedEmailHtml({
            customerName,
            amount,
            orderId,
            extractedUtr
          })
        });
      }
    } catch (error) {
      console.error("Error notifying customer about approval:", error);
    }
  }

  /**
   * Notify customer about payment rejection
   * @param {Object} rejectionData - Rejection information
   */
  async notifyCustomerPaymentRejected(rejectionData) {
    try {
      const {
        orderId,
        customerEmail,
        customerName,
        reason,
        retryAvailable
      } = rejectionData;

      const title = `⚠️  Payment Verification Failed`;
      const message = `
Your payment for order #${orderId} could not be verified.
Reason: ${reason}
${retryAvailable ? "You can resubmit your payment. Please make sure the UTR is clearly visible in the screenshot." : "Please contact our support team for assistance."}
      `.trim();

      console.log(`📧 Customer notified at ${customerEmail}: Payment rejected`);

      // Send email if enabled
      if (this.emailEnabled) {
        await this.sendEmail({
          to: customerEmail,
          subject: title,
          html: this.generatePaymentRejectedEmailHtml({
            customerName,
            orderId,
            reason,
            retryAvailable
          })
        });
      }
    } catch (error) {
      console.error("Error notifying customer about rejection:", error);
    }
  }

  /**
   * Send email (stub - implement with your email provider)
   * @param {Object} emailData - Email configuration
   */
  async sendEmail(emailData) {
    try {
      // This is a placeholder - implement with your email service
      // Example using nodemailer:
      /*
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html
      });
      */

      console.log(`📧 Email sent to: ${emailData.to}`);
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }

  /**
   * Generate admin payment notification email HTML
   */
  generateAdminPaymentEmailHtml(data) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New UPI Payment Submitted</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
          <p><strong>Customer:</strong> ${data.customerName}</p>
          <p><strong>Email:</strong> ${data.customerEmail}</p>
          <p><strong>Order ID:</strong> ${data.orderId}</p>
          <p><strong>Amount:</strong> ₹${data.amount}</p>
          ${data.extractedUtr ? `
            <p><strong>Extracted UTR:</strong> ${data.extractedUtr}</p>
            <p><strong>OCR Confidence:</strong> ${data.ocrConfidence}%</p>
          ` : `
            <p style="color: #d32f2f;"><strong>⚠️ UTR Not Detected</strong> - Manual verification needed</p>
          `}
          <a href="${data.screenshotUrl}" style="color: #1976d2; text-decoration: none;">View Screenshot</a>
        </div>
        <p style="margin-top: 20px;">
          <a href="${process.env.ADMIN_DASHBOARD_URL}/payments/${data.paymentId}" 
             style="display: inline-block; background: #1976d2; color: white; padding: 10px 20px; 
                    text-decoration: none; border-radius: 4px;">
            Verify Payment
          </a>
        </p>
      </div>
    `;
  }

  /**
   * Generate customer payment submitted email HTML
   */
  generateCustomerPaymentEmailHtml(data) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${data.title}</h2>
        <p>${data.message}</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Order ID:</strong> ${data.orderId}</p>
          <p><strong>Amount:</strong> ₹${data.amount}</p>
          ${data.extractedUtr ? `<p><strong>Transaction ID:</strong> ${data.extractedUtr}</p>` : ''}
        </div>
        <p style="color: #666; font-size: 14px;">
          We will send you another notification once your payment is verified.
        </p>
      </div>
    `;
  }

  /**
   * Generate payment approved email HTML
   */
  generatePaymentApprovedEmailHtml(data) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4caf50;">🎉 Payment Verified & Order Confirmed!</h2>
        <p>Hi ${data.customerName},</p>
        <p>Your payment has been successfully verified.</p>
        <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
          <p><strong>Order ID:</strong> #${data.orderId}</p>
          <p><strong>Amount Paid:</strong> ₹${data.amount}</p>
          <p><strong>Transaction ID:</strong> ${data.extractedUtr}</p>
          <p style="margin: 0;"><strong>Status:</strong> <span style="color: #4caf50;">✓ Confirmed</span></p>
        </div>
        <p>Your order will be processed for shipment shortly. You will receive tracking information via email.</p>
      </div>
    `;
  }

  /**
   * Generate payment rejected email HTML
   */
  generatePaymentRejectedEmailHtml(data) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d32f2f;">⚠️ Payment Verification Failed</h2>
        <p>Hi ${data.customerName},</p>
        <p>Unfortunately, we couldn't verify your payment for order #${data.orderId}.</p>
        <div style="background: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d32f2f;">
          <p><strong>Reason:</strong> ${data.reason}</p>
        </div>
        ${data.retryAvailable ? `
          <p>You can resubmit your payment. Please ensure:</p>
          <ul>
            <li>The screenshot clearly shows the UTR/Reference number</li>
            <li>The UTR is readable and not blurred</li>
            <li>The payment status shows "Success" or "Completed"</li>
          </ul>
        ` : `
          <p>Please contact our support team for assistance: support@siritastecraft.com</p>
        `}
      </div>
    `;
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   */
  async markAsRead(notificationId) {
    try {
      await Notification.findByIdAndUpdate(notificationId, { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  /**
   * Get unread notifications for user
   * @param {string} userId - User ID or 'admin'
   * @returns {Promise<Array>} - Unread notifications
   */
  async getUnreadNotifications(userId) {
    try {
      return await Notification.find({
        recipient: userId,
        read: false
      }).sort({ createdAt: -1 });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }
  }
}

export default new NotificationService();