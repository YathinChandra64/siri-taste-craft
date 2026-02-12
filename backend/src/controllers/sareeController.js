import Saree from '../models/Saree.js';

/**
 * Saree Controller
 * Handles saree listing, filtering, and pagination
 */

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Build filter query based on parameters
 */
const buildFilterQuery = (queryParams) => {
  const filter = {};

  // Price range filter
  if (queryParams.minPrice || queryParams.maxPrice) {
    filter.price = {};
    if (queryParams.minPrice) {
      filter.price.$gte = Number(queryParams.minPrice);
    }
    if (queryParams.maxPrice) {
      filter.price.$lte = Number(queryParams.maxPrice);
    }
  }

  // Category filter
  if (queryParams.category && queryParams.category !== 'All') {
    if (Array.isArray(queryParams.category)) {
      filter.category = { $in: queryParams.category };
    } else {
      filter.category = queryParams.category;
    }
  }

  // Material filter
  if (queryParams.material) {
    if (Array.isArray(queryParams.material)) {
      filter.material = { $in: queryParams.material };
    } else {
      filter.material = queryParams.material;
    }
  }

  // Occasion filter
  if (queryParams.occasion) {
    if (Array.isArray(queryParams.occasion)) {
      filter.occasion = { $in: queryParams.occasion };
    } else {
      filter.occasion = queryParams.occasion;
    }
  }

  // Color filter
  if (queryParams.color) {
    if (Array.isArray(queryParams.color)) {
      filter.color = { $in: queryParams.color };
    } else {
      filter.color = queryParams.color;
    }
  }

  // Availability filter - Check both main stock and color variants
  if (queryParams.availability) {
    if (Array.isArray(queryParams.availability)) {
      // For array availability, use $or to check main stock OR any color variant stock
      const availabilityConditions = [];
      
      if (queryParams.availability.includes('in-stock')) {
        availabilityConditions.push(
          { stock: { $gt: 0 } },
          { 'colorVariants.stock': { $gt: 0 } }
        );
      }
      if (queryParams.availability.includes('out-of-stock')) {
        availabilityConditions.push({
          $and: [
            { stock: { $eq: 0 } },
            { $nor: [{ 'colorVariants.stock': { $gt: 0 } }] }
          ]
        });
      }
      
      if (availabilityConditions.length > 0) {
        filter.$or = availabilityConditions;
      }
    } else if (queryParams.availability === 'in-stock') {
      filter.$or = [
        { stock: { $gt: 0 } },
        { 'colorVariants.stock': { $gt: 0 } }
      ];
    } else if (queryParams.availability === 'out-of-stock') {
      filter.$and = [
        { stock: { $eq: 0 } },
        { $nor: [{ 'colorVariants.stock': { $gt: 0 } }] }
      ];
    }
  }

  // Rating filter
  if (queryParams.minRating) {
    filter.averageRating = { $gte: Number(queryParams.minRating) };
  }

  // Search filter (text search in name and description)
  if (queryParams.search) {
    filter.$text = { $search: queryParams.search };
  }

  return filter;
};

/**
 * Determine sort order
 */
const buildSortQuery = (sortBy) => {
  const sortMap = {
    'price-low': { price: 1 },
    'price-high': { price: -1 },
    rating: { averageRating: -1 },
    newest: { createdAt: -1 },
  };

  return sortMap[sortBy] || { createdAt: -1 }; // Default to newest
};

/**
 * 🔧 FIX #4: Validate MongoDB ObjectId format
 * MongoDB ObjectIds must be 24 character hex strings
 */
const isValidObjectId = (id) => {
  return /^[0-9a-f]{24}$/i.test(id);
};

// ============================================
// CONTROLLER METHODS
// ============================================

/**
 * GET /api/sarees
 * Get all sarees with pagination, filtering, and sorting
 * 
 * Query Parameters:
 *   - page (number, default: 1)
 *   - limit (number, default: 8, max: 50)
 *   - sort (string: newest, price-low, price-high, rating)
 *   - category (string or array)
 *   - material (string or array)
 *   - occasion (string or array)
 *   - color (string or array)
 *   - minPrice (number)
 *   - maxPrice (number)
 *   - minRating (number)
 *   - availability (string or array: in-stock, out-of-stock)
 *   - search (string)
 */
