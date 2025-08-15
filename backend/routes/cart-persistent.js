const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// In-memory cart storage (in production, use Redis or database)
const carts = new Map();

// Helper function to get user cart
const getUserCart = (userId) => {
  if (!carts.has(userId)) {
    carts.set(userId, { items: [], totalAmount: 0 });
  }
  return carts.get(userId);
};

// Helper function to calculate cart total
const calculateCartTotal = (cart) => {
  cart.totalAmount = cart.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
};

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
router.get('/', protect, (req, res) => {
  try {
    const cart = getUserCart(req.user.id);
    
    res.status(200).json({
      success: true,
      cart
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting cart'
    });
  }
});

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
router.post('/add', protect, (req, res) => {
  try {
    const { productId, name, price, size, image, quantity = 1 } = req.body;

    if (!productId || !name || !price || !size || !image) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const cart = getUserCart(req.user.id);
    
    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.productId === productId && item.size === size
    );

    if (existingItemIndex !== -1) {
      // Update quantity of existing item
      cart.items[existingItemIndex].quantity += parseInt(quantity);
    } else {
      // Add new item
      cart.items.push({
        productId,
        name,
        price: parseFloat(price),
        size,
        image,
        quantity: parseInt(quantity)
      });
    }

    calculateCartTotal(cart);

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      cart
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding to cart'
    });
  }
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/update
// @access  Private
router.put('/update', protect, (req, res) => {
  try {
    const { productId, size, quantity } = req.body;

    if (!productId || !size || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const cart = getUserCart(req.user.id);
    const itemIndex = cart.items.findIndex(
      item => item.productId === productId && item.size === size
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart.items[itemIndex].quantity = parseInt(quantity);
    }

    calculateCartTotal(cart);

    res.status(200).json({
      success: true,
      message: 'Cart updated',
      cart
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating cart'
    });
  }
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove
// @access  Private
router.delete('/remove', protect, (req, res) => {
  try {
    const { productId, size } = req.body;

    if (!productId || !size) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const cart = getUserCart(req.user.id);
    cart.items = cart.items.filter(
      item => !(item.productId === productId && item.size === size)
    );

    calculateCartTotal(cart);

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      cart
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error removing from cart'
    });
  }
});

// @desc    Clear cart
// @route   DELETE /api/cart/clear
// @access  Private
router.delete('/clear', protect, (req, res) => {
  try {
    const cart = getUserCart(req.user.id);
    cart.items = [];
    cart.totalAmount = 0;

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      cart
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error clearing cart'
    });
  }
});

// @desc    Get cart item count
// @route   GET /api/cart/count
// @access  Private
router.get('/count', protect, (req, res) => {
  try {
    const cart = getUserCart(req.user.id);
    const itemCount = cart.items.reduce((total, item) => total + item.quantity, 0);

    res.status(200).json({
      success: true,
      count: itemCount
    });
  } catch (error) {
    console.error('Get cart count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting cart count'
    });
  }
});

module.exports = router;
