const express = require('express');
const { protect } = require('../middleware/auth');
const {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget
} = require('../controllers/budgetController');

const router = express.Router();

// @route   POST /api/budgets
// @desc    Create a new monthly budget
// @access  Private
router.post('/', protect, createBudget);

// @route   GET /api/budgets
// @desc    Get all budgets for authenticated user
// @access  Private
router.get('/', protect, getBudgets);

// @route   PUT /api/budgets/:id
// @desc    Update an existing budget
// @access  Private
router.put('/:id', protect, updateBudget);

// @route   DELETE /api/budgets/:id
// @desc    Delete a budget
// @access  Private
router.delete('/:id', protect, deleteBudget);

module.exports = router;
