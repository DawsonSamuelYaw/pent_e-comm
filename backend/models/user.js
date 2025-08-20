const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long']
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email']
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long']
  },
  orders: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order' 
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  lastLogin: { 
    type: Date 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
  passwordResetAt: {
    type: Date
  }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);