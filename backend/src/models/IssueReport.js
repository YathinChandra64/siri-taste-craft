import mongoose from "mongoose";

const issueReportSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    customerName: {
      type: String,
      required: true
    },

    customerEmail: {
      type: String,
      required: true
    },

    issueType: {
      type: String,
      enum: ["payment", "product", "shipping", "website", "other"],
      required: true
    },

    description: {
      type: String,
      required: true,
      minlength: 10
    },

    orderRelated: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null
    },

    status: {
      type: String,
      enum: ["reported", "acknowledged", "in_progress", "resolved"],
      default: "reported"
    },

    adminNotes: {
      type: String,
      default: ""
    },

    resolvedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

issueReportSchema.index({ customer: 1, status: 1 });
issueReportSchema.index({ createdAt: -1 });

export default mongoose.model("IssueReport", issueReportSchema);