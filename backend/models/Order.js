const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderItems: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    size: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    image: {
      type: String,
      required: true
    },
    sustainabilityPoints: {
      type: Number,
      default: 0
    }
  }],
  
  shippingAddress: {
    fullName: {
      type: String,
      required: true
    },
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true,
      default: 'India'
    },
    phone: {
      type: String,
      required: true
    }
  },
  
  paymentInfo: {
    id: {
      type: String,
      required: true
    },
    status: {
      type: String,
      required: true
    },
    method: {
      type: String,
      required: true,
      enum: ['card', 'upi', 'netbanking', 'wallet', 'cod']
    }
  },
  
  pricing: {
    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0
    },
    discount: {
      type: Number,
      default: 0.0
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0
    }
  },
  
  orderStatus: {
    type: String,
    required: true,
    default: 'processing',
    enum: ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded']
  },
  
  tracking: {
    trackingNumber: String,
    carrier: String,
    estimatedDelivery: Date,
    statusHistory: [{
      status: String,
      timestamp: {
        type: Date,
        default: Date.now
      },
      location: String,
      note: String
    }]
  },
  
  sustainability: {
    totalPointsEarned: {
      type: Number,
      default: 0
    },
    co2Saved: {
      type: Number,
      default: 0
    },
    impactMessage: String
  },
  
  deliveredAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculate total sustainability points for the order
orderSchema.methods.calculateSustainabilityPoints = function() {
  return this.orderItems.reduce((total, item) => {
    return total + (item.sustainabilityPoints * item.quantity);
  }, 0);
};

// Update order status with history tracking
orderSchema.methods.updateStatus = function(newStatus, location = '', note = '') {
  this.orderStatus = newStatus;
  this.tracking.statusHistory.push({
    status: newStatus,
    location,
    note
  });
  
  if (newStatus === 'delivered') {
    this.deliveredAt = new Date();
  }
  
  return this.save();
};

module.exports = mongoose.model('Order', orderSchema);
