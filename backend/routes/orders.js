const express = require('express');
const Order = require('../models/Order');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { orderItems, shippingAddress, paymentInfo, pricing } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No order items provided'
      });
    }

    // Calculate sustainability points for each item
    const itemsWithPoints = orderItems.map(item => ({
      ...item,
      sustainabilityPoints: calculateItemSustainabilityPoints(item)
    }));

    const order = new Order({
      user: req.user.id,
      orderItems: itemsWithPoints,
      shippingAddress,
      paymentInfo,
      pricing,
      sustainability: {
        totalPointsEarned: itemsWithPoints.reduce((total, item) => 
          total + (item.sustainabilityPoints * item.quantity), 0
        )
      }
    });

    await order.save();

    // Update user's sustainability points
    const user = await User.findById(req.user.id);
    user.sustainabilityPoints += order.sustainability.totalPointsEarned;
    user.totalSustainableItems += orderItems.reduce((total, item) => total + item.quantity, 0);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating order'
    });
  }
});

// @desc    Get user orders
// @route   GET /api/orders
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('orderItems.product', 'name images')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting orders'
    });
  }
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('orderItems.product', 'name images');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get single order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting order'
    });
  }
});

// Helper function to calculate sustainability points
const calculateItemSustainabilityPoints = (item) => {
  const basePoints = Math.floor(item.price / 100) * 10; // 10 points per ₹100
  return basePoints;
};

module.exports = router;
