const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
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
  periodStart: {
    type: Date,
    required: true
  },
  limitAmount: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Unique compound index to ensure one budget per user per category per month
budgetSchema.index({ userId: 1, category: 1, periodStart: 1 }, { unique: true });

const Budget = mongoose.model('Budget', budgetSchema);

module.exports = Budget;
