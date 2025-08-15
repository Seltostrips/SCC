// File: routes/auth.js

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust the path as necessary
const { checkDBConnection } = require('../middleware/db'); // Adjust the path as necessary
const auth = require('../middleware/auth'); // Adjust the path as necessary

const router = express.Router();

// Register
router.post('/register', checkDBConnection, async (req, res) => {
  const { name, email, password, role, phone, company, uniqueCode, location, pincode } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User  already exists' });
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

    // If the role is admin, set isApproved to false
    if (role === 'admin') {
      user.isApproved = false; // New admins need approval
    }

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
      message: role === 'admin' ? 'Admin registration successful. Awaiting approval.' : 'Registration successful. Please wait for admin approval.',
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
  const { email, password, role } = req.body;

  console.log('Login attempt:', { email, password, role }); // Log incoming data

  try {
    // Find user
    let user = await User.findOne({ email });
    if (!user) {
      console.log('User  not found'); // Log if user is not found
      return res.status(400).json({ message: 'Invalid credentials: User not found' });
    }

    // Verify role
    if (user.role !== role) {
      console.log(`Role mismatch: expected ${role}, found ${user.role}`); // Log role mismatch
      return res.status(400).json({ message: `Invalid credentials: You are registered as a ${user.role}` });
    }

    // Check if user is approved
    if (!user.isApproved) {
      console.log('User  is not approved'); // Log if user is not approved
      return res.status(401).json({ message: 'Your account is pending approval' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password does not match'); // Log if password does not match
      return res.status(400).json({ message: 'Invalid credentials: Incorrect password' });
    }

    // Update last login
    user.lastLogin = { timestamp: new Date() };
    await user.save();

    // Create JWT token
    const payload = { id: user.id, role: user.role };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' }, (err, token) => {
      if (err) throw err;
      res.json({ 
        token, 
        user: { id: user.id, name: user.name, email: user.email, role: user.role } 
      });
    });
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

    // Include pending admins as well
    const pendingAdmins = await User.find({ isApproved: false, role: 'admin' }).select('-password');
    
    res.json([...pendingUsers, ...pendingAdmins]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
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
      return res.status(404).json({ message: 'User  not found' });
    }

    user.isApproved = true;
    await user.save();

    // TODO: Send notification to user about approval

    res.json({ message: 'User  approved successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
