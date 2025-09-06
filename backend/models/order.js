const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: [true, 'User email is required'],
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email']
  },
  amount: {
    type: Number,
    required: [true, 'Order amount is required'],
    min: [0, 'Amount must be positive']
  },
  reference: {
    type: String,
    required: [true, 'Payment reference is required'],
    unique: true,
    trim: true
  },
  status: {
    type: String,
    enum: {
      values: ['Pending', 'Processing', 'Delivered', 'Cancelled'],
      message: 'Status must be one of: Pending, Processing, Delivered, Cancelled'
    },
    default: 'Pending'
  },
  products: [{
    productId: {
      type: String, // Changed from ObjectId to String
      required: [true, 'Product ID is required'],
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price must be positive']
    },
    quantity: {
      type: Number,
      default: 1,
      min: [1, 'Quantity must be at least 1']
    }
  }],
  paymentMethod: {
    type: String,
    trim: true
  },
  customerInfo: {
    fullName: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true }
  },
  paymentInfo: {
    momoNumber: { type: String, trim: true },
    momoNetwork: { type: String, trim: true },
    paypalEmail: { type: String, trim: true }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // Additional fields for better order management
  customerName: {
    type: String,
    trim: true
  },
  customerPhone: {
    type: String,
    trim: true
  },
  deliveryAddress: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
});

// Update the updatedAt field before saving
orderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create indexes for better performance
orderSchema.index({ userEmail: 1 });
orderSchema.index({ reference: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

// Virtual for order total (calculated from products)
orderSchema.virtual('calculatedTotal').get(function() {
  return this.products.reduce((total, product) => {
    return total + (product.price * product.quantity);
  }, 0);
});

// Method to check if calculated total matches stored amount
orderSchema.methods.validateTotal = function() {
  const calculated = this.calculatedTotal;
  const stored = this.amount;
  const difference = Math.abs(calculated - stored);
  return difference < 0.01; // Allow for small floating point differences
};

module.exports = mongoose.model('Order', orderSchema);