import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // ✅ Type of notification
    type: {
      type: String,
      enum: [
        "payment_received",      // Admin: Customer submitted payment
        "order_confirmed",       // Customer: Order confirmed
        "payment_rejected",      // Customer: Payment rejected
        "order_shipped",         // Customer: Order shipped
        "order_delivered",       // Customer: Order delivered
        "message_reply",         // Customer: Admin replied to message
        "general"                // General notification
      ],
      required: true
    },

    // ✅ Who gets this notification
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null // null = for admin
    },

    // Notification content
    title: {
      type: String,
      required: true
    },

    message: {
      type: String,
      required: true
    },

    // ✅ Related IDs for quick navigation
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null
    },

    relatedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    // Status
    isRead: {
      type: Boolean,
      default: false
    },

    readAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// Index for quick queries
notificationSchema.index({ targetUser: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);