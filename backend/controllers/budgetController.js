const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

/**
 * @desc    Create a new monthly budget
 * @route   POST /api/budgets
 * @access  Private
 */
const createBudget = async (req, res) => {
  try {
    const { category, limitAmount, month, year } = req.body;

    // Validate required fields
    if (!category || limitAmount === undefined || month === undefined || year === undefined) {
      return res.status(400).json({ message: 'Please provide all required fields (category, limitAmount, month, year)' });
    }

    // Create periodStart as the first day of the specified month
    const periodStart = new Date(year, month - 1, 1);

    // Check if budget already exists for this user, category, and period (uniqueness check)
    const existingBudget = await Budget.findOne({
      userId: req.user.id,
      category,
      periodStart
    });

    if (existingBudget) {
      return res.status(400).json({ message: 'Budget already exists for this category and period' });
    }

    // Calculate period boundaries
    const periodEnd = new Date(year, month, 0, 23, 59, 59, 999); // Last day of the month

    // Get total income for the period
    const incomeResult = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user.id),
          type: 'income',
          date: { $gte: periodStart, $lte: periodEnd }
        }
      },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: '$amount' }
        }
      }
    ]);

    const totalIncome = incomeResult.length > 0 ? incomeResult[0].totalIncome : 0;

    // Get sum of existing allocated budgets for this period (excluding current budget being created)
    const existingBudgetsResult = await Budget.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user.id),
          periodStart: periodStart
        }
      },
      {
        $group: {
          _id: null,
          totalAllocated: { $sum: '$limitAmount' }
        }
      }
    ]);

    const existingAllocated = existingBudgetsResult.length > 0 ? existingBudgetsResult[0].totalAllocated : 0;
    const newTotalAllocated = existingAllocated + limitAmount;

    // Validate that total allocation doesn't exceed income
    if (newTotalAllocated > totalIncome) {
      return res.status(400).json({
        message: `Total budget allocation ($${newTotalAllocated.toFixed(2)}) exceeds total income for the period ($${totalIncome.toFixed(2)})`,
        totalIncome: totalIncome,
        existingAllocated: existingAllocated,
        requestedAmount: limitAmount,
        newTotalAllocated: newTotalAllocated
      });
    }

    // Create budget with userId from authenticated user
    const budget = await Budget.create({
      userId: req.user.id,
      category,
      periodStart,
      limitAmount
    });

    res.status(201).json(budget);
  } catch (error) {
    console.error('Create budget error:', error.message);
    res.status(500).json({ message: 'Server error while creating budget' });
  }
};

/**
 * @desc    Get all budgets for authenticated user
 * @route   GET /api/budgets
 * @access  Private
 */
const getBudgets = async (req, res) => {
  try {
    // Fetch budgets only for the authenticated user
    const budgets = await Budget.find({ userId: req.user.id })
      .populate('category', 'name type')
      .sort({ periodStart: -1 });

    res.json(budgets);
  } catch (error) {
    console.error('Get budgets error:', error.message);
    res.status(500).json({ message: 'Server error while fetching budgets' });
  }
};

/**
 * @desc    Update an existing budget
 * @route   PUT /api/budgets/:id
 * @access  Private
 */
const updateBudget = async (req, res) => {
  try {
    const { category, limitAmount, month, year } = req.body;

    // Find budget by ID
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Verify user ownership
    if (budget.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to update this budget' });
    }

    // Determine the period to check (use new period if provided, otherwise use existing)
    let checkPeriodStart = budget.periodStart;
    let checkMonth = budget.periodStart.getMonth() + 1;
    let checkYear = budget.periodStart.getFullYear();

    if (month !== undefined && year !== undefined) {
      checkPeriodStart = new Date(year, month - 1, 1);
      checkMonth = month;
      checkYear = year;
    }

    const checkPeriodEnd = new Date(checkYear, checkMonth, 0, 23, 59, 59, 999);

    // Get the new limit amount (use provided or existing)
    const newLimitAmount = limitAmount !== undefined ? limitAmount : budget.limitAmount;
    const oldLimitAmount = budget.limitAmount;

    // Get total income for the period
    const incomeResult = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user.id),
          type: 'income',
          date: { $gte: checkPeriodStart, $lte: checkPeriodEnd }
        }
      },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: '$amount' }
        }
      }
    ]);

    const totalIncome = incomeResult.length > 0 ? incomeResult[0].totalIncome : 0;

    // Get sum of existing allocated budgets for this period (excluding the current budget being updated)
    const existingBudgetsResult = await Budget.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user.id),
          periodStart: checkPeriodStart,
          _id: { $ne: budget._id } // Exclude current budget from calculation
        }
      },
      {
        $group: {
          _id: null,
          totalAllocated: { $sum: '$limitAmount' }
        }
      }
    ]);

    const existingAllocated = existingBudgetsResult.length > 0 ? existingBudgetsResult[0].totalAllocated : 0;
    const newTotalAllocated = existingAllocated + newLimitAmount;

    // Validate that total allocation doesn't exceed income
    if (newTotalAllocated > totalIncome) {
      return res.status(400).json({
        message: `Total budget allocation ($${newTotalAllocated.toFixed(2)}) exceeds total income for the period ($${totalIncome.toFixed(2)})`,
        totalIncome: totalIncome,
        existingAllocated: existingAllocated,
        requestedAmount: newLimitAmount,
        newTotalAllocated: newTotalAllocated
      });
    }

    // Update budget fields
    budget.category = category || budget.category;
    budget.limitAmount = limitAmount !== undefined ? limitAmount : budget.limitAmount;

    // Update periodStart if month and year are provided
    if (month !== undefined && year !== undefined) {
      budget.periodStart = new Date(year, month - 1, 1);
    }

    const updatedBudget = await budget.save();

    res.json(updatedBudget);
  } catch (error) {
    console.error('Update budget error:', error.message);
    res.status(500).json({ message: 'Server error while updating budget' });
  }
};

/**
 * @desc    Delete a budget
 * @route   DELETE /api/budgets/:id
 * @access  Private
 */
const deleteBudget = async (req, res) => {
  try {
    // Find budget by ID
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Verify user ownership
    if (budget.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this budget' });
    }

    await Budget.findByIdAndDelete(req.params.id);

    res.json({ message: 'Budget removed successfully' });
  } catch (error) {
    console.error('Delete budget error:', error.message);
    res.status(500).json({ message: 'Server error while deleting budget' });
  }
};

module.exports = {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget
};
