const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  avatar: {
    public_id: String,
    url: String
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'seller'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  
  // User preferences
  aestheticPreference: {
    type: String,
    enum: ['vintage', 'goth', 'cottagecore', 'y2k', 'minimalist', 'grunge', 'preppy', 'streetwear']
  },
  sizePreferences: {
    clothing: {
      type: String,
      enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
    },
    shoes: {
      type: Number,
      min: 3,
      max: 15
    }
  },
  
  // Sustainability tracking
  sustainabilityPoints: {
    type: Number,
    default: 0
  },
  totalSustainableItems: {
    type: Number,
    default: 0
  },
  co2Saved: {
    type: Number,
    default: 0 // in kg
  },
  
  // Address information
  addresses: [{
    type: {
      type: String,
      enum: ['home', 'work', 'other'],
      default: 'home'
    },
    fullName: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phone: String,
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  
  // Wishlist
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  
  // Persistent cart data
  cart: {
    items: [{
      productId: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true
      },
      size: String,
      image: String,
      quantity: {
        type: Number,
        default: 1,
        min: 1
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }],
    totalAmount: {
      type: Number,
      default: 0
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  
  // Purchase history for recommendations
  purchaseHistory: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    category: String,
    aesthetic: String,
    purchaseDate: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Add sustainability points
userSchema.methods.addSustainabilityPoints = function(points) {
  this.sustainabilityPoints += points;
  this.totalSustainableItems += 1;
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
