import mongoose from "mongoose";

const upiPaymentSchema = new mongoose.Schema(
  {
    // Link to Order
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true
    },

    // Link to User
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // UPI Transaction Details
    upiId: {
      type: String,
      required: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    // Screenshot and OCR Data
    screenshotUrl: {
      type: String,
      default: null
    },

    screenshotFileName: {
      type: String,
      default: null
    },

    // Extracted UTR via OCR
    extractedUtr: {
      type: String,
      sparse: true,
      index: true
    },

    // Manual UTR entered by customer (fallback)
    manualUtr: {
      type: String,
      sparse: true
    },

    // OCR Confidence Score
    ocrConfidence: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    },

    // Payment Status
    status: {
      type: String,
      enum: [
        "submitted",           // Screenshot uploaded, awaiting OCR
        "utr_detected",        // UTR successfully detected
        "utr_detection_failed", // OCR couldn't find UTR, needs resubmission
        "pending_verification", // UTR found, awaiting admin verification
        "verified",            // Admin approved
        "rejected",            // Admin rejected
        "expired"              // Payment verification timeout
      ],
      default: "submitted"
    },

    // Admin Verification
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    verificationNotes: {
      type: String,
      default: null
    },

    verificationDate: {
      type: Date,
      default: null
    },

    // Timestamps
    submittedAt: {
      type: Date,
      default: Date.now
    },

    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    },

    // Retry tracking
    attemptCount: {
      type: Number,
      default: 1,
      min: 1,
      max: 3
    },

    lastAttemptAt: {
      type: Date,
      default: Date.now
    },

    // Admin decision
    adminAction: {
      type: String,
      enum: ["approved", "rejected", null],
      default: null
    },

    // Notification tracking
    notificationSentToAdmin: {
      type: Boolean,
      default: false
    },

    notificationSentToCustomer: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Indexes for efficient querying
upiPaymentSchema.index({ user: 1, status: 1 });
upiPaymentSchema.index({ order: 1 });
upiPaymentSchema.index({ status: 1 });
upiPaymentSchema.index({ extractedUtr: 1 });
upiPaymentSchema.index({ submittedAt: -1 });
upiPaymentSchema.index({ expiresAt: 1 });

// TTL Index to automatically delete expired payment records after 30 days
upiPaymentSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 }
);

// Virtual field for display
upiPaymentSchema.virtual("utr").get(function() {
  return this.extractedUtr || this.manualUtr;
});

// Static method to find by order ID
upiPaymentSchema.statics.findByOrder = function(orderId) {
  return this.findOne({ order: orderId });
};

// Static method to check if UTR is already used
upiPaymentSchema.statics.findByUtr = function(utr) {
  return this.findOne({
    $or: [
      { extractedUtr: utr },
      { manualUtr: utr }
    ],
    status: { $in: ["verified", "pending_verification"] }
  });
};

// Instance method to mark as verified
upiPaymentSchema.methods.markAsVerified = function(verifiedBy, notes = "") {
  this.status = "verified";
  this.adminAction = "approved";
  this.verifiedBy = verifiedBy;
  this.verificationNotes = notes;
  this.verificationDate = new Date();
  return this.save();
};

// Instance method to reject
upiPaymentSchema.methods.reject = function(verifiedBy, notes = "") {
  this.status = "rejected";
  this.adminAction = "rejected";
  this.verifiedBy = verifiedBy;
  this.verificationNotes = notes;
  this.verificationDate = new Date();
  return this.save();
};

// Instance method to check if expired
upiPaymentSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

export default mongoose.model("UpiPayment", upiPaymentSchema);