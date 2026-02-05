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

    // ✅ UPDATED: Support both UPI and RAZORPAY
    paymentMethod: {
      type: String,
      enum: ["COD", "UPI", "RAZORPAY"],  // ✅ ADDED RAZORPAY
      required: true
    },

    // DELIVERY ADDRESS (keep existing logic)
    address: {
      fullName: {
        type: String,
        required: function () {
          return this.paymentMethod === "COD";
        }
      },
      mobileNumber: {
        type: String,
        required: function () {
          return this.paymentMethod === "COD";
        }
      },
      houseFlat: {
        type: String,
        required: function () {
          return this.paymentMethod === "COD";
        }
      },
      streetArea: {
        type: String,
        required: function () {
          return this.paymentMethod === "COD";
        }
      },
      city: {
        type: String,
        required: function () {
          return this.paymentMethod === "COD";
        }
      },
      state: {
        type: String,
        required: function () {
          return this.paymentMethod === "COD";
        }
      },
      pincode: {
        type: String,
        required: function () {
          return this.paymentMethod === "COD";
        }
      },
      addressType: {
        type: String,
        enum: ["Home", "Work"],
        required: function () {
          return this.paymentMethod === "COD";
        }
      }
    },

    // ✅ UPDATED: Support both old and new order statuses
    orderStatus: {
      type: String,
      enum: [
        // Old UPI statuses (keep for backward compatibility)
        "PENDING_PAYMENT",
        "PLACED",
        "CONFIRMED",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
        // New Razorpay statuses
        "CREATED",
        "PAYMENT_PENDING",
        "PAID"
      ],
      default: function () {
        if (this.paymentMethod === "COD") return "PLACED";
        if (this.paymentMethod === "UPI") return "PENDING_PAYMENT";
        if (this.paymentMethod === "RAZORPAY") return "CREATED";
        return "CREATED";
      }
    },

    // ✅ KEEP OLD: UPI Payment Status (for existing UPI orders)
    paymentStatus: {
      type: String,
      enum: [
        "COD_PENDING",
        "PENDING",
        "PAYMENT_SUBMITTED",
        "VERIFIED",
        "REJECTED",
        "COMPLETED"
      ],
      default: function () {
        return this.paymentMethod === "COD" ? "COD_PENDING" : "PENDING";
      }
    },

    // ✅ KEEP OLD: UPI Payment fields (for existing UPI orders)
    paymentReference: {
      type: String,
      default: null
    },

    paymentProof: {
      type: String,
      default: null
    },

    paymentSubmittedAt: {
      type: Date,
      default: null
    },

    // ✅ ADD NEW: Razorpay fields (only used for RAZORPAY orders)
    razorpayOrderId: {
      type: String,
      default: null
    },

    razorpayPaymentId: {
      type: String,
      default: null
    },

    razorpaySignature: {
      type: String,
      default: null
    },

    paymentVerifiedAt: {
      type: Date,
      default: null
    },

    adminNotes: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

// ✅ ADD NEW INDEX for Razorpay
orderSchema.index({ razorpayOrderId: 1 });

// Keep existing indexes
orderSchema.index({ user: 1, orderStatus: 1 });
orderSchema.index({ user: 1, paymentMethod: 1 });
orderSchema.index({ createdAt: -1 });

export default mongoose.model("Order", orderSchema);