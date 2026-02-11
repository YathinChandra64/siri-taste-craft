import mongoose from "mongoose";

const ColorVariantSchema = new mongoose.Schema({
  color: {
    type: String,
    required: true,
  },
  colorCode: {
    type: String,
    required: true,
  },
  images: {
    type: [String],
    required: true,
    default: [],
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
});

const SareeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Silk",
        "Cotton",
        "Georgette",
        "Chiffon",
        "Net",
        "Banarasi",
        "Kanjeevaram",
        "Designer",
        "Traditional",
        "Contemporary",
        "Bridal",
        "Party Wear",
        "Casual",
      ],
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    material: String,
    color: String,
    occasion: String,
    blousePrice: {
      type: Number,
      min: 0,
    },
    length: {
      type: String,
      default: "6.5 meters",
    },
    fabric: String,
    tags: {
      type: [String],
      default: [],
    },
    colorVariants: {
      type: [ColorVariantSchema],
      default: [],
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    reviewCount: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
SareeSchema.index({ category: 1, fabric: 1 });
SareeSchema.index({ price: 1 });
SareeSchema.index({ averageRating: -1 });
SareeSchema.index({ tags: 1 });

// Virtual: Check if in stock
SareeSchema.virtual("inStock").get(function () {
  if (this.colorVariants?.length > 0) {
    return this.colorVariants.some((variant) => variant.stock > 0);
  }
  return this.stock > 0;
});

// Method: Get total stock
SareeSchema.methods.getTotalStock = function () {
  if (this.colorVariants?.length > 0) {
    return this.colorVariants.reduce(
      (total, variant) => total + variant.stock,
      0
    );
  }
  return this.stock;
};

// Method: Update variant stock
SareeSchema.methods.updateVariantStock = function (color, quantity) {
  if (!this.colorVariants?.length) return false;

  const variant = this.colorVariants.find((v) => v.color === color);
  if (!variant) return false;

  variant.stock = Math.max(0, variant.stock + quantity);
  return true;
};

const Saree = mongoose.model("Saree", SareeSchema);

export default Saree;
