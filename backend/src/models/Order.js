import mongoose from "mongoose";

const orderTimelineSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: [
        "CREATED",
        "PENDING_PAYMENT",
        "PLACED",
        "CONFIRMED",
        "PROCESSING",
        "PACKED",
        "SHIPPED",
        "IN_TRANSIT",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
        "RETURNED",
        "REFUNDED"
      ],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    description: {
      type: String,
      required: true
    },
    location: {
      type: String,
      default: null // e.g., "Warehouse", "In Transit", "Local Hub"
    },
    shipper: {
      type: String,
      default: null // e.g., "Fedex", "DHL", "DTDC"
    },
    trackingNumber: {
      type: String,
      default: null
    },
    trackingUrl: {
      type: String,
      default: null
    },
    notes: {
      type: String,
      default: null
    }
  },
  { timestamps: false }
);

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

    // Payment method
    paymentMethod: {
      type: String,
      enum: ["COD", "UPI", "RAZORPAY"],
      required: true
    },

    // Delivery address
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

    // ✅ Main order status
    orderStatus: {
      type: String,
      enum: [
        "CREATED",
        "PENDING_PAYMENT",
        "PLACED",
        "CONFIRMED",
        "PROCESSING",
        "PACKED",
        "SHIPPED",
        "IN_TRANSIT",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
        "RETURNED",
        "REFUNDED"
      ],
      default: function () {
        if (this.paymentMethod === "COD") return "PLACED";
        if (this.paymentMethod === "UPI") return "PENDING_PAYMENT";
        if (this.paymentMethod === "RAZORPAY") return "CREATED";
        return "CREATED";
      }
    },

    // Payment status (for UPI/manual payments)
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

    // UPI Payment fields
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

    // Razorpay fields
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

    // ✅ NEW: Order tracking timeline
    orderTimeline: [orderTimelineSchema],

    // Shipping information
    shipping: {
      shipper: {
        type: String,
        default: null // "Fedex", "DHL", "DTDC", etc.
      },
      trackingNumber: {
        type: String,
        default: null
      },
      trackingUrl: {
        type: String,
        default: null
      },
      estimatedDeliveryDate: {
        type: Date,
        default: null
      },
      actualDeliveryDate: {
        type: Date,
        default: null
      }
    },

    // Admin notes
    adminNotes: {
      type: String,
      default: null
    },

    // Customer notes
    customerNotes: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

// Indexes
orderSchema.index({ user: 1, orderStatus: 1 });
orderSchema.index({ user: 1, paymentMethod: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ razorpayOrderId: 1 });
orderSchema.index({ "shipping.trackingNumber": 1 });

// ✅ Pre-save middleware to ensure timeline is initialized
orderSchema.pre("save", function (next) {
  // Initialize timeline if empty
  if (!this.orderTimeline || this.orderTimeline.length === 0) {
    this.orderTimeline = [
      {
        status: this.orderStatus,
        description: this.getStatusDescription(this.orderStatus),
        timestamp: new Date()
      }
    ];
  }
  next();
});

// ✅ Helper method to get status descriptions
orderSchema.methods.getStatusDescription = function (status) {
  const descriptions = {
    "CREATED": "Order has been created and is awaiting confirmation",
    "PENDING_PAYMENT": "Waiting for payment verification",
    "PLACED": "Your order has been placed successfully",
    "CONFIRMED": "Order has been confirmed by our team",
    "PROCESSING": "We are preparing your order for shipment",
    "PACKED": "Your order has been packed and is ready to ship",
    "SHIPPED": "Your order has been shipped",
    "IN_TRANSIT": "Your order is on its way to you",
    "OUT_FOR_DELIVERY": "Your order is out for delivery today",
    "DELIVERED": "Your order has been delivered successfully",
    "CANCELLED": "Your order has been cancelled",
    "RETURNED": "Your order has been returned",
    "REFUNDED": "Your refund has been processed"
  };
  return descriptions[status] || "Order status updated";
};

// ✅ Helper method to add timeline entry
orderSchema.methods.addTimelineEntry = function (status, description, details = {}) {
  this.orderTimeline.push({
    status,
    description,
    timestamp: new Date(),
    location: details.location || null,
    shipper: details.shipper || null,
    trackingNumber: details.trackingNumber || null,
    trackingUrl: details.trackingUrl || null,
    notes: details.notes || null
  });
};

// ✅ Helper method to update status and timeline
orderSchema.methods.updateStatus = function (newStatus, details = {}) {
  this.orderStatus = newStatus;
  const description = details.description || this.getStatusDescription(newStatus);
  this.addTimelineEntry(newStatus, description, details);
  return this.save();
};

export default mongoose.model("Order", orderSchema);