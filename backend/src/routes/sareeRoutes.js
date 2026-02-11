import express, { Router } from 'express';
import {
  getSarees,
  getSareeById,
  createSaree,
  updateSaree,
  deleteSaree,
  getTopRatedSarees,
} from '../controllers/sareeController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

/**
 * Saree Routes
 * All routes related to saree products
 */

const router = express.Router();

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

/**
 * GET /api/sarees
 * Get all sarees with pagination, filtering, and sorting
 * 
 * Query Parameters:
 *   - page: number (default: 1)
 *   - limit: number (default: 8, max: 50)
 *   - sort: 'newest' | 'price-low' | 'price-high' | 'rating'
 *   - category: string or array
 *   - material: string or array
 *   - occasion: string or array
 *   - color: string or array
 *   - minPrice: number
 *   - maxPrice: number
 *   - minRating: number
 *   - availability: 'in-stock' | 'out-of-stock'
 *   - search: string (full-text search)
 */
router.get('/', getSarees);

/**
 * 🔧 FIX #1: ROUTE ORDERING - Specific routes MUST come before generic /:id route
 * GET /api/sarees/stats/top-rated
 * Get top-rated sarees
 * Query: limit (default: 10)
 */
router.get('/stats/top-rated', getTopRatedSarees);

/**
 * GET /api/sarees/:id
 * Get a single saree by ID
 * ⚠️ IMPORTANT: This must come AFTER all specific routes like /stats/top-rated
 */
router.get('/:id', getSareeById);

// ============================================
// ADMIN ROUTES (Authentication required)
// ============================================

/**
 * POST /api/sarees
 * Create a new saree (admin only)
 * Headers: Authorization: Bearer {admin-token}
 * Body: { name, price, category, material, color, occasion, stock, imageUrl, description, blousePrice, length }
 */
router.post('/', authenticate, authorize('admin'), createSaree);

/**
 * PUT /api/sarees/:id
 * Update a saree (admin only)
 * Headers: Authorization: Bearer {admin-token}
 */
router.put('/:id', authenticate, authorize('admin'), updateSaree);

/**
 * DELETE /api/sarees/:id
 * Delete a saree (admin only)
 * Headers: Authorization: Bearer {admin-token}
 */
router.delete('/:id', authenticate, authorize('admin'), deleteSaree);

export default router;