const express = require('express');
const { protect } = require('../middleware/auth');
const {
  createDebt,
  getDebts,
  updateDebt,
  deleteDebt
} = require('../controllers/debtController');

const router = express.Router();

// @route   POST /api/debts
// @desc    Create a new debt
// @access  Private
router.post('/', protect, createDebt);

// @route   GET /api/debts
// @desc    Get all debts for authenticated user
// @access  Private
router.get('/', protect, getDebts);

// @route   PUT /api/debts/:id
// @desc    Update an existing debt
// @access  Private
router.put('/:id', protect, updateDebt);

// @route   DELETE /api/debts/:id
// @desc    Delete a debt
// @access  Private
router.delete('/:id', protect, deleteDebt);

module.exports = router;
