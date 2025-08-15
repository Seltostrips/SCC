// SCC-main/SCC-main/backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Middleware to check MongoDB connection (no change)
const checkDBConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'Database connection not established. Please try again later.' });
  }
  next();
};

// Register (no change)
router.post('/register', checkDBConnection, async (req, res) => {
  const { name, email, password, role, phone, company, uniqueCode, location, pincode } = req.body;
  
  try {
    // ... (existing register logic) ...
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Login
router.post('/login', checkDBConnection, async (req, res) => {
  const { email, password, role, pincode } = req.body;
  
  try {
    console.log('Backend received login request for email:', email, 'with role:', role); // Keep this log

    // Find user
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // --- ADD THESE NEW CONSOLE.LOGS ---
    console.log(`DEBUG: user.role from DB: '${user.role}' (length: ${user.role.length})`);
    console.log(`DEBUG: role from frontend: '${role}' (length: ${role.length})`);
    console.log(`DEBUG: Comparison result (user.role !== role): ${user.role !== role}`);
    // --- END NEW CONSOLE.LOGS ---
    
    // Verify that the user's actual role matches the role they selected for login
    if (user.role !== role) {
      console.log(`Role mismatch: User in DB is '${user.role}', received role is '${role}'`); // Keep this log
      return res.status(400).json({ message: `You are registered as a ${user.role}, please select the correct role to log in.` });
    }
    
    // Check if user is approved (no change)
    if (!user.isApproved) {
      return res.status(401).json({ message: 'Your account is pending approval' });
    }
    
    // Verify password (no change)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Verify pincode for clients only (no change)
    if (user.role === 'client') {
      if (!pincode) {
        return res.status(400).json({ message: 'Pincode is required for client login' });
      }
      if (pincode !== user.location.pincode) {
        return res.status(400).json({ message: 'Invalid pincode for client' });
      }
    }

    // Update login information (no change)
    user.lastLogin = {
      timestamp: new Date(),
    };
    await user.save();
    
    // Create JWT payload (no change)
    const payload = {
      id: user.id,
      role: user.role
    };
    
    // Sign token (no change)
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' },
      (err, token) => {
        if (err) throw err;
        res.json({ 
          token, 
          user: { 
            id: user.id, 
            name: user.name, 
            email: user.email, 
            role: user.role,
            ...(user.role === 'client' && {
              company: user.company,
              uniqueCode: user.uniqueCode,
              location: user.location
            })
          } 
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// ... (rest of the auth.js file, no changes) ...

module.exports = router;
