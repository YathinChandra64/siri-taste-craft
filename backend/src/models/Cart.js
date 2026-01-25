import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    saree: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Saree",
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Index for quick lookup
cartSchema.index({ user: 1, saree: 1 });

export default mongoose.model("Cart", cartSchema);