const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  currentValue: {
    type: Number,
    required: true,
    min: 0
  },
  valueHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    value: {
      type: Number,
      required: true
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update lastUpdated before saving
assetSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

const Asset = mongoose.model('Asset', assetSchema);

module.exports = Asset;
