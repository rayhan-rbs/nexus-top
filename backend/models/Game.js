/**
 * Game Model — MongoDB Schema
 */

const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  amount: {
    type: String,
    required: true
  },
  bonus: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: true
  },
  oldPrice: {
    type: Number
  },
  popular: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const gameSchema = new mongoose.Schema({
  // Basic Info
  gameId: {
    type: String,
    unique: true,
    required: true
  },
  title: {
    type: String,
    required: [true, 'Game title is required'],
    trim: true
  },
  tag: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['mobile', 'pc', 'console', 'mmorpg'],
    required: true
  },
  
  // Display
  icon: {
    type: String,
    default: '🎮'
  },
  color: {
    type: String,
    default: 'linear-gradient(135deg,#7C3AED,#06B6D4)'
  },
  image: {
    type: String,
    default: ''
  },
  
  // Details
  description: {
    type: String,
    required: true
  },
  currency: {
    type: String,
    required: true
  },
  
  // Stats
  rating: {
    type: Number,
    default: 4.5,
    min: 0,
    max: 5
  },
  players: {
    type: String,
    default: '1M+'
  },
  
  // Packages
  packages: [packageSchema],
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  
  // Metadata
  featured: {
    type: Boolean,
    default: false
  },
  orderCount: {
    type: Number,
    default: 0
  }

}, {
  timestamps: true
});

// Auto-generate gameId before saving
gameSchema.pre('save', async function(next) {
  if (!this.gameId) {
    this.gameId = this.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
  next();
});

module.exports = mongoose.model('Game', gameSchema);