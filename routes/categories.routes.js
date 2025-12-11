const express = require('express');
const { protect } = require('../middleware/auth');
const Category = require('../models/Category');

const router = express.Router();

/**
 * @route   GET /api/categories
 * @desc    Get all categories
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const categories = await Category.find().select('-__v');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error.message);
    res.status(500).json({ message: 'Server error while fetching categories' });
  }
});

/**
 * @route   GET /api/categories/type/:type
 * @desc    Get categories by type (income, expense, asset, debt)
 * @access  Private
 */
router.get('/type/:type', protect, async (req, res) => {
  try {
    const { type } = req.params;
    
    // Validate type
    const validTypes = ['income', 'expense', 'asset', 'debt'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
    }

    const categories = await Category.find({ type }).select('-__v');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories by type:', error.message);
    res.status(500).json({ message: 'Server error while fetching categories' });
  }
});

module.exports = router;
