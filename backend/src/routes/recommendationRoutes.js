import express from 'express';
import Saree from '../models/Saree.js';

const router = express.Router();

/**
 * 🔧 FIX #2: RECOMMENDATIONS ROUTE
 * GET /api/sarees/recommendations
 * Get recommended sarees based on filters
 * 
 * Query Parameters:
 *   - category: string
 *   - fabric: string
 *   - minPrice: number
 *   - maxPrice: number
 *   - tags: string
 *   - exclude: MongoDB ObjectId (exclude this saree from results)
 *   - limit: number (default: 8)
 */
router.get('/recommendations', async (req, res) => {
  try {
    const {
      category,
      fabric,
      minPrice,
      maxPrice,
      tags,
      exclude,
      limit = '8',
    } = req.query;

    // ✅ Validate limit parameter
    const parsedLimit = Math.min(Math.max(1, parseInt(limit) || 8), 100);

    const query = {};

    // ✅ FIX: Validate exclude parameter - must be valid MongoDB ObjectId format
    if (exclude) {
      // Check if it's a valid MongoDB ObjectId (24 character hex string)
      if (/^[0-9a-f]{24}$/i.test(exclude)) {
        query._id = { $ne: exclude };
      } else {
        console.warn(`⚠️ Invalid exclude ID format: ${exclude}`);
        // Continue without exclusion if invalid format
      }
    }

    if (category) {
      query.category = category;
    }

    const pipeline = [{ $match: query }];

    pipeline.push({
      $addFields: {
        score: {
          $add: [
            { $cond: [{ $eq: ['$category', category] }, 50, 0] },
            { $cond: [{ $eq: ['$fabric', fabric] }, 30, 0] },
            {
              $cond: [
                {
                  $and: [
                    { $gte: ['$price', parseFloat(minPrice || '0')] },
                    { $lte: ['$price', parseFloat(maxPrice || '999999')] },
                  ],
                },
                20,
                0,
              ],
            },
            { $multiply: [{ $ifNull: ['$averageRating', 0] }, 2] },
            { $min: [{ $divide: [{ $ifNull: ['$reviewCount', 0] }, 10] }, 5] },
          ],
        },
      },
    });

    pipeline.push({ $sort: { score: -1, averageRating: -1, reviewCount: -1 } });

    pipeline.push({ $limit: parsedLimit });

    pipeline.push({
      $project: {
        _id: 1,
        name: 1,
        price: 1,
        category: 1,
        imageUrl: 1,
        averageRating: 1,
        reviewCount: 1,
        fabric: 1,
        tags: 1,
        stock: 1,
        score: 1,
      },
    });

    const recommendations = await Saree.aggregate(pipeline);

    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
    });
  } catch (error) {
    console.error('❌ Error fetching recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default router;