import mongoose from 'mongoose';

const Schema = mongoose.Schema;

/**
 * Review Model - For customer reviews on sarees
 * Stores all review data with verification and moderation features
 */

const reviewSchema = new Schema(
  {
    // References
    sareeId: {
      type: Schema.Types.ObjectId,
      ref: 'Saree',
      required: [true, 'Saree ID is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order ID is required'],
      index: true,
    },

    // User Info (denormalized for fast access)
    userName: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
      maxlength: [100, 'User name cannot exceed 100 characters'],
    },
    userEmail: {
      type: String,
      required: [true, 'User email is required'],
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },

    // Review Content
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Review title is required'],
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
      trim: true,
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      minlength: [10, 'Comment must be at least 10 characters'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
      trim: true,
    },

    // Status
    isVerifiedBuyer: {
      type: Boolean,
      default: false,
      index: true,
    },
    isApproved: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Engagement
    helpful: {
      type: Number,
      default: 0,
      min: 0,
    },
    helpfulBy: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index: one review per user per saree
reviewSchema.index({ userId: 1, sareeId: 1 }, { unique: true });

// Compound indexes for efficient querying
reviewSchema.index({ sareeId: 1, createdAt: -1 });
reviewSchema.index({ sareeId: 1, rating: -1 });
reviewSchema.index({ sareeId: 1, helpful: -1 });
reviewSchema.index({ userId: 1, createdAt: -1 });

// Pre-save middleware to prevent duplicate reviews
reviewSchema.pre('save', async function (next) {
  if (this.isNew) {
    const existingReview = await mongoose.model('Review').findOne({
      userId: this.userId,
      sareeId: this.sareeId,
      _id: { $ne: this._id },
    });

    if (existingReview) {
      const error = new Error('You have already reviewed this saree');
      error.name = 'ValidationError';
      return next(error);
    }
  }
  next();
});

const Review = mongoose.model('Review', reviewSchema);

export default Review;