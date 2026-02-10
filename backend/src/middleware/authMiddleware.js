import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Authentication & Authorization Middleware
 * Handles JWT verification and role-based access control
 */

/**
 * Authenticate middleware (alias: protect)
 * Verifies JWT token and adds user to request
 */
export const authenticate = async (req, res, next) => {
  try {
    // ✅ Get token from header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided',
      });
    }

    // ✅ Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    );

    // ✅ Get user from database
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // ✅ Attach user to request
    req.user = user;

    console.log(`✅ User authenticated: ${user.email}`);
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }

    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

/**
 * Protect middleware (alias for authenticate)
 * Used in routes for backward compatibility
 */
export const protect = authenticate;

/**
 * Authorize middleware
 * Checks if user has required role
 */
export const authorize = (requiredRole) => {
  return (req, res, next) => {
    try {
      // ✅ Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Please log in first',
        });
      }

      // ✅ Check user role
      if (req.user.role !== requiredRole) {
        console.warn(
          `⚠️ Unauthorized access attempt: ${req.user.email} tried to access ${requiredRole} resource`
        );

        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this resource',
        });
      }

      console.log(`✅ Admin access: ${req.user.email}`);
      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(403).json({
        success: false,
        message: 'Authorization failed',
      });
    }
  };
};

/**
 * Admin-only middleware
 * Checks if user has admin role
 */
export const adminOnly = authorize('admin');

/**
 * Optional authentication middleware
 * User is not required, but will be attached if token is provided
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'your-secret-key'
        );

        const user = await User.findById(decoded.userId).select('-password');

        if (user) {
          req.user = user;
          console.log(`✅ Optional auth: User ${user.email} attached`);
        }
      } catch (error) {
        // Token is invalid, continue without user
        console.warn('⚠️ Optional auth: Invalid token, continuing without auth');
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next(); // Continue anyway for optional auth
  }
};

/**
 * Check ownership middleware
 * Verifies that user owns the resource
 */
export const checkOwnership = (resourceField = 'userId') => {
  return async (req, res, next) => {
    try {
      const userId = req.user._id.toString();
      const resourceUserId = req.body[resourceField] || req.query[resourceField];

      if (userId !== resourceUserId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to modify this resource',
        });
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(403).json({
        success: false,
        message: 'Ownership verification failed',
      });
    }
  };
};

/**
 * Rate limiting middleware (simple implementation)
 * Prevents abuse by limiting requests per IP
 */
const requestCounts = new Map();

export const rateLimit = (maxRequests = 100, windowMs = 60000) => {
  return (req, res, next) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or create request list for this IP
    let requests = requestCounts.get(ip) || [];

    // Remove requests outside the window
    requests = requests.filter((timestamp) => timestamp > windowStart);

    // Check if limit exceeded
    if (requests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
      });
    }

    // Add current request
    requests.push(now);
    requestCounts.set(ip, requests);

    // Cleanup old IP entries (optional, for memory management)
    if (requestCounts.size > 10000) {
      for (const [key, reqs] of requestCounts.entries()) {
        if (reqs[reqs.length - 1] < windowStart) {
          requestCounts.delete(key);
        }
      }
    }

    next();
  };
};

/**
 * Input validation middleware
 * Sanitizes and validates input data
 */
export const validateInput = (schema) => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const details = error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message,
        }));

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: details,
        });
      }

      req.body = value;
      next();
    } catch (error) {
      console.error('Validation error:', error);
      res.status(400).json({
        success: false,
        message: 'Input validation failed',
      });
    }
  };
};

export default {
  authenticate,
  protect,
  authorize,
  adminOnly,
  optionalAuth,
  checkOwnership,
  rateLimit,
  validateInput,
};