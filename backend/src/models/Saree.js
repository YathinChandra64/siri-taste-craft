import mongoose from 'mongoose';

const Schema = mongoose.Schema;

/**
 * Updated Saree Model
 * Added fields for review ratings and statistics
 */

const sareeSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Saree name is required'],
      trim: true,
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['Silk', 'Cotton', 'Bridal', 'Designer', 'Casual', 'Traditional'],
        message: 'Invalid category',
      },
      index: true,
    },
    material: {
      type: String,
      enum: {
        values: [
          'Pure Silk',
          'Cotton',
          'Chiffon',
          'Georgette',
          'Kanjivaram',
          'Banarasi',
          'Linen',
          'Silk Blend',
          'Cotton Blend',
        ],
        message: 'Invalid material type',
      },
      index: true,
    },
    color: {
      type: String,
      index: true,
    },
    occasion: {
      type: String,
      enum: {
        values: ['Wedding', 'Casual', 'Festival', 'Office', 'Party'],
        message: 'Invalid occasion',
      },
      index: true,
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [20, 'Description must be at least 20 characters'],
    },
    blousePrice: {
      type: Number,
      min: [0, 'Blouse price cannot be negative'],
    },
    length: {
      type: String,
      // e.g., "6m", "5.5m"
    },

    // Review Statistics (denormalized for fast access)
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      index: true,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    ratingDistribution: {
      type: {
        5: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        1: { type: Number, default: 0 },
      },
      default: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient filtering
sareeSchema.index({ category: 1, price: 1 });
sareeSchema.index({ material: 1, color: 1 });
sareeSchema.index({ averageRating: -1, createdAt: -1 });
sareeSchema.index({ name: 'text', description: 'text' }); // For full-text search

// Pre-save validation
sareeSchema.pre('save', function (next) {
  // Ensure rating is valid
  if (this.averageRating < 0 || this.averageRating > 5) {
    this.averageRating = 0;
  }

  // Ensure review count is non-negative
  if (this.reviewCount < 0) {
    this.reviewCount = 0;
  }

  next();
});

const Saree = mongoose.model('Saree', sareeSchema);

export default Saree;