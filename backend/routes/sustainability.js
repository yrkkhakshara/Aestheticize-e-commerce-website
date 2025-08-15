const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get sustainability dashboard
// @route   GET /api/sustainability/dashboard
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    const stats = {
      sustainabilityPoints: user.sustainabilityPoints,
      totalSustainableItems: user.totalSustainableItems,
      co2Saved: user.co2Saved,
      level: calculateSustainabilityLevel(user.sustainabilityPoints),
      nextLevelPoints: calculateNextLevelPoints(user.sustainabilityPoints),
      achievements: calculateAchievements(user),
      impactMessage: generateImpactMessage(user)
    };

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get sustainability dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting sustainability dashboard'
    });
  }
});

// @desc    Get available rewards
// @route   GET /api/sustainability/rewards
// @access  Private
router.get('/rewards', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    const rewards = [
      {
        id: 1,
        name: '10% Off Next Purchase',
        description: 'Get 10% discount on your next order',
        pointsCost: 500,
        available: user.sustainabilityPoints >= 500,
        type: 'discount'
      },
      {
        id: 2,
        name: 'Free Eco-Friendly Tote Bag',
        description: 'Sustainable cotton tote bag',
        pointsCost: 750,
        available: user.sustainabilityPoints >= 750,
        type: 'product'
      },
      {
        id: 3,
        name: 'Priority Customer Support',
        description: 'Get priority access to customer support',
        pointsCost: 1000,
        available: user.sustainabilityPoints >= 1000,
        type: 'service'
      },
      {
        id: 4,
        name: '20% Off Mystery Box',
        description: 'Special discount on curated mystery boxes',
        pointsCost: 1250,
        available: user.sustainabilityPoints >= 1250,
        type: 'discount'
      },
      {
        id: 5,
        name: 'Plant a Tree',
        description: 'We will plant a tree in your name',
        pointsCost: 2000,
        available: user.sustainabilityPoints >= 2000,
        type: 'impact'
      }
    ];

    res.status(200).json({
      success: true,
      rewards,
      userPoints: user.sustainabilityPoints
    });
  } catch (error) {
    console.error('Get rewards error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting rewards'
    });
  }
});

// @desc    Redeem reward
// @route   POST /api/sustainability/redeem/:rewardId
// @access  Private
router.post('/redeem/:rewardId', protect, async (req, res) => {
  try {
    const rewardId = parseInt(req.params.rewardId);
    const user = await User.findById(req.user.id);

    // Define rewards (in production, store in database)
    const rewardCosts = {
      1: 500,  // 10% Off
      2: 750,  // Tote Bag
      3: 1000, // Priority Support
      4: 1250, // 20% Off Mystery Box
      5: 2000  // Plant a Tree
    };

    const pointsCost = rewardCosts[rewardId];
    
    if (!pointsCost) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }

    if (user.sustainabilityPoints < pointsCost) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient sustainability points'
      });
    }

    // Deduct points
    user.sustainabilityPoints -= pointsCost;
    await user.save();

    // Here you would typically:
    // 1. Generate a discount code
    // 2. Add item to user's account
    // 3. Send confirmation email
    // 4. Update user's rewards history

    res.status(200).json({
      success: true,
      message: 'Reward redeemed successfully',
      pointsRemaining: user.sustainabilityPoints
    });
  } catch (error) {
    console.error('Redeem reward error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error redeeming reward'
    });
  }
});

// Helper functions
const calculateSustainabilityLevel = (points) => {
  if (points >= 5000) return { name: 'Eco Champion', level: 6 };
  if (points >= 2500) return { name: 'Sustainability Star', level: 5 };
  if (points >= 1000) return { name: 'Green Guardian', level: 4 };
  if (points >= 500) return { name: 'Eco Warrior', level: 3 };
  if (points >= 100) return { name: 'Green Beginner', level: 2 };
  return { name: 'Eco Explorer', level: 1 };
};

const calculateNextLevelPoints = (points) => {
  const levels = [100, 500, 1000, 2500, 5000];
  for (let level of levels) {
    if (points < level) {
      return level - points;
    }
  }
  return 0; // Max level reached
};

const calculateAchievements = (user) => {
  const achievements = [];
  
  if (user.totalSustainableItems >= 1) {
    achievements.push({
      title: 'First Sustainable Purchase',
      description: 'Made your first sustainable purchase',
      icon: '🌱',
      unlockedAt: user.createdAt
    });
  }
  
  if (user.totalSustainableItems >= 10) {
    achievements.push({
      title: 'Thrift Explorer',
      description: 'Purchased 10 sustainable items',
      icon: '🔍',
      unlockedAt: user.createdAt
    });
  }
  
  if (user.totalSustainableItems >= 25) {
    achievements.push({
      title: 'Sustainable Shopper',
      description: 'Purchased 25 sustainable items',
      icon: '🛍️',
      unlockedAt: user.createdAt
    });
  }
  
  if (user.sustainabilityPoints >= 1000) {
    achievements.push({
      title: 'Points Master',
      description: 'Earned 1000+ sustainability points',
      icon: '⭐',
      unlockedAt: user.createdAt
    });
  }

  return achievements;
};

const generateImpactMessage = (user) => {
  const treesEquivalent = Math.floor(user.co2Saved / 25); // 25kg CO2 = 1 tree
  const plasticBottlesSaved = user.totalSustainableItems * 3; // Estimate
  
  return {
    co2: `You've saved ${user.co2Saved}kg of CO2`,
    trees: `Equivalent to planting ${treesEquivalent} trees`,
    plastic: `Diverted ${plasticBottlesSaved} plastic items from landfills`,
    water: `Saved approximately ${user.totalSustainableItems * 50} liters of water`
  };
};

module.exports = router;
