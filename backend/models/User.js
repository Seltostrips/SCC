const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
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
    enum: ['admin', 'client', 'staff'],
    required: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  phone: {
    type: String
  },
  company: {
    type: String
  },
  uniqueCode: {
    type: String
  },
  location: {
    city: String,
    pincode: String
  },
  lastLogin: {
    timestamp: Date
  },
  // NEW: Add assigned clients for staff
  assignedClients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
