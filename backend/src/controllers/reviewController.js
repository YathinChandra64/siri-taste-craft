import Review from '../models/Review.js';
import Saree from '../models/Saree.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { Request, Response } from 'express';

/**
 * Review Controller
 * Handles all review-related operations
 */

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if user is a verified buyer (has purchased this saree)
 */
const isVerifiedBuyer = async (userId: string, sareeId: string) => {
  try {
    const order = await Order.findOne({
      userId,
      'items.sareeId': sareeId,
      status: { $in: ['completed', 'delivered'] },
    });
    return !!order;
  } catch (error) {
    console.error('Error checking verified buyer:', error);
    return false;
  }
};

/**
 * Calculate and update saree rating statistics
 */
const updateSareeRatings = async (sareeId: string) => {
  try {
    const reviews = await Review.find({
      sareeId,
      isApproved: true,
    });

    if (reviews.length === 0) {
      await Saree.findByIdAndUpdate(sareeId, {
        averageRating: 0,
        reviewCount: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      });
      return;
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / reviews.length;

    // Calculate rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      distribution[r.rating as keyof typeof distribution]++;
    });

    // Update saree
    await Saree.findByIdAndUpdate(sareeId, {
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount: reviews.length,
      ratingDistribution: distribution,
    });

    console.log(`✅ Updated ratings for saree ${sareeId}`);
  } catch (error) {
    console.error('Error updating saree ratings:', error);
  }
};

// ============================================
// CONTROLLER METHODS
// ============================================

/**
 * POST /api/sarees/:sareeId/reviews
 * Create a new review
 */
export const createReview = async (req: Request, res: Response) => {
  try {
    const { sareeId } = req.params;
    const { rating, title, comment } = req.body;
    const userId = (req as any).user._id;
    const userEmail = (req as any).user.email;
    const userName = (req as any).user.name || 'Anonymous';

    // ✅ Input Validation
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    if (!title || title.length < 5 || title.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Title must be between 5 and 100 characters',
      });
    }

    if (!comment || comment.length < 10 || comment.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Comment must be between 10 and 1000 characters',
      });
    }

    // ✅ Check if saree exists
    const saree = await Saree.findById(sareeId);
    if (!saree) {
      return res.status(404).json({
        success: false,
        message: 'Saree not found',
      });
    }

    // ✅ Check if user is verified buyer
    const isVerified = await isVerifiedBuyer(userId.toString(), sareeId);
    if (!isVerified) {
      return res.status(400).json({
        success: false,
        message: 'You must purchase this saree before reviewing it',
      });
    }

    // ✅ Check for existing review (prevent duplicates)
    const existingReview = await Review.findOne({
      userId,
      sareeId,
    });
    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this saree',
      });
    }

    // ✅ Create review
    const review = new Review({
      sareeId,
      userId,
      orderId: (req as any).user.lastOrderId || null, // Get from order
      userName,
      userEmail,
      rating,
      title: title.trim(),
      comment: comment.trim(),
      isVerifiedBuyer: true,
      isApproved: true,
    });

    await review.save();

    // ✅ Update saree ratings
    await updateSareeRatings(sareeId);

    // ✅ Log action
    console.log(`✅ Review created by ${userName} for saree ${sareeId}`);

    res.status(201).json({
      success: true,
      message: 'Review posted successfully',
      data: review,
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create review',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * GET /api/sarees/:sareeId/reviews
 * Get all reviews for a saree (public endpoint)
 */
export const getReviews = async (req: Request, res: Response) => {
  try {
    const { sareeId } = req.params;
    const { sort = 'recent', limit = 10, page = 1 } = req.query;

    // ✅ Determine sort order
    let sortObj: any = { createdAt: -1 };
    if (sort === 'helpful') sortObj = { helpful: -1, createdAt: -1 };
    if (sort === 'rating-high') sortObj = { rating: -1 };
    if (sort === 'rating-low') sortObj = { rating: 1 };

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    // ✅ Fetch reviews
    const reviews = await Review.find({
      sareeId,
      isApproved: true,
    })
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .select('-helpfulBy') // Don't send helpfulBy array to client
      .lean();

    // ✅ Get total count
    const total = await Review.countDocuments({
      sareeId,
      isApproved: true,
    });

    res.json({
      success: true,
      data: reviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
    });
  }
};

/**
 * PUT /api/sarees/:sareeId/reviews/:reviewId
 * Update own review
 */
export const updateReview = async (req: Request, res: Response) => {
  try {
    const { sareeId, reviewId } = req.params;
    const { rating, title, comment } = req.body;
    const userId = (req as any).user._id;

    // ✅ Find review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // ✅ Check authorization
    if (review.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own reviews',
      });
    }

    // ✅ Validate input
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    if (title && (title.length < 5 || title.length > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Title must be between 5 and 100 characters',
      });
    }

    if (comment && (comment.length < 10 || comment.length > 1000)) {
      return res.status(400).json({
        success: false,
        message: 'Comment must be between 10 and 1000 characters',
      });
    }

    // ✅ Update review
    if (rating) review.rating = rating;
    if (title) review.title = title.trim();
    if (comment) review.comment = comment.trim();

    await review.save();

    // ✅ Update saree ratings
    await updateSareeRatings(sareeId);

    console.log(`✅ Review ${reviewId} updated`);

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: review,
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
    });
  }
};

