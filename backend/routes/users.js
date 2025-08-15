const express = require('express');
const User = require('../models/User');
const { protect, authorize, checkVerified } = require('../middleware/auth');

const router = express.Router();

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('wishlist', 'name price images category')
      .populate('purchaseHistory.product', 'name category aesthetic images');

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting profile'
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, aestheticPreference, sizePreferences } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (aestheticPreference) updateData.aestheticPreference = aestheticPreference;
    if (sizePreferences) updateData.sizePreferences = sizePreferences;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
});

// @desc    Add address
// @route   POST /api/users/addresses
// @access  Private
router.post('/addresses', protect, async (req, res) => {
  try {
    const { type, fullName, street, city, state, zipCode, country, phone, isDefault } = req.body;

    const user = await User.findById(req.user.id);

    // If this is set as default, make all others non-default
    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    user.addresses.push({
      type,
      fullName,
      street,
      city,
      state,
      zipCode,
      country,
      phone,
      isDefault
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      addresses: user.addresses
    });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding address'
    });
  }
});

// @desc    Add item to wishlist
// @route   POST /api/users/wishlist/:productId
// @access  Private
router.post('/wishlist/:productId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.wishlist.includes(req.params.productId)) {
      return res.status(400).json({
        success: false,
        message: 'Item already in wishlist'
      });
    }

    user.wishlist.push(req.params.productId);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Item added to wishlist',
      wishlist: user.wishlist
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding to wishlist'
    });
  }
});

// @desc    Remove item from wishlist
// @route   DELETE /api/users/wishlist/:productId
// @access  Private
router.delete('/wishlist/:productId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    user.wishlist = user.wishlist.filter(
      item => item.toString() !== req.params.productId
    );
    
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Item removed from wishlist',
      wishlist: user.wishlist
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error removing from wishlist'
    });
  }
});

// @desc    Get sustainability stats
// @route   GET /api/users/sustainability-stats
// @access  Private
router.get('/sustainability-stats', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    const stats = {
      sustainabilityPoints: user.sustainabilityPoints,
      totalSustainableItems: user.totalSustainableItems,
      co2Saved: user.co2Saved,
      level: calculateSustainabilityLevel(user.sustainabilityPoints),
      nextLevelPoints: calculateNextLevelPoints(user.sustainabilityPoints),
      achievements: calculateAchievements(user)
    };

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get sustainability stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting sustainability stats'
    });
  }
});

// Helper functions
const calculateSustainabilityLevel = (points) => {
  if (points >= 5000) return 'Eco Champion';
  if (points >= 2500) return 'Sustainability Star';
  if (points >= 1000) return 'Green Guardian';
  if (points >= 500) return 'Eco Warrior';
  if (points >= 100) return 'Green Beginner';
  return 'Eco Explorer';
};

const calculateNextLevelPoints = (points) => {
  const levels = [100, 500, 1000, 2500, 5000];
  for (let level of levels) {
    if (points < level) {
      return level - points;
    }
  }
  return 0;
};

const calculateAchievements = (user) => {
  const achievements = [];
  
  if (user.totalSustainableItems >= 1) achievements.push('First Sustainable Purchase');
  if (user.totalSustainableItems >= 10) achievements.push('Thrift Explorer');
  if (user.totalSustainableItems >= 25) achievements.push('Sustainable Shopper');
  if (user.totalSustainableItems >= 50) achievements.push('Eco Champion');
  if (user.sustainabilityPoints >= 1000) achievements.push('Points Master');
  if (user.co2Saved >= 10) achievements.push('Carbon Saver');

  return achievements;
};

module.exports = router;
