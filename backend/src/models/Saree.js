import mongoose from "mongoose";

const sareeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2
    },
    description: {
      type: String,
      required: true,
      minlength: 10
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    category: {
      type: String,
      enum: ["Silk", "Cotton", "Bridal", "Designer", "Casual", "Traditional"],
      default: "Traditional"
    },
    material: {
      type: String,
      trim: true
    },
    color: {
      type: String,
      trim: true
    },
    size: {
      type: String,
      default: "Free Size"
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    imageUrl: {
      type: String,
      default: "https://via.placeholder.com/500x500?text=Saree"
    },
    images: [{
      type: String
    }],
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    reviews: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    sku: {
      type: String,
      unique: true,
      sparse: true
    },
    tags: [String],
    blouseIncluded: {
      type: Boolean,
      default: true
    },
    length: {
      type: String,
      default: "6.5 meters"
    },
    washCare: {
      type: String,
      default: "Dry clean recommended"
    }
  },
  { timestamps: true }
);

// Index for search
sareeSchema.index({ name: "text", description: "text", tags: "text" });

export default mongoose.model("Saree", sareeSchema);