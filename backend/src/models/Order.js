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

    // ✅ PAYMENT METHOD (determine if address is needed)
    paymentMethod: {
      type: String,
      enum: ["COD", "UPI"],
      required: true
    },

    // ✅ DELIVERY ADDRESS FIELDS (CONDITIONALLY REQUIRED)
    // Required only for COD, optional for UPI
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

    // ✅ ORDER STATUS
    orderStatus: {
      type: String,
      enum: [
        "PENDING_PAYMENT",  // For UPI: waiting for payment
        "PLACED",           // For COD: order created
        "CONFIRMED",        // After payment/confirmation
        "PROCESSING",       // Being prepared
        "SHIPPED",          // On the way
        "DELIVERED",        // Delivered
        "CANCELLED"         // Cancelled
      ],
      default: function () {
        return this.paymentMethod === "COD" ? "PLACED" : "PENDING_PAYMENT";
      }
    },

    // ✅ PAYMENT STATUS
    paymentStatus: {
      type: String,
      enum: [
        "COD_PENDING",           // Cash on Delivery - payment pending at delivery
        "PENDING",               // For UPI - waiting for payment submission
        "PAYMENT_SUBMITTED",     // Payment screenshot submitted
        "VERIFIED",              // Payment verified by admin
        "REJECTED",              // Payment rejected
        "COMPLETED"              // Payment completed
      ],
      default: function () {
        return this.paymentMethod === "COD" ? "COD_PENDING" : "PENDING";
      }
    },

    // ✅ PAYMENT PROOF & REFERENCE (for UPI)
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

// ✅ INDEXES FOR PERFORMANCE
orderSchema.index({ user: 1, orderStatus: 1 });
orderSchema.index({ user: 1, paymentMethod: 1 });
orderSchema.index({ createdAt: -1 });

export default mongoose.model("Order", orderSchema);