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
  // New fields
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
  // Approval status
  isApproved: {
    type: Boolean,
    default: function() { return this.role === 'admin'; } // Admins are approved by default
  },
  // Login tracking
  lastLogin: {
    timestamp: Date,
    location: { // Make location entirely optional within lastLogin
      type: { type: String, enum: ['Point'], required: false },
      coordinates: { type: [Number], required: false }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User ', UserSchema);
