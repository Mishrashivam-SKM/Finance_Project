const Transaction = require('../models/Transaction');
const { emitBudgetUpdate, emitTransactionUpdate, emitDashboardUpdate } = require('../utils/socketManager');

/**
 * @desc    Create a new transaction
 * @route   POST /api/transactions
 * @access  Private
 */
const createTransaction = async (req, res) => {
  try {
    const { category, type, amount, date, description } = req.body;

    // Validate required fields
    if (!category || !type || !amount || !date) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Create transaction with userId from authenticated user
    const transaction = await Transaction.create({
      userId: req.user.id,
      category,
      type,
      amount,
      date,
      description
    });

    // Emit real-time events to the user's room
    emitBudgetUpdate(req.user.id, {
      transactionId: transaction._id,
      type: transaction.type,
      amount: transaction.amount,
      action: 'created'
    });
    emitTransactionUpdate(req.user.id, {
      transactionId: transaction._id,
      type: transaction.type,
      amount: transaction.amount,
      action: 'created'
    });
    emitDashboardUpdate(req.user.id, { action: 'transaction_created' });

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Create transaction error:', error.message);
    res.status(500).json({ message: 'Server error while creating transaction' });
  }
};

/**
 * @desc    Get all transactions for authenticated user
 * @route   GET /api/transactions
 * @access  Private
 */
const getTransactions = async (req, res) => {
  try {
    // Fetch transactions only for the authenticated user
    const transactions = await Transaction.find({ userId: req.user.id })
      .populate('category', 'name type')
      .sort({ date: -1 });

    res.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error.message);
    res.status(500).json({ message: 'Server error while fetching transactions' });
  }
};

/**
 * @desc    Update an existing transaction
 * @route   PUT /api/transactions/:id
 * @access  Private
 */
const updateTransaction = async (req, res) => {
  try {
    const { category, type, amount, date, description } = req.body;

    // Find transaction by ID
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Verify user ownership
    if (transaction.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to update this transaction' });
    }

    // Update transaction fields
    transaction.category = category || transaction.category;
    transaction.type = type || transaction.type;
    transaction.amount = amount || transaction.amount;
    transaction.date = date || transaction.date;
    transaction.description = description !== undefined ? description : transaction.description;

    const updatedTransaction = await transaction.save();

    // Emit real-time events for transaction update
    emitTransactionUpdate(req.user.id, {
      transactionId: updatedTransaction._id,
      type: updatedTransaction.type,
      amount: updatedTransaction.amount,
      action: 'updated'
    });
    emitBudgetUpdate(req.user.id, {
      transactionId: updatedTransaction._id,
      type: updatedTransaction.type,
      amount: updatedTransaction.amount,
      action: 'updated'
    });
    emitDashboardUpdate(req.user.id, { action: 'transaction_updated' });

    res.json(updatedTransaction);
  } catch (error) {
    console.error('Update transaction error:', error.message);
    res.status(500).json({ message: 'Server error while updating transaction' });
  }
};

/**
 * @desc    Delete a transaction
 * @route   DELETE /api/transactions/:id
 * @access  Private
 */
const deleteTransaction = async (req, res) => {
  try {
    // Find transaction by ID
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Verify user ownership
    if (transaction.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this transaction' });
    }

    await Transaction.findByIdAndDelete(req.params.id);

    // Emit real-time events for transaction deletion
    emitTransactionUpdate(req.user.id, {
      transactionId: transaction._id,
      action: 'deleted'
    });
    emitBudgetUpdate(req.user.id, {
      transactionId: transaction._id,
      action: 'deleted'
    });
    emitDashboardUpdate(req.user.id, { action: 'transaction_deleted' });

    res.json({ message: 'Transaction removed successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error.message);
    res.status(500).json({ message: 'Server error while deleting transaction' });
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction
};
