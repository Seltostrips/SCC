const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const mongoose = require('mongoose');

// Middleware to check MongoDB connection
const checkDBConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'Database connection not established. Please try again later.' });
  }
  next();
};

// Create inventory entry
router.post('/', [auth, checkDBConnection], async (req, res) => {
  // ... rest of the code remains the same
});

// Get pending entries for client
router.get('/pending', [auth, checkDBConnection], async (req, res) => {
  // ... rest of the code remains the same
});

// Client response to inventory entry
router.post('/:id/respond', [auth, checkDBConnection], async (req, res) => {
  // ... rest of the code remains the same
});

// Get all entries (for admin)
router.get('/', [auth, checkDBConnection], async (req, res) => {
  // ... rest of the code remains the same
});

module.exports = router;