/**
 * DELETE /api/sarees/:sareeId/reviews/:reviewId
 * Delete review (user or admin)
 */
export const deleteReview = async (req: Request, res: Response) => {
  try {
    const { sareeId, reviewId } = req.params;
    const userId = (req as any).user._id;
    const userRole = (req as any).user.role;

    // ✅ Find review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // ✅ Check authorization
    const isAuthor = review.userId.toString() === userId.toString();
    const isAdmin = userRole === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reviews',
      });
    }

    // ✅ Delete review
    await Review.findByIdAndDelete(reviewId);

    // ✅ Update saree ratings
    await updateSareeRatings(sareeId);

    // ✅ Log deletion
    console.log(`✅ Review ${reviewId} deleted by ${isAdmin ? 'admin' : 'user'}`);

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
    });
  }
};

/**
 * PATCH /api/sarees/:sareeId/reviews/:reviewId/helpful
 * Mark review as helpful
 */
export const markHelpful = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const userId = (req as any).user?._id;

    // ✅ Find review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // ✅ If user is authenticated, prevent duplicate helpful votes
    if (userId) {
      if (review.helpfulBy.includes(userId)) {
        return res.status(400).json({
          success: false,
          message: 'You have already marked this review as helpful',
        });
      }
      review.helpfulBy.push(userId);
    }

    review.helpful += 1;
    await review.save();

    res.json({
      success: true,
      helpfulCount: review.helpful,
    });
  } catch (error) {
    console.error('Error marking helpful:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update helpful count',
    });
  }
};

/**
 * GET /api/admin/reviews
 * Get all reviews for admin moderation
 */
export const getAdminReviews = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status = 'all', sort = 'recent' } = req.query;

    // ✅ Build filter
    const filter: any = {};
    if (status === 'approved') filter.isApproved = true;
    if (status === 'pending') filter.isApproved = false;

    // ✅ Determine sort
    let sortObj: any = { createdAt: -1 };
    if (sort === 'rating-high') sortObj = { rating: -1 };
    if (sort === 'rating-low') sortObj = { rating: 1 };

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    // ✅ Fetch reviews
    const reviews = await Review.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .populate('sareeId', 'name');

    const total = await Review.countDocuments(filter);

    res.json({
      success: true,
      data: reviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
    });
  }
};

/**
 * PATCH /api/admin/reviews/:reviewId/approve
 * Approve or reject review (admin only)
 */
export const approveReview = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const { isApproved } = req.body;

    // ✅ Find and update review
    const review = await Review.findByIdAndUpdate(
      reviewId,
      { isApproved },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // ✅ Update saree ratings
    await updateSareeRatings(review.sareeId.toString());

    console.log(`✅ Review ${reviewId} ${isApproved ? 'approved' : 'rejected'}`);

    res.json({
      success: true,
      message: `Review ${isApproved ? 'approved' : 'rejected'} successfully`,
      data: review,
    });
  } catch (error) {
    console.error('Error approving review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review status',
    });
  }
};

/**
 * DELETE /api/admin/reviews/:reviewId
 * Admin delete review with reason
 */
export const adminDeleteReview = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const { reason = 'No reason provided', notifyUser = true } = req.body;

    // ✅ Find review
    const review = await Review.findByIdAndDelete(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // ✅ Update saree ratings
    await updateSareeRatings(review.sareeId.toString());

    // ✅ Log deletion with reason
    console.log(`🗑️ Review ${reviewId} deleted by admin. Reason: ${reason}`);

    // TODO: Send notification email to user if notifyUser is true

    res.json({
      success: true,
      message: 'Review deleted successfully',
      reason,
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
    });
  }
};

export default {
  createReview,
  getReviews,
  updateReview,
  deleteReview,
  markHelpful,
  getAdminReviews,
  approveReview,
  adminDeleteReview,
};