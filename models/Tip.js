const mongoose = require('mongoose');

const tipSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  body: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Budgeting', 'Investing', 'Debt Management', 'Saving', 'Tax Planning'],
    required: true
  },
  isPublished: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Tip = mongoose.model('Tip', tipSchema);

module.exports = Tip;
