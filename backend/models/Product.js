const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide product name'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide product description'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please provide product price'],
    min: [0, 'Price cannot be negative']
  },
  discountPrice: {
    type: Number,
    default: 0,
    min: [0, 'Discount price cannot be negative']
  },
  
  // Product images
  images: [{
    public_id: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  }],
  
  // Category and classification
  category: {
    type: String,
    required: [true, 'Please select product category'],
    enum: ['clothing', 'accessories', 'shoes', 'bags', 'jewelry']
  },
  subCategory: {
    type: String,
    required: [true, 'Please select subcategory']
  },
  
  // Fashion aesthetic
  aesthetic: {
    type: String,
    required: [true, 'Please select aesthetic'],
    enum: ['vintage', 'goth', 'cottagecore', 'y2k', 'minimalist', 'grunge', 'preppy', 'streetwear', 'bohemian', 'punk']
  },
  
  // Size and fit
  sizes: [{
    size: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Quantity cannot be negative']
    }
  }],
  
  // Brand and seller info
  brand: String,
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  thriftStore: {
    name: String,
    location: String,
    verified: {
      type: Boolean,
      default: false
    }
  },
  
  // Sustainability metrics
  sustainability: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'Please provide sustainability rating']
    },
    co2Savings: {
      type: Number,
      default: 0 // in kg
    },
    waterSaved: {
      type: Number,
      default: 0 // in liters
    },
    materials: [{
      type: String,
      enum: ['organic-cotton', 'recycled-polyester', 'hemp', 'bamboo', 'linen', 'wool', 'silk', 'denim', 'leather', 'synthetic']
    }],
    condition: {
      type: String,
      enum: ['new', 'like-new', 'very-good', 'good', 'fair'],
      required: true
    }
  },
  
  // Product stats
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  sold: {
    type: Number,
    default: 0
  },
  
  // Reviews and ratings
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5']
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5']
    },
    comment: {
      type: String,
      required: true,
      maxlength: [500, 'Review cannot exceed 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Tags for search and recommendations
  tags: [{
    type: String,
    lowercase: true
  }],
  
  // Availability
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Special features
  isUnique: {
    type: Boolean,
    default: false // for mystery box items
  },
  mysterBox: {
    included: {
      type: Boolean,
      default: false
    },
    boxType: {
      type: String,
      enum: ['surprise', 'aesthetic-based', 'seasonal']
    }
  }
}, {
  timestamps: true
});

// Indexes for better search performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, aesthetic: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'sustainability.rating': -1 });
productSchema.index({ createdAt: -1 });

// Calculate average rating
productSchema.methods.calculateAverageRating = function() {
  if (this.reviews.length === 0) {
    this.ratings.average = 0;
    this.ratings.count = 0;
    return;
  }

  const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.ratings.average = Math.round((totalRating / this.reviews.length) * 10) / 10;
  this.ratings.count = this.reviews.length;
};

// Update sustainability points based on purchase
productSchema.methods.calculateSustainabilityPoints = function() {
  const basePoints = Math.floor(this.price / 100) * 10; // 10 points per ₹100
  const sustainabilityMultiplier = this.sustainability.rating / 5; // 1-5 rating becomes 0.2-1.0 multiplier
  const conditionBonus = {
    'new': 1.0,
    'like-new': 1.2,
    'very-good': 1.4,
    'good': 1.6,
    'fair': 2.0
  };
  
  return Math.round(basePoints * sustainabilityMultiplier * conditionBonus[this.sustainability.condition]);
};

module.exports = mongoose.model('Product', productSchema);
