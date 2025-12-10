const mongoose = require('mongoose');

const debtSchema = new mongoose.Schema({
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
  originalAmount: {
    type: Number,
    required: true
  },
  remainingBalance: {
    type: Number,
    required: true,
    min: 0
  },
  interestRate: {
    type: Number,
    required: true,
    min: 0
  },
  minimumPayment: {
    type: Number,
    default: 0
  },
  nextPaymentDate: {
    type: Date
  }
}, {
  timestamps: true
});

const Debt = mongoose.model('Debt', debtSchema);

module.exports = Debt;
