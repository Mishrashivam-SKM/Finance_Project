/**
 * Aggregation and Simulations Integration Tests
 * Tests for net worth calculation, investment/retirement simulations, and AI saving tips
 */

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');

// Models
const User = require('../models/User');
const Category = require('../models/Category');
const Asset = require('../models/Asset');
const Debt = require('../models/Debt');
const Transaction = require('../models/Transaction');

// Routes
const authRoutes = require('../routes/auth.routes');
const reportRoutes = require('../routes/reports.routes');

// Financial Calculations
const { calculateCompoundInterest, calculateRetirementFutureValue } = require('../utils/financialCalculations');

// Setup Express app for testing
const app = express();
app.use(express.json());

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);

// Set environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret-for-integration-tests';

describe('Aggregation and Simulations Tests', () => {
  let userToken, userId;
  let testAssetCategory, testDebtCategory;

  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    // Create test categories
    testAssetCategory = await Category.create({
      name: 'Test Asset Category',
      type: 'asset',
      group: 'Test'
    });

    testDebtCategory = await Category.create({
      name: 'Test Debt Category',
      type: 'debt',
      group: 'Test'
    });

    // Register test user
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'testuser@example.com',
        username: 'testuser',
        password: 'TestPassword123'
      });
    userToken = userRes.body.token;
    userId = userRes.body._id;
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  // ==================== NET WORTH CALCULATION TESTS ====================

  describe('GET /api/reports/networth', () => {
    it('should calculate net worth correctly with known assets and debts', async () => {
      // Insert known assets directly into database
      await Asset.create([
        {
          userId: new mongoose.Types.ObjectId(userId),
          category: testAssetCategory._id,
          name: 'House',
          currentValue: 250000,
          valueHistory: [{ date: new Date(), value: 250000 }]
        },
        {
          userId: new mongoose.Types.ObjectId(userId),
          category: testAssetCategory._id,
          name: 'Car',
          currentValue: 25000,
          valueHistory: [{ date: new Date(), value: 25000 }]
        },
        {
          userId: new mongoose.Types.ObjectId(userId),
          category: testAssetCategory._id,
          name: 'Savings',
          currentValue: 15000,
          valueHistory: [{ date: new Date(), value: 15000 }]
        }
      ]);

      // Insert known debts directly into database
      await Debt.create([
        {
          userId: new mongoose.Types.ObjectId(userId),
          category: testDebtCategory._id,
          name: 'Mortgage',
          originalAmount: 200000,
          remainingBalance: 175000,
          interestRate: 4.5
        },
        {
          userId: new mongoose.Types.ObjectId(userId),
          category: testDebtCategory._id,
          name: 'Car Loan',
          originalAmount: 20000,
          remainingBalance: 12000,
          interestRate: 6.0
        },
        {
          userId: new mongoose.Types.ObjectId(userId),
          category: testDebtCategory._id,
          name: 'Credit Card',
          originalAmount: 5000,
          remainingBalance: 3000,
          interestRate: 18.0
        }
      ]);

      // Expected values
      const expectedTotalAssets = 250000 + 25000 + 15000; // 290000
      const expectedTotalDebts = 175000 + 12000 + 3000;   // 190000
      const expectedNetWorth = expectedTotalAssets - expectedTotalDebts; // 100000

      const res = await request(app)
        .get('/api/reports/networth')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalAssets', expectedTotalAssets);
      expect(res.body).toHaveProperty('totalDebts', expectedTotalDebts);
      expect(res.body).toHaveProperty('netWorth', expectedNetWorth);
    });

    it('should return zero net worth when no assets or debts exist', async () => {
      const res = await request(app)
        .get('/api/reports/networth')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.totalAssets).toBe(0);
      expect(res.body.totalDebts).toBe(0);
      expect(res.body.netWorth).toBe(0);
    });

    it('should calculate positive net worth when assets > debts', async () => {
      await Asset.create({
        userId: new mongoose.Types.ObjectId(userId),
        category: testAssetCategory._id,
        name: 'Savings',
        currentValue: 50000,
        valueHistory: [{ date: new Date(), value: 50000 }]
      });

      await Debt.create({
        userId: new mongoose.Types.ObjectId(userId),
        category: testDebtCategory._id,
        name: 'Loan',
        originalAmount: 10000,
        remainingBalance: 5000,
        interestRate: 5.0
      });

      const res = await request(app)
        .get('/api/reports/networth')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.netWorth).toBe(45000); // 50000 - 5000
    });

    it('should calculate negative net worth when debts > assets', async () => {
      await Asset.create({
        userId: new mongoose.Types.ObjectId(userId),
        category: testAssetCategory._id,
        name: 'Savings',
        currentValue: 10000,
        valueHistory: [{ date: new Date(), value: 10000 }]
      });

      await Debt.create({
        userId: new mongoose.Types.ObjectId(userId),
        category: testDebtCategory._id,
        name: 'Student Loan',
        originalAmount: 50000,
        remainingBalance: 45000,
        interestRate: 6.0
      });

      const res = await request(app)
        .get('/api/reports/networth')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.netWorth).toBe(-35000); // 10000 - 45000
    });
  });

  // ==================== INVESTMENT SIMULATION TESTS ====================

  describe('POST /api/reports/simulations/investment', () => {
    it('should calculate investment projection with mathematically accurate results', async () => {
      const investmentData = {
        initialInvestment: 10000,
        monthlyContribution: 500,
        annualReturn: 7,
        years: 10
      };

      const res = await request(app)
        .post('/api/reports/simulations/investment')
        .set('Authorization', `Bearer ${userToken}`)
        .send(investmentData);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('finalValue');
      expect(res.body).toHaveProperty('totalContributions');
      expect(res.body).toHaveProperty('totalInterestEarned');
      expect(res.body).toHaveProperty('yearlyProjections');
      expect(res.body.yearlyProjections.length).toBe(10);

      // Verify against utility function
      const expected = calculateCompoundInterest(10000, 500, 7, 10);
      expect(res.body.finalValue).toBe(expected.finalValue);
      expect(res.body.totalContributions).toBe(expected.totalContributions);
      expect(res.body.totalInterestEarned).toBe(expected.totalInterestEarned);
    });

    it('should calculate investment with zero monthly contribution', async () => {
      const investmentData = {
        initialInvestment: 10000,
        monthlyContribution: 0,
        annualReturn: 8,
        years: 5
      };

      const res = await request(app)
        .post('/api/reports/simulations/investment')
        .set('Authorization', `Bearer ${userToken}`)
        .send(investmentData);

      expect(res.status).toBe(200);

      // Verify against utility function
      const expected = calculateCompoundInterest(10000, 0, 8, 5);
      expect(res.body.finalValue).toBe(expected.finalValue);
    });

    it('should calculate investment with zero initial investment', async () => {
      const investmentData = {
        initialInvestment: 0,
        monthlyContribution: 1000,
        annualReturn: 10,
        years: 20
      };

      const res = await request(app)
        .post('/api/reports/simulations/investment')
        .set('Authorization', `Bearer ${userToken}`)
        .send(investmentData);

      expect(res.status).toBe(200);

      // Verify against utility function
      const expected = calculateCompoundInterest(0, 1000, 10, 20);
      expect(res.body.finalValue).toBe(expected.finalValue);
      expect(res.body.totalContributions).toBe(expected.totalContributions);
    });

    it('should reject investment simulation with missing fields', async () => {
      const res = await request(app)
        .post('/api/reports/simulations/investment')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ initialInvestment: 10000 });

      expect(res.status).toBe(400);
    });

    it('should reject investment simulation with negative values', async () => {
      const res = await request(app)
        .post('/api/reports/simulations/investment')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          initialInvestment: -1000,
          monthlyContribution: 500,
          annualReturn: 7,
          years: 10
        });

      expect(res.status).toBe(400);
    });

    it('should reject investment simulation with zero years', async () => {
      const res = await request(app)
        .post('/api/reports/simulations/investment')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          initialInvestment: 10000,
          monthlyContribution: 500,
          annualReturn: 7,
          years: 0
        });

      expect(res.status).toBe(400);
    });
  });

  // ==================== RETIREMENT SIMULATION TESTS ====================

  describe('POST /api/reports/simulations/retirement', () => {
    it('should calculate retirement projection with mathematically accurate results', async () => {
      const retirementData = {
        currentSavings: 50000,
        annualContribution: 12000,
        annualReturn: 7,
        inflationRate: 3,
        yearsUntilRetirement: 25
      };

      const res = await request(app)
        .post('/api/reports/simulations/retirement')
        .set('Authorization', `Bearer ${userToken}`)
        .send(retirementData);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('projectedNominalValue');
      expect(res.body).toHaveProperty('projectedInflationAdjustedValue');
      expect(res.body).toHaveProperty('totalContributions');
      expect(res.body).toHaveProperty('realRateOfReturn');
      expect(res.body).toHaveProperty('yearlyProjections');
      expect(res.body.yearlyProjections.length).toBe(25);

      // Verify against utility function
      const expected = calculateRetirementFutureValue(50000, 12000, 7, 3, 25);
      expect(res.body.projectedNominalValue).toBe(expected.projectedNominalValue);
      expect(res.body.projectedInflationAdjustedValue).toBe(expected.projectedInflationAdjustedValue);
      expect(res.body.totalContributions).toBe(expected.totalContributions);
    });

    it('should calculate retirement with different inflation rates', async () => {
      const lowInflation = {
        currentSavings: 100000,
        annualContribution: 20000,
        annualReturn: 8,
        inflationRate: 2,
        yearsUntilRetirement: 20
      };

      const highInflation = {
        currentSavings: 100000,
        annualContribution: 20000,
        annualReturn: 8,
        inflationRate: 5,
        yearsUntilRetirement: 20
      };

      const resLow = await request(app)
        .post('/api/reports/simulations/retirement')
        .set('Authorization', `Bearer ${userToken}`)
        .send(lowInflation);

      const resHigh = await request(app)
        .post('/api/reports/simulations/retirement')
        .set('Authorization', `Bearer ${userToken}`)
        .send(highInflation);

      expect(resLow.status).toBe(200);
      expect(resHigh.status).toBe(200);

      // Same nominal values, different inflation-adjusted values
      expect(resLow.body.projectedNominalValue).toBe(resHigh.body.projectedNominalValue);
      expect(resLow.body.projectedInflationAdjustedValue).toBeGreaterThan(resHigh.body.projectedInflationAdjustedValue);
    });

    it('should calculate real rate of return correctly', async () => {
      const retirementData = {
        currentSavings: 10000,
        annualContribution: 5000,
        annualReturn: 7,
        inflationRate: 3,
        yearsUntilRetirement: 10
      };

      const res = await request(app)
        .post('/api/reports/simulations/retirement')
        .set('Authorization', `Bearer ${userToken}`)
        .send(retirementData);

      expect(res.status).toBe(200);

      // Real rate = (1 + 0.07) / (1 + 0.03) - 1 ≈ 3.88%
      const expectedRealRate = ((1 + 0.07) / (1 + 0.03) - 1) * 100;
      expect(res.body.realRateOfReturn).toBeCloseTo(expectedRealRate, 0);
    });

    it('should reject retirement simulation with missing fields', async () => {
      const res = await request(app)
        .post('/api/reports/simulations/retirement')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ currentSavings: 50000 });

      expect(res.status).toBe(400);
    });

    it('should reject retirement simulation with invalid inflation rate', async () => {
      const res = await request(app)
        .post('/api/reports/simulations/retirement')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentSavings: 50000,
          annualContribution: 12000,
          annualReturn: 7,
          inflationRate: 150, // Invalid: > 100
          yearsUntilRetirement: 25
        });

      expect(res.status).toBe(400);
    });
  });

  // ==================== SAVING TIPS TESTS ====================

  describe('GET /api/reports/saving-tips', () => {
    beforeEach(async () => {
      // Create expense category
      const expenseCategory = await Category.create({
        name: 'Food & Dining',
        type: 'expense',
        group: 'Living'
      });

      const incomeCategory = await Category.create({
        name: 'Salary',
        type: 'income',
        group: 'Employment'
      });

      // Create test transactions for the last 90 days
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      await Transaction.create([
        {
          userId: new mongoose.Types.ObjectId(userId),
          category: incomeCategory._id,
          type: 'income',
          amount: 5000,
          date: thirtyDaysAgo
        },
        {
          userId: new mongoose.Types.ObjectId(userId),
          category: expenseCategory._id,
          type: 'expense',
          amount: 500,
          date: thirtyDaysAgo
        }
      ]);

      // Create test assets and debts
      await Asset.create({
        userId: new mongoose.Types.ObjectId(userId),
        category: testAssetCategory._id,
        name: 'Savings Account',
        currentValue: 20000,
        valueHistory: [{ date: new Date(), value: 20000 }]
      });

      await Debt.create({
        userId: new mongoose.Types.ObjectId(userId),
        category: testDebtCategory._id,
        name: 'Credit Card',
        originalAmount: 5000,
        remainingBalance: 2000,
        interestRate: 18.0
      });
    });

    it('should return financial summary with all required fields', async () => {
      const res = await request(app)
        .get('/api/reports/saving-tips')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('period');
      expect(res.body).toHaveProperty('income');
      expect(res.body).toHaveProperty('expenses');
      expect(res.body).toHaveProperty('savingsRate');
      expect(res.body).toHaveProperty('assets');
      expect(res.body).toHaveProperty('debts');
      expect(res.body).toHaveProperty('netWorth');
    });

    it('should calculate savings rate correctly', async () => {
      const res = await request(app)
        .get('/api/reports/saving-tips')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      
      // With income of 5000 and expenses of 500, savings rate should be 90%
      const expectedSavingsRate = Math.round(((5000 - 500) / 5000) * 100);
      expect(res.body.savingsRate).toBe(expectedSavingsRate);
    });

    it('should return AI tip when GEMINI_API_KEY is set (integration test)', async () => {
      // Note: This test will only pass if GEMINI_API_KEY is set
      // If not set, aiTip will be null which is also valid
      const res = await request(app)
        .get('/api/reports/saving-tips')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      
      // aiTip can be null if no API key is configured
      // or a string if the API is available
      if (process.env.GEMINI_API_KEY) {
        expect(res.body.aiTip).toBeDefined();
        expect(typeof res.body.aiTip).toBe('string');
        expect(res.body.aiTip.length).toBeGreaterThan(0);
      } else {
        // Without API key, aiTip should be null
        expect(res.body.aiTip).toBeNull();
      }
    });

    it('should handle user with no transactions', async () => {
      // Clear transactions
      await Transaction.deleteMany({ userId: new mongoose.Types.ObjectId(userId) });

      const res = await request(app)
        .get('/api/reports/saving-tips')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.income.total).toBe(0);
      expect(res.body.expenses.total).toBe(0);
      expect(res.body.savingsRate).toBe(0);
    });
  });

  // ==================== FINANCIAL CALCULATION UTILITY TESTS ====================

  describe('Financial Calculation Utilities', () => {
    describe('calculateCompoundInterest', () => {
      it('should calculate compound interest correctly', () => {
        const result = calculateCompoundInterest(10000, 500, 7, 10);

        // Verify structure
        expect(result).toHaveProperty('initialInvestment', 10000);
        expect(result).toHaveProperty('monthlyContribution', 500);
        expect(result).toHaveProperty('annualReturn', 7);
        expect(result).toHaveProperty('years', 10);
        expect(result).toHaveProperty('finalValue');
        expect(result).toHaveProperty('totalContributions');
        expect(result).toHaveProperty('totalInterestEarned');
        expect(result).toHaveProperty('yearlyProjections');

        // Verify calculations
        expect(result.yearlyProjections.length).toBe(10);
        expect(result.finalValue).toBeGreaterThan(result.totalContributions);
        expect(result.totalInterestEarned).toBe(
          Math.round((result.finalValue - result.totalContributions) * 100) / 100
        );
      });

      it('should handle zero monthly contribution', () => {
        const result = calculateCompoundInterest(10000, 0, 8, 5);

        expect(result.totalContributions).toBe(10000);
        expect(result.finalValue).toBeGreaterThan(10000);
      });

      it('should handle zero initial investment', () => {
        const result = calculateCompoundInterest(0, 1000, 10, 10);

        // Total contributions = 0 + (1000 * 12 * 10) = 120000
        expect(result.totalContributions).toBe(120000);
        expect(result.finalValue).toBeGreaterThan(120000);
      });
    });

    describe('calculateRetirementFutureValue', () => {
      it('should calculate retirement value with inflation adjustment', () => {
        const result = calculateRetirementFutureValue(50000, 12000, 7, 3, 25);

        // Verify structure
        expect(result).toHaveProperty('currentSavings', 50000);
        expect(result).toHaveProperty('annualContribution', 12000);
        expect(result).toHaveProperty('annualReturn', 7);
        expect(result).toHaveProperty('inflationRate', 3);
        expect(result).toHaveProperty('yearsUntilRetirement', 25);
        expect(result).toHaveProperty('realRateOfReturn');
        expect(result).toHaveProperty('projectedNominalValue');
        expect(result).toHaveProperty('projectedInflationAdjustedValue');
        expect(result).toHaveProperty('yearlyProjections');

        // Verify calculations
        expect(result.yearlyProjections.length).toBe(25);
        expect(result.projectedNominalValue).toBeGreaterThan(result.projectedInflationAdjustedValue);
      });

      it('should calculate real rate of return using Fisher equation', () => {
        const result = calculateRetirementFutureValue(10000, 5000, 10, 4, 5);

        // Real rate = (1 + 0.10) / (1 + 0.04) - 1 ≈ 5.77%
        const expectedRealRate = ((1 + 0.10) / (1 + 0.04) - 1) * 100;
        expect(result.realRateOfReturn).toBeCloseTo(expectedRealRate, 1);
      });

      it('should show purchasing power loss over time', () => {
        const result = calculateRetirementFutureValue(100000, 10000, 8, 3, 20);

        const lastYear = result.yearlyProjections[result.yearlyProjections.length - 1];
        expect(lastYear.purchasingPowerLoss).toBeGreaterThan(0);
        expect(lastYear.nominalValue).toBeGreaterThan(lastYear.inflationAdjustedValue);
      });
    });
  });
});
