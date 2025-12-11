const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getNetWorth,
  getSpendingBreakdown,
  getSavingTips,
  runInvestmentSimulation,
  runRetirementSimulation
} = require('../controllers/reportController');

const router = express.Router();

// @route   GET /api/reports/networth
// @desc    Calculate user's current net worth (assets - debts)
// @access  Private
router.get('/networth', protect, getNetWorth);

// @route   GET /api/reports/spending-breakdown
// @desc    Get spending breakdown by category for current month
// @access  Private
router.get('/spending-breakdown', protect, getSpendingBreakdown);

// @route   GET /api/reports/saving-tips
// @desc    Get user's financial summary for the last 90 days with AI saving tips
// @access  Private
router.get('/saving-tips', protect, getSavingTips);

// @route   POST /api/reports/simulations/investment
// @desc    Calculate future value of investment with compound interest
// @access  Private
router.post('/simulations/investment', protect, runInvestmentSimulation);

// @route   POST /api/reports/simulations/retirement
// @desc    Calculate retirement future value with inflation adjustment
// @access  Private
router.post('/simulations/retirement', protect, runRetirementSimulation);

module.exports = router;
