import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    category: {
      type: String,
      required: true,
      enum: ["Silk", "Cotton", "Bridal", "Designer", "Other"]
    },

    price: {
      type: Number,
      required: true
    },

    stock: {
      type: Number,
      required: true,
      default: 0
    },

    description: {
      type: String
    },

    imageUrl: {
      type: String
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
