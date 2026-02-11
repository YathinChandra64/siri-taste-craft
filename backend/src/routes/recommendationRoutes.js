import express from 'express';
import Saree from '../models/Saree.js';

const router = express.Router();

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

    const query = {};

    if (exclude) {
      query._id = { $ne: exclude };
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

    pipeline.push({ $limit: parseInt(limit) });

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

    res.json(recommendations);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ message: 'Failed to fetch recommendations' });
  }
});

export default router;
