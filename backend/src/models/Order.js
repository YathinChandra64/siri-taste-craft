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

    // ✅ DELIVERY ADDRESS FIELDS (NEW)
    address: {
      fullName: {
        type: String,
        required: true
      },
      mobileNumber: {
        type: String,
        required: true
      },
      houseFlat: {
        type: String,
        required: true
      },
      streetArea: {
        type: String,
        required: true
      },
      city: {
        type: String,
        required: true
      },
      state: {
        type: String,
        required: true
      },
      pincode: {
        type: String,
        required: true
      },
      addressType: {
        type: String,
        enum: ["Home", "Work"],
        required: true
      }
    },

    // ✅ PAYMENT METHOD (UPDATED)
    paymentMethod: {
      type: String,
      enum: ["COD", "UPI"],
      default: "COD"
    },

    // ✅ ORDER STATUS (NEW)
    orderStatus: {
      type: String,
      enum: [
        "PLACED",           // Order created, waiting for fulfillment
        "CONFIRMED",        // Confirmed (UPI: payment verified, COD: confirmed)
        "PROCESSING",       // Being prepared
        "SHIPPED",          // On the way
        "DELIVERED",        // Delivered
        "CANCELLED"         // Cancelled
      ],
      default: "PLACED"
    },

    // ✅ PAYMENT STATUS (UPDATED)
    paymentStatus: {
      type: String,
      enum: [
        "COD_PENDING",      // Cash on Delivery - payment pending at delivery
        "PENDING",          // For UPI - waiting for payment
        "PAYMENT_SUBMITTED", // Payment submitted, awaiting verification
        "VERIFIED",         // Payment verified
        "REJECTED",         // Payment rejected
        "COMPLETED"         // Payment completed
      ],
      default: "COD_PENDING"
    },

    // ✅ PAYMENT REFERENCE & PROOF (KEPT FROM ORIGINAL)
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

// ✅ INDEXES FOR PERFORMANCE
orderSchema.index({ user: 1, orderStatus: 1 });
orderSchema.index({ user: 1, paymentMethod: 1 });
orderSchema.index({ createdAt: -1 });

export default mongoose.model("Order", orderSchema);