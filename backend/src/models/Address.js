import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    fullName: {
      type: String,
      required: true,
      trim: true
    },

    mobileNumber: {
      type: String,
      required: true,
      match: [/^\d{10}$/, "Mobile number must be 10 digits"]
    },

    houseFlat: {
      type: String,
      required: true,
      trim: true
    },

    streetArea: {
      type: String,
      required: true,
      trim: true
    },

    city: {
      type: String,
      required: true,
      trim: true
    },

    state: {
      type: String,
      required: true,
      trim: true
    },

    pincode: {
      type: String,
      required: true,
      match: [/^\d{6}$/, "Pincode must be 6 digits"]
    },

    addressType: {
      type: String,
      enum: ["Home", "Work"],
      required: true
    },

    isDefault: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Index for quick queries
addressSchema.index({ user: 1 });

export default mongoose.model("Address", addressSchema);