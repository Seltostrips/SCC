const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Middleware to check MongoDB connection
const checkDBConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'Database connection not established. Please try again later.' });
  }
  next();
};

// Register
router.post('/register', checkDBConnection, async (req, res) => {
  const { name, email, password, role, phone, company, uniqueCode, location, pincode } = req.body;
  
  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Validate role-specific fields for client registration
    if (role === 'client' && (!company || !uniqueCode || !location?.city || !location?.pincode)) {
      return res.status(400).json({ message: 'Company, unique code, city, and pincode are required for client registration' });
    }
    
    // Check if uniqueCode already exists for clients
    if (role === 'client') {
      const existingClient = await User.findOne({ uniqueCode });
      if (existingClient) {
        return res.status(400).json({ message: 'This unique code is already registered' });
      }
    }
    
    // Create user object
    user = new User({
      name,
      email,
      password,
      role,
      phone,
      ...(role === 'client' && { 
        company, 
        uniqueCode, 
        location: {
          city: location.city,
          pincode: location.pincode
        }
      }),
      isApproved: role === 'admin' // Admins are approved by default
    });
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    // Save user
    await user.save();
    
    // If not admin, notify admin for approval
    if (role !== 'admin') {
      // TODO: Send notification to admin for approval
    }
    
    res.status(201).json({ 
      message: role === 'admin' ? 'Admin registered successfully' : 'Registration successful. Please wait for admin approval.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Login
router.post('/login', checkDBConnection, async (req, res) => {
  const { email, password, role, pincode } = req.body; // Removed 'location' from destructuring
  
  try {
    // Find user
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify that the user's actual role matches the role they selected for login
    if (user.role !== role) {
      return res.status(400).json({ message: `You are registered as a ${user.role}, please select the correct role to log in.` });
    }
    
    // Check if user is approved
    if (!user.isApproved) {
      return res.status(401).json({ message: 'Your account is pending approval' });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Verify pincode for clients only
    if (user.role === 'client') {
      if (!pincode) {
        return res.status(400).json({ message: 'Pincode is required for client login' });
      }
      if (pincode !== user.location.pincode) {
        return res.status(400).json({ message: 'Invalid pincode for client' });
      }
    }
    // For staff and admin, pincode is now optional for login.

    // Update login information (removed location update)
    user.lastLogin = {
      timestamp: new Date(), // Always set timestamp
      // Removed location property entirely
    };
    await user.save();
    
    // Create JWT payload
    const payload = {
      id: user.id,
      role: user.role
    };
    
    // Sign token
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

// Get current user
router.get('/me', [auth, checkDBConnection], async (req, res) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ user });
  } catch (err) {
    console.error(err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
});

// Approve user (admin only)
router.post('/approve/:userId', [auth, checkDBConnection], async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.isApproved = true;
    await user.save();
    
    // TODO: Send notification to user about approval
    
    res.json({ message: 'User approved successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get pending approvals (admin only)
router.get('/pending-approvals', [auth, checkDBConnection], async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const pendingUsers = await User.find({ isApproved: false, role: { $ne: 'admin' } })
      .select('-password');
    
    res.json(pendingUsers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get user login logs (admin only)
router.get('/login-logs', [auth, checkDBConnection], async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const users = await User.find({ role: { $ne: 'admin' } })
      .select('name email role lastLogin createdAt');
    
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// New: Get all users (admin only)
router.get('/all-users', [auth, checkDBConnection], async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const users = await User.find({}) // Fetch all users
      .select('-password'); // Exclude password
    
    res.json(users);
  } catch (err) {
    console.error('Error fetching all users:', err.message);
    res.status(500).send('Server error');
  }
});

// New: Update user details (admin only)
router.put('/update-user-details/:userId', [auth, checkDBConnection], async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { company, city } = req.body;
    const userId = req.params.userId;

    const userToUpdate = await User.findById(userId);

    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only allow updating company and city for clients
    if (userToUpdate.role === 'client') {
      if (company !== undefined) { // Allow setting to empty string if needed
        userToUpdate.company = company;
      }
      // Ensure location object exists before trying to set city
      if (!userToUpdate.location) {
        userToUpdate.location = {};
      }
      if (city !== undefined) { // Allow setting to empty string if needed
        userToUpdate.location.city = city;
      }
    } else {
      // For staff, we might allow updating their own city/location if needed in the future,
      // but for now, only company/city for clients.
      return res.status(400).json({ message: 'Only client company and city can be updated via this endpoint.' });
    }

    await userToUpdate.save();

    res.json({ message: 'User details updated successfully', user: userToUpdate });
  } catch (err) {
    console.error('Error updating user details:', err.message);
    res.status(500).send('Server error');
  }
});


module.exports = router;
