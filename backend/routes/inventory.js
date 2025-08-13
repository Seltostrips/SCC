// Inventory routes 
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const notificationService = require('../services/notificationService');

// Create inventory entry
router.post('/', auth, async (req, res) => {
  const { binId, bookQuantity, actualQuantity, notes, location } = req.body;
  
  try {
    const newEntry = new Inventory({
      binId,
      bookQuantity,
      actualQuantity,
      notes,
      location,
      staffId: req.user.id
    });
    
    // Calculate discrepancy and set status
    const discrepancy = Math.abs(bookQuantity - actualQuantity);
    newEntry.discrepancy = discrepancy;
    
    if (discrepancy === 0) {
      newEntry.status = 'auto-approved';
      newEntry.timestamps.finalStatus = new Date();
    } else {
      newEntry.status = 'pending-client';
    }
    
    await newEntry.save();
    
    // If status is pending-client, notify clients
    if (newEntry.status === 'pending-client') {
      // Emit real-time notification via Socket.io
      req.app.get('io').emit('new-pending-entry', newEntry);
      
      // Send email/WhatsApp notification to clients
      await notificationService.notifyClients(newEntry);
    }
    
    res.status(201).json(newEntry);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get pending entries for client
router.get('/pending', auth, async (req, res) => {
  try {
    if (req.user.role !== 'client' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const pendingEntries = await Inventory.find({ status: 'pending-client' })
      .populate('staffId', 'name')
      .sort({ 'timestamps.staffEntry': -1 });
    
    res.json(pendingEntries);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Client response to inventory entry
router.post('/:id/respond', auth, async (req, res) => {
  const { action, comment } = req.body;
  
  try {
    if (req.user.role !== 'client' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const entry = await Inventory.findById(req.params.id);
    
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }
    
    if (entry.status !== 'pending-client') {
      return res.status(400).json({ message: 'Entry is not pending client review' });
    }
    
    entry.clientId = req.user.id;
    entry.timestamps.clientResponse = new Date();
    entry.clientResponse = {
      action,
      comment: comment || ''
    };
    
    if (action === 'approved') {
      entry.status = 'client-approved';
      entry.timestamps.finalStatus = new Date();
    } else if (action === 'rejected') {
      entry.status = 'recount-required';
    }
    
    await entry.save();
    
    // Notify staff about the response
    if (action === 'rejected') {
      await notificationService.notifyStaff(entry, 'Recount required for inventory entry');
    }
    
    // Emit real-time update
    req.app.get('io').emit('entry-updated', entry);
    
    res.json(entry);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get all entries (for admin)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const { startDate, endDate, location, staff } = req.query;
    
    let query = {};
    
    if (startDate && endDate) {
      query['timestamps.staffEntry'] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (location) {
      query.location = location;
    }
    
    if (staff) {
      // Find staff by name
      const staffUser = await User.findOne({ name: { $regex: staff, $options: 'i' }, role: 'staff' });
      if (staffUser) {
        query.staffId = staffUser._id;
      }
    }
    
    const entries = await Inventory.find(query)
      .populate('staffId', 'name')
      .populate('clientId', 'name')
      .sort({ 'timestamps.staffEntry': -1 });
    
    res.json(entries);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
