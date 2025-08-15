// File: models/User.js

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['staff', 'client', 'admin'],
    required: true
  },
  phone: {
    type: String
  },
  company: {
    type: String,
    required: function() { return this.role === 'client'; } // Required for clients only
  },
  uniqueCode: {
    type: String,
    required: function() { return this.role === 'client'; } // Required for clients only
  },
  location: {
    city: {
      type: String,
      required: function() { return this.role === 'client'; } // Required for clients only
    },
    pincode: {
      type: String,
      required: function() { return this.role === 'client'; } // Required for clients only
    }
  },
  isApproved: {
    type: Boolean,
    default: false // Default to false for all new users
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User ', UserSchema);
