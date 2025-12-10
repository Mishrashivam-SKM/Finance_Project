const express = require('express');
const mongoose = require('mongoose');
const Asset = require('../models/Asset');
const Debt = require('../models/Debt');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');
const { calculateCompoundInterest } = require('../utils/financialCalculations');

const router = express.Router();

// @route   GET /api/reports/networth
// @desc    Calculate user's current net worth (assets - debts)
// @access  Private
router.get('/networth', protect, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user);

    // Calculate total assets value
    const assetsResult = await Asset.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: null, totalAssets: { $sum: '$currentValue' } } }
    ]);

    // Calculate total debts remaining balance
    const debtsResult = await Debt.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: null, totalDebts: { $sum: '$remainingBalance' } } }
    ]);

    const totalAssets = assetsResult.length > 0 ? assetsResult[0].totalAssets : 0;
    const totalDebts = debtsResult.length > 0 ? debtsResult[0].totalDebts : 0;
    const netWorth = totalAssets - totalDebts;

    res.json({
      totalAssets,
      totalDebts,
      netWorth
    });
  } catch (error) {
    console.error('Net worth calculation error:', error.message);
    res.status(500).json({ message: 'Server error while calculating net worth' });
  }
});

// @route   GET /api/reports/spending-breakdown
// @desc    Get spending breakdown by category for current month
// @access  Private
router.get('/spending-breakdown', protect, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user);

    // Get the first and last day of the current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Aggregate spending by category for the current month
    const spendingBreakdown = await Transaction.aggregate([
      {
        $match: {
          userId: userId,
          type: 'expense',
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$category',
          totalSpent: { $sum: '$amount' }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $unwind: '$categoryInfo'
      },
      {
        $project: {
          _id: 0,
          categoryId: '$_id',
          categoryName: '$categoryInfo.name',
          totalSpent: 1
        }
      },
      {
        $sort: { totalSpent: -1 }
      }
    ]);

    // Calculate total spending for the month
    const totalSpending = spendingBreakdown.reduce((sum, item) => sum + item.totalSpent, 0);

    res.json({
      month: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
      totalSpending,
      breakdown: spendingBreakdown
    });
  } catch (error) {
    console.error('Spending breakdown error:', error.message);
    res.status(500).json({ message: 'Server error while calculating spending breakdown' });
  }
});

// @route   POST /api/simulations/investment
// @desc    Calculate future value of investment with compound interest
// @access  Private
router.post('/simulations/investment', protect, async (req, res) => {
  try {
    const { initialInvestment, monthlyContribution, annualReturn, years } = req.body;

    // Validate required fields
    if (
      initialInvestment === undefined ||
      monthlyContribution === undefined ||
      annualReturn === undefined ||
      years === undefined
    ) {
      return res.status(400).json({
        message: 'Please provide all required fields: initialInvestment, monthlyContribution, annualReturn, years'
      });
    }

    // Validate numeric values
    if (
      isNaN(initialInvestment) ||
      isNaN(monthlyContribution) ||
      isNaN(annualReturn) ||
      isNaN(years)
    ) {
      return res.status(400).json({ message: 'All fields must be valid numbers' });
    }

    // Validate positive values
    if (initialInvestment < 0 || monthlyContribution < 0 || years <= 0) {
      return res.status(400).json({
        message: 'Initial investment and monthly contribution must be non-negative, years must be positive'
      });
    }

    // Calculate investment projection
    const projection = calculateCompoundInterest(
      Number(initialInvestment),
      Number(monthlyContribution),
      Number(annualReturn),
      Number(years)
    );

    res.json(projection);
  } catch (error) {
    console.error('Investment simulation error:', error.message);
    res.status(500).json({ message: 'Server error while calculating investment projection' });
  }
});

module.exports = router;
