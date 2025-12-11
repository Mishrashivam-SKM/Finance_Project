const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['income', 'expense', 'asset', 'debt'],
    required: true
  },
  group: {
    type: String,
    trim: true
  },
  isEditable: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
