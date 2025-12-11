const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
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

    // For expense transactions, check if a budget exists for the category and period
    if (type === 'expense') {
      const transactionDate = new Date(date);
      const year = transactionDate.getFullYear();
      const month = transactionDate.getMonth() + 1; // getMonth() returns 0-11
      
      // Calculate period start (first day of the month)
      const periodStart = new Date(year, month - 1, 1);
      
      // Check if budget exists for this category and period
      const budgetExists = await Budget.findOne({
        userId: req.user.id,
        category: category,
        periodStart: periodStart
      });

      if (!budgetExists) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        return res.status(400).json({
          message: `Cannot record expense: No budget has been allocated for this category in ${monthNames[month - 1]} ${year}.`,
          category: category,
          period: `${monthNames[month - 1]} ${year}`,
          suggestion: 'Please create a budget for this category and period before recording expenses.'
        });
      }

      // Budget exists - now check for overspending hard limit
      // Calculate period end (last day of the month)
      const periodEnd = new Date(year, month, 0, 23, 59, 59, 999);
      
      // Get total amount already spent in this category for the current period
      const existingTransactions = await Transaction.find({
        userId: req.user.id,
        category: category,
        type: 'expense',
        date: { $gte: periodStart, $lte: periodEnd }
      });

      const totalSpent = existingTransactions.reduce((sum, trans) => sum + trans.amount, 0);
      const newTotalSpent = totalSpent + amount;

      // Check if new transaction would exceed the budget limit
      if (newTotalSpent > budgetExists.limitAmount) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        return res.status(400).json({
          message: `Transaction exceeds the allocated budget limit for this category.`,
          budgetLimit: budgetExists.limitAmount,
          currentSpending: totalSpent,
          transactionAmount: amount,
          newTotalSpending: newTotalSpent,
          exceededBy: newTotalSpent - budgetExists.limitAmount,
          period: `${monthNames[month - 1]} ${year}`,
          suggestion: `You have already spent $${totalSpent.toFixed(2)} of your $${budgetExists.limitAmount.toFixed(2)} budget. This transaction would exceed your limit by $${(newTotalSpent - budgetExists.limitAmount).toFixed(2)}.`
        });
      }
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
