import mongoose from "mongoose";

const upiConfigSchema = new mongoose.Schema(
  {
    // Only one document should exist (singleton pattern)
    isActive: {
      type: Boolean,
      default: true
    },

    // UPI ID (e.g., "siri@upi")
    upiId: {
      type: String,
      required: true,
      trim: true
    },

    // QR Code image (base64 or URL)
    qrCodeImage: {
      type: String,
      default: null
    },

    // Merchant name for display
    merchantName: {
      type: String,
      default: "Siri Taste Craft"
    },

    // Instructions
    instructions: {
      type: String,
      default: "Please scan the QR code or use the UPI ID to make payment. You will receive a transaction ID after payment."
    },

    // Last updated by admin
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model("UPIConfig", upiConfigSchema);