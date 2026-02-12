import express from 'express';
import { authenticate, adminOnly } from '../middleware/authMiddleware.js';
import {
  placeOrder,
  getMyOrders,
  getOrderDetails,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  verifyPayment,
  getOrderStats
} from '../controllers/orderController.js';

import {
  updateOrderStatusWithTimeline,
  getOrderWithTimeline,
  updateShippingInfo,
  getOrderTracking,
  batchUpdateOrderStatus,
  getEnhancedOrderStats
} from '../controllers/orderController.js';

const router = express.Router();

// ======================================
// CUSTOMER ROUTES (require authentication)
// ======================================

/**
 * @route   POST /api/orders
 * @desc    Place a new order
 * @access  Private (Customer)
 */
router.post('/', authenticate, placeOrder);

/**
 * @route   GET /api/orders
 * @desc    Get all orders for the logged-in user
 * @access  Private (Customer)
 */
router.get('/', authenticate, getMyOrders);

/**
 * @route   GET /api/orders/my-orders
 * @desc    Get all orders for the logged-in user (alias for backward compatibility)
 * @access  Private (Customer)
 */
router.get('/my-orders', authenticate, getMyOrders);

/**
 * @route   GET /api/orders/:id
 * @desc    Get order details by ID for logged-in user
 * @access  Private (Customer)
 */
router.get('/:id', authenticate, getOrderDetails);

/**
 * @route   POST /api/orders/:id/cancel
 * @desc    Cancel an order
 * @access  Private (Customer)
 */
router.post('/:id/cancel', authenticate, cancelOrder);

// ======================================
// ADMIN ROUTES (require admin authorization)
// ======================================

/**
 * @route   GET /api/orders/admin/all
 * @desc    Get all orders (Admin only)
 * @access  Private (Admin)
 */
router.get('/admin/all', authenticate, adminOnly, getAllOrders);

/**
 * @route   GET /api/orders/admin/stats
 * @desc    Get order statistics (Admin only)
 * @access  Private (Admin)
 */
router.get('/admin/stats', authenticate, adminOnly, getOrderStats);

/**
 * @route   GET /api/orders/admin/:id
 * @desc    Get any order by ID (Admin only)
 * @access  Private (Admin)
 */
router.get('/admin/:id', authenticate, adminOnly, getOrderById);

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Update order status (Admin only)
 * @access  Private (Admin)
 */
router.put('/:id/status', authenticate, adminOnly, updateOrderStatus);

/**
 * @route   PUT /api/orders/:id/verify-payment
 * @desc    Verify payment status (Admin only)
 * @access  Private (Admin)
 */
router.put('/:id/verify-payment', authenticate, adminOnly, verifyPayment);

router.put('/:id/status-timeline', authenticate, adminOnly, updateOrderStatusWithTimeline);
router.put('/:id/shipping', authenticate, adminOnly, updateShippingInfo);
router.get('/:id/timeline', authenticate, getOrderWithTimeline);
router.get('/:id/tracking', authenticate, getOrderTracking);
router.post('/admin/batch-update', authenticate, adminOnly, batchUpdateOrderStatus);
router.get('/admin/stats/enhanced', authenticate, adminOnly, getEnhancedOrderStats);

export default router;