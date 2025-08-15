const express = require('express');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all products with filtering and pagination
// @route   GET /api/products
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build filter object
    let filter = { isActive: true };

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.aesthetic) {
      filter.aesthetic = req.query.aesthetic;
    }

    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
    }

    if (req.query.condition) {
      filter['sustainability.condition'] = req.query.condition;
    }

    if (req.query.size) {
      filter['sizes.size'] = req.query.size;
    }

    // Search functionality
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    // Sort options
    let sort = { createdAt: -1 };
    if (req.query.sort) {
      switch (req.query.sort) {
        case 'price-asc':
          sort = { price: 1 };
          break;
        case 'price-desc':
          sort = { price: -1 };
          break;
        case 'sustainability':
          sort = { 'sustainability.rating': -1 };
          break;
        case 'popular':
          sort = { views: -1 };
          break;
        case 'newest':
          sort = { createdAt: -1 };
          break;
      }
    }

    const products = await Product.find(filter)
      .populate('seller', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting products'
    });
  }
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const products = await Product.find({ 
      isActive: true, 
      isFeatured: true 
    })
    .populate('seller', 'name')
    .limit(16)
    .sort({ views: -1 });

    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting featured products'
    });
  }
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name avatar thriftStore')
      .populate('reviews.user', 'name avatar');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Increment view count
    product.views += 1;
    await product.save();

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get single product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting product'
    });
  }
});

// @desc    Get similar products
// @route   GET /api/products/:id/similar
// @access  Public
router.get('/:id/similar', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const similarProducts = await Product.find({
      _id: { $ne: product._id },
      $or: [
        { category: product.category },
        { aesthetic: product.aesthetic },
        { tags: { $in: product.tags } }
      ],
      isActive: true
    })
    .populate('seller', 'name')
    .limit(8)
    .sort({ views: -1 });

    res.status(200).json({
      success: true,
      data: similarProducts
    });
  } catch (error) {
    console.error('Get similar products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting similar products'
    });
  }
});

// @desc    Add product review
// @route   POST /api/products/:id/reviews
// @access  Private
router.post('/:id/reviews', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user already reviewed
    const existingReview = product.reviews.find(
      review => review.user.toString() === req.user.id
    );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    const review = {
      user: req.user.id,
      name: req.user.name,
      rating: parseInt(rating),
      comment
    };

    product.reviews.push(review);
    product.calculateAverageRating();

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      review
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding review'
    });
  }
});

// @desc    Get product categories and aesthetics
// @route   GET /api/products/filters/options
// @access  Public
router.get('/filters/options', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    const aesthetics = await Product.distinct('aesthetic');
    const conditions = await Product.distinct('sustainability.condition');
    
    // Get price range
    const priceRange = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      filters: {
        categories,
        aesthetics,
        conditions,
        priceRange: priceRange[0] || { minPrice: 0, maxPrice: 10000 }
      }
    });
  } catch (error) {
    console.error('Get filter options error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting filter options'
    });
  }
});

module.exports = router;
