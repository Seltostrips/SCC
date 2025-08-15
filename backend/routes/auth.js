// File: routes/auth.js
// SCC-main(4)/SCC-main/backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { checkDBConnection } = require('../middleware/db'); // Corrected path and uncommented
const auth = require('../middleware/auth');
const router = express.Router();

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
      console.log('User not found'); // Log if user is not found
      return res.status(400).json({ message: 'Invalid credentials: User not found' });
    }

    // Verify role
    if (user.role !== role) {
      console.log(`Role mismatch: expected ${role}, found ${user.role}`); // Log role mismatch
      return res.status(400).json({ message: `Invalid credentials: You are registered as a ${user.role}` });
    }

    // Check if user is approved
    if (!user.isApproved) {
      console.log('User is not approved'); // Log if user is not approved
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

// Get current user info (me endpoint)
router.get('/me', [auth, checkDBConnection], async (req, res) => {
  try {
    // The auth middleware already attaches the user to req.user
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      phone: user.phone,
      company: user.company,
      uniqueCode: user.uniqueCode,
      location: user.location,
      lastLogin: user.lastLogin
    });
  } catch (error) {
    console.error('Get user error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users (admin only) - NEW ENDPOINT
router.get('/all-users', [auth, checkDBConnection], async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    console.error('Error fetching all users:', err.message);
    res.status(500).send('Server error');
  }
});

// Get login logs (admin only) - NEW ENDPOINT
router.get('/login-logs', [auth, checkDBConnection], async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Fetch users with their login information
    const users = await User.find({})
      .select('name email role lastLogin createdAt')
      .sort({ 'lastLogin.timestamp': -1 });

    // Transform user data into login log format
    const loginLogs = users.map(user => ({
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin?.timestamp || null,
      accountCreated: user.createdAt
    }));

    res.json(loginLogs);
  } catch (err) {
    console.error('Error fetching login logs:', err.message);
    res.status(500).send('Server error');
  }
});

// Update user details (admin only) - UPDATED ENDPOINT
router.put('/update-user-details/:userId', [auth, checkDBConnection], async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { userId } = req.params;
    const { company, city, assignedClients } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user details based on role
    if (user.role === 'client') {
      if (company) user.company = company;
      if (city) {
        if (!user.location) user.location = {};
        user.location.city = city;
      }
    } else if (user.role === 'staff') {
      // Update assigned clients for staff
      if (assignedClients && Array.isArray(assignedClients)) {
        // Validate that all assigned clients are actually clients
        const clients = await User.find({ 
          _id: { $in: assignedClients },
          role: 'client',
          isApproved: true
        });
        
        user.assignedClients = clients.map(client => client._id);
      }
    }

    await user.save();

    // Populate assigned clients for response
    await user.populate('assignedClients', 'name company uniqueCode');

    res.json({
      message: 'User details updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
        location: user.location,
        assignedClients: user.assignedClients
      }
    });
  } catch (err) {
    console.error('Error updating user details:', err.message);
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

module.exports = router;