export const getSarees = async (req, res) => {
  try {
    const {
      page = '1',
      limit = '8',
      sort = 'newest',
      category,
      material,
      occasion,
      color,
      minPrice,
      maxPrice,
      minRating,
      availability,
      search,
    } = req.query;

    // ✅ Validate pagination parameters
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 8));
    const skip = (pageNum - 1) * limitNum;

    // ✅ Build filter query
    const filter = buildFilterQuery({
      minPrice,
      maxPrice,
      category,
      material,
      occasion,
      color,
      minRating,
      availability,
      search,
    });

    // ✅ Build sort query
    const sortQuery = buildSortQuery(sort);

    // ✅ Execute query with pagination
    const sarees = await Saree.find(filter)
      .sort(sortQuery)
      .skip(skip)
      .limit(limitNum)
      .select('-ratingDistribution'); // Don't send distribution to client initially

    // ✅ Get total count for pagination
    const total = await Saree.countDocuments(filter);
    const pages = Math.ceil(total / limitNum);

    // ✅ Log query
    console.log(`📊 Sarees query: page=${pageNum}, limit=${limitNum}, sort=${sort}, results=${sarees.length}`);

    res.json({
      success: true,
      data: sarees,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages,
      },
    });
  } catch (error) {
    console.error('Error fetching sarees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sarees',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * GET /api/sarees/:id
 * Get a single saree by ID with full details
 * 
 * 🔧 FIX: Added ObjectId validation to prevent CastError
 */
export const getSareeById = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ FIX #4: Validate ObjectId format before querying
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid saree ID format',
      });
    }

    // ✅ Find saree
    const saree = await Saree.findById(id);

    if (!saree) {
      return res.status(404).json({
        success: false,
        message: 'Saree not found',
      });
    }

    console.log(`🔍 Saree ${id} viewed`);

    res.json({
      success: true,
      data: saree,
    });
  } catch (error) {
    console.error('Error fetching saree:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch saree',
    });
  }
};

/**
 * POST /api/sarees (Admin only)
 * Create a new saree
 */
export const createSaree = async (req, res) => {
  try {
    const {
      name,
      price,
      category,
      material,
      color,
      occasion,
      stock,
      imageUrl,
      description,
      blousePrice,
      length,
    } = req.body;

    // ✅ Validate required fields
    if (!name || !price || !category || !imageUrl || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, price, category, imageUrl, description',
      });
    }

    // ✅ Create saree
    const saree = new Saree({
      name,
      price,
      category,
      material,
      color,
      occasion,
      stock,
      imageUrl,
      description,
      blousePrice,
      length,
    });

    await saree.save();

    console.log(`✅ Saree created: ${name}`);

    res.status(201).json({
      success: true,
      message: 'Saree created successfully',
      data: saree,
    });
  } catch (error) {
    console.error('Error creating saree:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create saree',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * PUT /api/sarees/:id (Admin only)
 * Update a saree
 * 
 * 🔧 FIX: Added ObjectId validation
 */
export const updateSaree = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // ✅ FIX #4: Validate ObjectId format before querying
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid saree ID format',
      });
    }

    // ✅ Prevent updating ratings/counts
    delete updates.averageRating;
    delete updates.reviewCount;
    delete updates.ratingDistribution;

    // ✅ Update saree
    const saree = await Saree.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!saree) {
      return res.status(404).json({
        success: false,
        message: 'Saree not found',
      });
    }

    console.log(`✏️ Saree ${id} updated`);

    res.json({
      success: true,
      message: 'Saree updated successfully',
      data: saree,
    });
  } catch (error) {
    console.error('Error updating saree:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update saree',
    });
  }
};

/**
 * DELETE /api/sarees/:id (Admin only)
 * Delete a saree
 * 
 * 🔧 FIX: Added ObjectId validation
 */
export const deleteSaree = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ FIX #4: Validate ObjectId format before querying
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid saree ID format',
      });
    }

    // ✅ Delete saree
    const saree = await Saree.findByIdAndDelete(id);

    if (!saree) {
      return res.status(404).json({
        success: false,
        message: 'Saree not found',
      });
    }

    // TODO: Also delete associated reviews

    console.log(`🗑️ Saree ${id} deleted`);

    res.json({
      success: true,
      message: 'Saree deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting saree:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete saree',
    });
  }
};

/**
 * GET /api/sarees/stats/top-rated
 * Get top-rated sarees
 */
export const getTopRatedSarees = async (req, res) => {
  try {
    const { limit = '10' } = req.query;

    const sarees = await Saree.find({ reviewCount: { $gt: 0 } })
      .sort({ averageRating: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      data: sarees,
    });
  } catch (error) {
    console.error('Error fetching top-rated sarees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top-rated sarees',
    });
  }
};

export default {
  getSarees,
  getSareeById,
  createSaree,
  updateSaree,
  deleteSaree,
  getTopRatedSarees,
};