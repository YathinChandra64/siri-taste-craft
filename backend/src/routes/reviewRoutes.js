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

    const reviews = await Review.find({ sareeId: id })
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
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
});

// ===============================
// POST new review
// ===============================
router.post("/:id/reviews", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, title, comment } = req.body;
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    if (!title?.trim() || title.trim().length < 5) {
      return res.status(400).json({ message: "Title must be at least 5 characters" });
    }

    if (!comment?.trim() || comment.trim().length < 10) {
      return res.status(400).json({ message: "Comment must be at least 10 characters" });
    }

    const existingReview = await Review.findOne({ userId, sareeId: id });
    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this saree" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const order = await Order.findOne({
      userId,
      "items.sareeId": id,
      status: { $in: ["delivered", "completed"] },
    });

    const isVerifiedBuyer = !!order;

    const newReview = new Review({
      userId,
      sareeId: id,
      orderId: order?._id,
      userName: user.name,
      userEmail: user.email,
      rating,
      title: title.trim(),
      comment: comment.trim(),
      isVerifiedBuyer,
      helpful: 0,
      helpfulBy: [],
    });

    await newReview.save();

    // Recalculate average rating
    const allReviews = await Review.find({ sareeId: id });
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / allReviews.length;

    await Saree.findByIdAndUpdate(id, {
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount: allReviews.length,
    });

    res.status(201).json(newReview);
  } catch (error) {
    console.error("Error creating review:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Failed to create review" });
  }
});

// ===============================
// DELETE review
// ===============================
router.delete("/:sareeId/reviews/:reviewId", authenticate, async (req, res) => {
  try {
    const { sareeId, reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.userId.toString() !== userId) {
      return res.status(403).json({ message: "You can only delete your own reviews" });
    }

    await review.deleteOne();

    const allReviews = await Review.find({ sareeId });

    if (allReviews.length > 0) {
      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / allReviews.length;

      await Saree.findByIdAndUpdate(sareeId, {
        averageRating: Math.round(averageRating * 10) / 10,
        reviewCount: allReviews.length,
      });
    } else {
      await Saree.findByIdAndUpdate(sareeId, {
        averageRating: 0,
        reviewCount: 0,
      });
    }

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Failed to delete review" });
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
        return res.status(404).json({ message: "Review not found" });
      }

      res.json({ helpful: review.helpful });
    } catch (error) {
      console.error("Error updating helpful count:", error);
      res.status(500).json({ message: "Failed to update helpful count" });
    }
  }
);

export default router;
