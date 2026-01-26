import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Saree",
          required: true
        },
        name: {
          type: String,
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: 1
        },
        price: {
          type: Number,
          required: true
        }
      }
    ],

    totalAmount: {
      type: Number,
      required: true
    },

    // ✅ Payment Fields
    status: {
      type: String,
      enum: [
        "pending_payment",      // Customer needs to pay
        "payment_submitted",    // Customer submitted proof, awaiting verification
        "confirmed",            // Payment verified by admin
        "payment_rejected",     // Payment not verified
        "shipped",
        "delivered",
        "cancelled"
      ],
      default: "pending_payment"
    },

    paymentMethod: {
      type: String,
      enum: ["upi", "card", "net_banking"],
      default: "upi"
    },

    paymentReference: {
      type: String,          // UPI reference number or transaction ID
      default: null
    },

    paymentProof: {
      type: String,          // URL to screenshot of payment
      default: null
    },

    paymentSubmittedAt: {
      type: Date,
      default: null
    },

    paymentVerifiedAt: {
      type: Date,
      default: null
    },

    // Admin notes
    adminNotes: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

// Index for quick queries
orderSchema.index({ user: 1, status: 1 });
orderSchema.index({ createdAt: -1 });

export default mongoose.model("Order", orderSchema);