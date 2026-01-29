import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["new_message", "message_reply", "order_status", "general"],
      default: "general",
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact",
      default: null
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null
    },
    isRead: {
      type: Boolean,
      default: false
    },
    recipientRole: {
      type: String,
      enum: ["admin", "customer"],
      required: true
    }
  },
  { timestamps: true }
);

// Index for faster queries
notificationSchema.index({ email: 1, isRead: 1 });
notificationSchema.index({ recipientRole: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);