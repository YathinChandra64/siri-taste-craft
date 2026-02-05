import express, { Router } from 'express';
import {
  createReview,
  getReviews,
  updateReview,
  deleteReview,
  markHelpful,
  getAdminReviews,
  approveReview,
  adminDeleteReview,
} from '../controllers/reviewController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

/**
 * Review Routes
 * All routes related to saree reviews
 */

const router: Router = express.Router();

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

/**
 * GET /api/sarees/:sareeId/reviews
 * Get all approved reviews for a saree
 */
router.get('/sarees/:sareeId/reviews', getReviews);

/**
 * PATCH /api/sarees/:sareeId/reviews/:reviewId/helpful
 * Mark review as helpful (public endpoint)
 * Optional: User can be authenticated to prevent duplicate votes
 */
router.patch('/sarees/:sareeId/reviews/:reviewId/helpful', markHelpful);

// ============================================
// AUTHENTICATED ROUTES (User logged in)
// ============================================

/**
 * POST /api/sarees/:sareeId/reviews
 * Create a new review (must be verified buyer)
 * Headers: Authorization: Bearer {token}
 */
router.post('/sarees/:sareeId/reviews', authenticate, createReview);

/**
 * PUT /api/sarees/:sareeId/reviews/:reviewId
 * Update own review
 * Headers: Authorization: Bearer {token}
 */
router.put('/sarees/:sareeId/reviews/:reviewId', authenticate, updateReview);

/**
 * DELETE /api/sarees/:sareeId/reviews/:reviewId
 * Delete own review (author only)
 * Headers: Authorization: Bearer {token}
 */
router.delete('/sarees/:sareeId/reviews/:reviewId', authenticate, deleteReview);

// ============================================
// ADMIN ROUTES (Admin only)
// ============================================

/**
 * GET /api/admin/reviews
 * Get all reviews for moderation (admin only)
 * Headers: Authorization: Bearer {admin-token}
 * Query: page, limit, status (all/approved/pending), sort
 */
router.get(
  '/admin/reviews',
  authenticate,
  authorize('admin'),
  getAdminReviews
);

/**
 * PATCH /api/admin/reviews/:reviewId/approve
 * Approve or reject review (admin only)
 * Headers: Authorization: Bearer {admin-token}
 * Body: { isApproved: boolean }
 */
router.patch(
  '/admin/reviews/:reviewId/approve',
  authenticate,
  authorize('admin'),
  approveReview
);

/**
 * DELETE /api/admin/reviews/:reviewId
 * Delete review with reason (admin only)
 * Headers: Authorization: Bearer {admin-token}
 * Body: { reason: string, notifyUser: boolean }
 */
router.delete(
  '/admin/reviews/:reviewId',
  authenticate,
  authorize('admin'),
  adminDeleteReview
);

export default router;