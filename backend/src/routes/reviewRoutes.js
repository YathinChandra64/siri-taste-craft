import express from "express";
import Saree from "../models/Saree.js";
import Review from "../models/Review.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// ===============================
// GET reviews for a saree
// ===============================
router.get("/:id/reviews", async (req, res) => {
  try {
    const { id } = req.params;

    const reviews = await Review.find({ sareeId: id, isApproved: true })
      .sort({ createdAt: -1 });

    const formattedReviews = reviews.map((review) => ({
      _id: review._id,
      userId: review.userId,
      userName: review.userName,
      userEmail: review.userEmail,
      orderId: review.orderId,
      sareeId: review.sareeId,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      isVerifiedBuyer: review.isVerifiedBuyer,
      helpful: review.helpful || 0,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    }));

    res.json(formattedReviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch reviews" 
    });
  }
});

// ===============================
// POST new review
// ===============================
router.post("/:id/reviews", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, title, comment } = req.body;
    
    const userId = req.user._id || req.user.id;

    // ✅ Validation
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false,
        message: "Rating must be between 1 and 5" 
      });
    }

    if (!title?.trim() || title.trim().length < 5) {
      return res.status(400).json({ 
        success: false,
        message: "Title must be at least 5 characters" 
      });
    }

    if (!comment?.trim() || comment.trim().length < 10) {
      return res.status(400).json({ 
        success: false,
        message: "Comment must be at least 10 characters" 
      });
    }

    // ✅ Check if saree exists
    const saree = await Saree.findById(id);
    if (!saree) {
      return res.status(404).json({ 
        success: false,
        message: "Saree not found" 
      });
    }

    // ✅ Check for existing review (prevent duplicates)
    const existingReview = await Review.findOne({ userId, sareeId: id });
    if (existingReview) {
      return res.status(409).json({ 
        success: false,
        message: "You have already reviewed this saree" 
      });
    }

    // ✅ Get user details - User is already in req.user from authentication
    const user = req.user;
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "Authentication failed. Please log in again." 
      });
    }

    // ✅ Check if user has PURCHASED this saree
    const order = await Order.findOne({
      userId,
      "items.product": id,
      status: { $in: ["delivered", "completed"] },
    });

    // ✅ ENFORCE purchase requirement
    if (!order) {
      return res.status(403).json({ 
        success: false,
        message: "🛍️ You can only review this saree after you've purchased and received it. Thank you for your interest!" 
      });
    }

    const isVerifiedBuyer = true;

    // ✅ Create review with all required fields
    const newReview = new Review({
      userId,
      sareeId: id,
      orderId: order._id,
      userName: user.name || user.email,
      userEmail: user.email,
      rating,
      title: title.trim(),
      comment: comment.trim(),
      isVerifiedBuyer,
      isApproved: true,
      helpful: 0,
      helpfulBy: [],
    });

    await newReview.save();

    // ✅ Update saree ratings
    const allReviews = await Review.find({ sareeId: id, isApproved: true });
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / allReviews.length;

    // ✅ Calculate rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allReviews.forEach((r) => {
      distribution[r.rating]++;
    });

    await Saree.findByIdAndUpdate(id, {
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount: allReviews.length,
      ratingDistribution: distribution,
    });

    console.log(`✅ Review created by ${user.name} for saree ${id}`);

    res.status(201).json({
      success: true,
      message: "✅ Review posted successfully!",
      data: newReview,
    });
  } catch (error) {
    console.error("❌ Error creating review:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({ 
        success: false,
        message: error.message 
      });
    }

    res.status(500).json({ 
      success: false,
      message: "Failed to create review",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===============================
// DELETE review
// ===============================
router.delete("/:sareeId/reviews/:reviewId", authenticate, async (req, res) => {
  try {
    const { sareeId, reviewId } = req.params;
    const userId = req.user._id || req.user.id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ 
        success: false,
        message: "Review not found" 
      });
    }

    // ✅ Check authorization
    if (review.userId.toString() !== userId.toString()) {
      return res.status(403).json({ 
        success: false,
        message: "You can only delete your own reviews" 
      });
    }

    await review.deleteOne();

    // ✅ Update saree ratings
    const allReviews = await Review.find({ sareeId, isApproved: true });

    if (allReviews.length > 0) {
      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / allReviews.length;

      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      allReviews.forEach((r) => {
        distribution[r.rating]++;
      });

      await Saree.findByIdAndUpdate(sareeId, {
        averageRating: Math.round(averageRating * 10) / 10,
        reviewCount: allReviews.length,
        ratingDistribution: distribution,
      });
    } else {
      await Saree.findByIdAndUpdate(sareeId, {
        averageRating: 0,
        reviewCount: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      });
    }

    res.json({ 
      success: true,
      message: "Review deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to delete review" 
    });
  }
});

// ===============================
// Mark review helpful
// ===============================
router.post(
  "/:sareeId/reviews/:reviewId/helpful",
  authenticate,
  async (req, res) => {
    try {
      const { reviewId } = req.params;

      const review = await Review.findByIdAndUpdate(
        reviewId,
        { $inc: { helpful: 1 } },
        { new: true }
      );

      if (!review) {
        return res.status(404).json({ 
          success: false,
          message: "Review not found" 
        });
      }

      res.json({ 
        success: true,
        helpful: review.helpful 
      });
    } catch (error) {
      console.error("Error updating helpful count:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to update helpful count" 
      });
    }
  }
);

export default router;