const express = require('express');
const mongoose = require('mongoose');
const Asset = require('../models/Asset');
const Debt = require('../models/Debt');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');
const { calculateCompoundInterest, calculateRetirementFutureValue } = require('../utils/financialCalculations');
const { generateSavingTipFromAI } = require('../utils/geminiAI');

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

// @route   GET /api/reports/saving-tips
// @desc    Get user's financial summary for the last 90 days (income, expenses, top category, assets, debts)
// @access  Private
router.get('/saving-tips', protect, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user);

    // Calculate date 90 days ago
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Aggregate total income and expenses for the last 90 days
    const transactionSummary = await Transaction.aggregate([
      {
        $match: {
          userId: userId,
          date: { $gte: ninetyDaysAgo, $lte: now }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Parse income and expenses from aggregation result
    let totalIncome = 0;
    let totalExpenses = 0;
    transactionSummary.forEach(item => {
      if (item._id === 'income') {
        totalIncome = item.total;
      } else if (item._id === 'expense') {
        totalExpenses = item.total;
      }
    });

    // Get highest spending category for the last 90 days
    const spendingByCategory = await Transaction.aggregate([
      {
        $match: {
          userId: userId,
          type: 'expense',
          date: { $gte: ninetyDaysAgo, $lte: now }
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
        $unwind: {
          path: '$categoryInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 0,
          categoryId: '$_id',
          categoryName: { $ifNull: ['$categoryInfo.name', 'Unknown'] },
          totalSpent: 1
        }
      },
      {
        $sort: { totalSpent: -1 }
      },
      {
        $limit: 1
      }
    ]);

    const highestSpendingCategory = spendingByCategory.length > 0
      ? spendingByCategory[0]
      : { categoryName: 'N/A', totalSpent: 0 };

    // Get user's assets summary
    const assets = await Asset.find({ userId: userId })
      .select('name currentValue')
      .lean();

    const assetsSummary = assets.map(asset => ({
      name: asset.name,
      value: asset.currentValue
    }));

    const totalAssetsValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);

    // Get user's debts summary
    const debts = await Debt.find({ userId: userId })
      .select('name remainingBalance')
      .lean();

    const debtsSummary = debts.map(debt => ({
      name: debt.name,
      balance: debt.remainingBalance
    }));

    const totalDebtsBalance = debts.reduce((sum, debt) => sum + debt.remainingBalance, 0);

    // Calculate net worth and savings rate
    const netWorth = totalAssetsValue - totalDebtsBalance;
    const savingsRate = totalIncome > 0
      ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100)
      : 0;

    // Prepare financial data for AI
    const financialData = {
      period: {
        startDate: ninetyDaysAgo.toISOString(),
        endDate: now.toISOString(),
        days: 90
      },
      income: {
        total: totalIncome
      },
      expenses: {
        total: totalExpenses,
        highestCategory: {
          name: highestSpendingCategory.categoryName,
          amount: highestSpendingCategory.totalSpent
        }
      },
      savingsRate,
      assets: {
        items: assetsSummary,
        totalValue: totalAssetsValue
      },
      debts: {
        items: debtsSummary,
        totalBalance: totalDebtsBalance
      },
      netWorth
    };

    // Generate AI tip (don't fail the whole request if AI fails)
    let aiTip = null;
    try {
      if (process.env.GEMINI_API_KEY) {
        aiTip = await generateSavingTipFromAI(financialData);
      }
    } catch (aiError) {
      console.error('AI tip generation failed:', aiError.message);
      // Continue without AI tip
    }

    res.json({
      ...financialData,
      aiTip
    });
  } catch (error) {
    console.error('Saving tips data error:', error.message);
    res.status(500).json({ message: 'Server error while fetching financial summary' });
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

// @route   POST /api/simulations/retirement
// @desc    Calculate retirement future value with inflation adjustment
// @access  Private
router.post('/simulations/retirement', protect, async (req, res) => {
  try {
    const { currentSavings, annualContribution, annualReturn, inflationRate, yearsUntilRetirement } = req.body;

    // Validate required fields
    if (
      currentSavings === undefined ||
      annualContribution === undefined ||
      annualReturn === undefined ||
      inflationRate === undefined ||
      yearsUntilRetirement === undefined
    ) {
      return res.status(400).json({
        message: 'Please provide all required fields: currentSavings, annualContribution, annualReturn, inflationRate, yearsUntilRetirement'
      });
    }

    // Validate numeric values
    if (
      isNaN(currentSavings) ||
      isNaN(annualContribution) ||
      isNaN(annualReturn) ||
      isNaN(inflationRate) ||
      isNaN(yearsUntilRetirement)
    ) {
      return res.status(400).json({ message: 'All fields must be valid numbers' });
    }

    // Validate positive values
    if (currentSavings < 0 || annualContribution < 0 || yearsUntilRetirement <= 0) {
      return res.status(400).json({
        message: 'Current savings and annual contribution must be non-negative, years until retirement must be positive'
      });
    }

    // Validate reasonable percentage values
    if (inflationRate < 0 || inflationRate > 100) {
      return res.status(400).json({
        message: 'Inflation rate must be between 0 and 100'
      });
    }

    // Calculate retirement projection
    const projection = calculateRetirementFutureValue(
      Number(currentSavings),
      Number(annualContribution),
      Number(annualReturn),
      Number(inflationRate),
      Number(yearsUntilRetirement)
    );

    res.json(projection);
  } catch (error) {
    console.error('Retirement simulation error:', error.message);
    res.status(500).json({ message: 'Server error while calculating retirement projection' });
  }
});

module.exports = router;
