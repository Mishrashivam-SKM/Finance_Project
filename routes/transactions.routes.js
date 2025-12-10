const express = require('express');
const { protect } = require('../middleware/auth');
const {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction
} = require('../controllers/transactionController');

const router = express.Router();

// @route   POST /api/transactions
// @desc    Create a new transaction
// @access  Private
router.post('/', protect, createTransaction);

// @route   GET /api/transactions
// @desc    Get all transactions for authenticated user
// @access  Private
router.get('/', protect, getTransactions);

// @route   PUT /api/transactions/:id
// @desc    Update an existing transaction
// @access  Private
router.put('/:id', protect, updateTransaction);

// @route   DELETE /api/transactions/:id
// @desc    Delete a transaction
// @access  Private
router.delete('/:id', protect, deleteTransaction);

module.exports = router;
