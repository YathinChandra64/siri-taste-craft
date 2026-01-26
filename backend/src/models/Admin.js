import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    // Admin identification
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false
    },

    role: {
      type: String,
      enum: ["admin"],
      default: "admin"
    },

    // ✅ UPI PAYMENT SETTINGS (Required for Payment System)
    upiQrCode: {
      type: String,
      default: null,
      description: "URL to UPI QR code image"
    },

    upiId: {
      type: String,
      default: null,
      description: "UPI ID (e.g., name@upi)"
    },

    upiUpdatedAt: {
      type: Date,
      default: null,
      description: "When UPI settings were last updated"
    },

    // Business Information
    businessName: {
      type: String,
      default: "Siri Taste Craft"
    },

    businessPhone: {
      type: String,
      default: null
    },

    businessEmail: {
      type: String,
      default: null
    },

    // Address
    businessAddress: {
      street: {
        type: String,
        default: null
      },
      city: {
        type: String,
        default: null
      },
      state: {
        type: String,
        default: null
      },
      zipCode: {
        type: String,
        default: null
      }
    },

    // Feature Toggles
    enablePayments: {
      type: Boolean,
      default: true
    },

    enableNotifications: {
      type: Boolean,
      default: true
    },

    // System Settings
    maintenanceMode: {
      type: Boolean,
      default: false
    },

    maintenanceMessage: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

// Index for quick lookups
adminSchema.index({ role: 1 });

export default mongoose.model("Admin", adminSchema);