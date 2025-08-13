// Inventory model 
const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  binId: {
    type: String,
    required: true
  },
  bookQuantity: {
    type: Number,
    required: true
  },
  actualQuantity: {
    type: Number,
    required: true
  },
  notes: {
    type: String
  },
  status: {
    type: String,
    enum: ['auto-approved', 'pending-client', 'client-approved', 'client-rejected', 'recount-required'],
    default: 'pending-client'
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  timestamps: {
    staffEntry: {
      type: Date,
      default: Date.now
    },
    clientResponse: Date,
    finalStatus: Date
  },
  clientResponse: {
    action: String,
    comment: String
  },
  location: String,
  discrepancy: {
    type: Number,
    default: function() {
      return Math.abs(this.bookQuantity - this.actualQuantity);
    }
  }
});

module.exports = mongoose.model('Inventory', InventorySchema);
