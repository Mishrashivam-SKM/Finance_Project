/**
 * Core Financial CRUD and Ownership Integration Tests
 * Tests for Transactions, Assets, Debts, and Budgets CRUD operations
 * Also tests user ownership to ensure users cannot access other users' data
 */

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');

// Models
const User = require('../models/User');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const Asset = require('../models/Asset');
const Debt = require('../models/Debt');
const Budget = require('../models/Budget');

// Routes
const authRoutes = require('../routes/auth.routes');
const transactionRoutes = require('../routes/transactions.routes');
const assetRoutes = require('../routes/asset.routes');
const debtRoutes = require('../routes/debt.routes');
const budgetRoutes = require('../routes/budget.routes');

// Setup Express app for testing
const app = express();
app.use(express.json());

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/budgets', budgetRoutes);

// Set JWT_SECRET for testing
process.env.JWT_SECRET = 'test-jwt-secret-for-integration-tests';

describe('Core Financial CRUD and Ownership Tests', () => {
  let userAToken, userAId;
  let userBToken, userBId;
  let testCategory;

  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    // Create test category
    testCategory = await Category.create({
      name: 'Test Category',
      type: 'expense',
      group: 'Test'
    });

    // Register User A
    const userARes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'usera@example.com',
        username: 'userA',
        password: 'PasswordA123'
      });
    userAToken = userARes.body.token;
    userAId = userARes.body._id;

    // Register User B
    const userBRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'userb@example.com',
        username: 'userB',
        password: 'PasswordB123'
      });
    userBToken = userBRes.body.token;
    userBId = userBRes.body._id;
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  // ==================== TRANSACTION CRUD TESTS ====================

  describe('Transactions CRUD', () => {
    describe('POST /api/transactions', () => {
      it('should create a new transaction', async () => {
        const transactionData = {
          category: testCategory._id.toString(),
          type: 'expense',
          amount: 100.50,
          date: new Date().toISOString(),
          description: 'Test expense'
        };

        const res = await request(app)
          .post('/api/transactions')
          .set('Authorization', `Bearer ${userAToken}`)
          .send(transactionData);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('_id');
        expect(res.body.amount).toBe(100.50);
        expect(res.body.type).toBe('expense');
        expect(res.body.description).toBe('Test expense');
      });

      it('should reject transaction with missing required fields', async () => {
        const res = await request(app)
          .post('/api/transactions')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ description: 'Incomplete' });

        expect(res.status).toBe(400);
      });
    });

    describe('GET /api/transactions', () => {
      it('should get all transactions for authenticated user', async () => {
        // Create transactions for User A
        await request(app)
          .post('/api/transactions')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({
            category: testCategory._id.toString(),
            type: 'expense',
            amount: 50,
            date: new Date().toISOString()
          });

        await request(app)
          .post('/api/transactions')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({
            category: testCategory._id.toString(),
            type: 'income',
            amount: 200,
            date: new Date().toISOString()
          });

        const res = await request(app)
          .get('/api/transactions')
          .set('Authorization', `Bearer ${userAToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2);
      });

      it('should only return transactions belonging to the authenticated user', async () => {
        // Create transaction for User A
        await request(app)
          .post('/api/transactions')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({
            category: testCategory._id.toString(),
            type: 'expense',
            amount: 100,
            date: new Date().toISOString()
          });

        // Create transaction for User B
        await request(app)
          .post('/api/transactions')
          .set('Authorization', `Bearer ${userBToken}`)
          .send({
            category: testCategory._id.toString(),
            type: 'expense',
            amount: 200,
            date: new Date().toISOString()
          });

        // User A should only see their transaction
        const resA = await request(app)
          .get('/api/transactions')
          .set('Authorization', `Bearer ${userAToken}`);

        expect(resA.body.length).toBe(1);
        expect(resA.body[0].amount).toBe(100);

        // User B should only see their transaction
        const resB = await request(app)
          .get('/api/transactions')
          .set('Authorization', `Bearer ${userBToken}`);

        expect(resB.body.length).toBe(1);
        expect(resB.body[0].amount).toBe(200);
      });
    });

    describe('PUT /api/transactions/:id', () => {
      let userATransaction;

      beforeEach(async () => {
        const res = await request(app)
          .post('/api/transactions')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({
            category: testCategory._id.toString(),
            type: 'expense',
            amount: 100,
            date: new Date().toISOString(),
            description: 'Original'
          });
        userATransaction = res.body;
      });

      it('should update own transaction', async () => {
        const res = await request(app)
          .put(`/api/transactions/${userATransaction._id}`)
          .set('Authorization', `Bearer ${userAToken}`)
          .send({
            amount: 150,
            description: 'Updated'
          });

        expect(res.status).toBe(200);
        expect(res.body.amount).toBe(150);
        expect(res.body.description).toBe('Updated');
      });

      it('should NOT allow User B to update User A transaction', async () => {
        const res = await request(app)
          .put(`/api/transactions/${userATransaction._id}`)
          .set('Authorization', `Bearer ${userBToken}`)
          .send({
            amount: 999,
            description: 'Hacked'
          });

        expect([401, 404]).toContain(res.status);
      });

      it('should return 404 for non-existent transaction', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
          .put(`/api/transactions/${fakeId}`)
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ amount: 100 });

        expect(res.status).toBe(404);
      });
    });

    describe('DELETE /api/transactions/:id', () => {
      let userATransaction;

      beforeEach(async () => {
        const res = await request(app)
          .post('/api/transactions')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({
            category: testCategory._id.toString(),
            type: 'expense',
            amount: 100,
            date: new Date().toISOString()
          });
        userATransaction = res.body;
      });

      it('should delete own transaction', async () => {
        const res = await request(app)
          .delete(`/api/transactions/${userATransaction._id}`)
          .set('Authorization', `Bearer ${userAToken}`);

        expect(res.status).toBe(200);

        // Verify deletion
        const getRes = await request(app)
          .get('/api/transactions')
          .set('Authorization', `Bearer ${userAToken}`);

        expect(getRes.body.length).toBe(0);
      });

      it('should NOT allow User B to delete User A transaction', async () => {
        const res = await request(app)
          .delete(`/api/transactions/${userATransaction._id}`)
          .set('Authorization', `Bearer ${userBToken}`);

        expect([401, 404]).toContain(res.status);

        // Verify transaction still exists
        const getRes = await request(app)
          .get('/api/transactions')
          .set('Authorization', `Bearer ${userAToken}`);

        expect(getRes.body.length).toBe(1);
      });
    });
  });

  // ==================== ASSET CRUD TESTS ====================

  describe('Assets CRUD', () => {
    describe('POST /api/assets', () => {
      it('should create a new asset', async () => {
        const assetData = {
          category: testCategory._id.toString(),
          name: 'Test Asset',
          currentValue: 50000
        };

        const res = await request(app)
          .post('/api/assets')
          .set('Authorization', `Bearer ${userAToken}`)
          .send(assetData);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('_id');
        expect(res.body.name).toBe('Test Asset');
        expect(res.body.currentValue).toBe(50000);
        expect(res.body.valueHistory.length).toBe(1);
      });

      it('should reject asset with missing required fields', async () => {
        const res = await request(app)
          .post('/api/assets')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ name: 'Incomplete' });

        expect(res.status).toBe(400);
      });
    });

    describe('GET /api/assets', () => {
      it('should get all assets for authenticated user', async () => {
        await request(app)
          .post('/api/assets')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({
            category: testCategory._id.toString(),
            name: 'Asset 1',
            currentValue: 10000
          });

        await request(app)
          .post('/api/assets')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({
            category: testCategory._id.toString(),
            name: 'Asset 2',
            currentValue: 20000
          });

        const res = await request(app)
          .get('/api/assets')
          .set('Authorization', `Bearer ${userAToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2);
      });

      it('should only return assets belonging to the authenticated user', async () => {
        // Create asset for User A
        await request(app)
          .post('/api/assets')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({
            category: testCategory._id.toString(),
            name: 'User A Asset',
            currentValue: 10000
          });

        // Create asset for User B
        await request(app)
          .post('/api/assets')
          .set('Authorization', `Bearer ${userBToken}`)
          .send({
            category: testCategory._id.toString(),
            name: 'User B Asset',
            currentValue: 20000
          });

        // User A should only see their asset
        const resA = await request(app)
          .get('/api/assets')
          .set('Authorization', `Bearer ${userAToken}`);

        expect(resA.body.length).toBe(1);
        expect(resA.body[0].name).toBe('User A Asset');
      });
    });

    describe('PUT /api/assets/:id', () => {
      let userAAsset;

      beforeEach(async () => {
        const res = await request(app)
          .post('/api/assets')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({
            category: testCategory._id.toString(),
            name: 'Original Asset',
            currentValue: 10000
          });
        userAAsset = res.body;
      });

      it('should update own asset', async () => {
        const res = await request(app)
          .put(`/api/assets/${userAAsset._id}`)
          .set('Authorization', `Bearer ${userAToken}`)
          .send({
            name: 'Updated Asset',
            currentValue: 15000
          });

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Updated Asset');
        expect(res.body.currentValue).toBe(15000);
        expect(res.body.valueHistory.length).toBe(2); // Initial + update
      });

      it('should NOT allow User B to update User A asset', async () => {
        const res = await request(app)
          .put(`/api/assets/${userAAsset._id}`)
          .set('Authorization', `Bearer ${userBToken}`)
          .send({
            name: 'Hacked Asset',
            currentValue: 999999
          });

        expect([401, 404]).toContain(res.status);
      });
    });

    describe('DELETE /api/assets/:id', () => {
      let userAAsset;

      beforeEach(async () => {
        const res = await request(app)
          .post('/api/assets')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({
            category: testCategory._id.toString(),
            name: 'Test Asset',
            currentValue: 10000
          });
        userAAsset = res.body;
      });

      it('should delete own asset', async () => {
        const res = await request(app)
          .delete(`/api/assets/${userAAsset._id}`)
          .set('Authorization', `Bearer ${userAToken}`);

        expect(res.status).toBe(200);

        // Verify deletion
        const getRes = await request(app)
          .get('/api/assets')
          .set('Authorization', `Bearer ${userAToken}`);

        expect(getRes.body.length).toBe(0);
      });

      it('should NOT allow User B to delete User A asset', async () => {
        const res = await request(app)
          .delete(`/api/assets/${userAAsset._id}`)
          .set('Authorization', `Bearer ${userBToken}`);

        expect([401, 404]).toContain(res.status);

        // Verify asset still exists
        const getRes = await request(app)
          .get('/api/assets')
          .set('Authorization', `Bearer ${userAToken}`);

        expect(getRes.body.length).toBe(1);
      });
    });
  });

  // ==================== DEBT CRUD TESTS ====================

  describe('Debts CRUD', () => {
    describe('POST /api/debts', () => {
      it('should create a new debt', async () => {
        const debtData = {
          category: testCategory._id.toString(),
          name: 'Test Loan',
          originalAmount: 10000,
          remainingBalance: 8000,
          interestRate: 5.5,
          minimumPayment: 200
        };

        const res = await request(app)
          .post('/api/debts')
          .set('Authorization', `Bearer ${userAToken}`)
          .send(debtData);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('_id');
        expect(res.body.name).toBe('Test Loan');
        expect(res.body.originalAmount).toBe(10000);
        expect(res.body.remainingBalance).toBe(8000);
        expect(res.body.interestRate).toBe(5.5);
      });

      it('should reject debt with missing required fields', async () => {
        const res = await request(app)
          .post('/api/debts')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ name: 'Incomplete' });

        expect(res.status).toBe(400);
      });
    });

    describe('GET /api/debts', () => {
      it('should get all debts for authenticated user', async () => {
        await request(app)
          .post('/api/debts')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({
            category: testCategory._id.toString(),
            name: 'Debt 1',
            originalAmount: 5000,
            remainingBalance: 4000,
            interestRate: 4.5
          });

        await request(app)
          .post('/api/debts')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({
            category: testCategory._id.toString(),
            name: 'Debt 2',
            originalAmount: 10000,
            remainingBalance: 8000,
            interestRate: 6.0
          });

        const res = await request(app)
          .get('/api/debts')
          .set('Authorization', `Bearer ${userAToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2);
      });

      it('should only return debts belonging to the authenticated user', async () => {
        // Create debt for User A
        await request(app)
          .post('/api/debts')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({
            category: testCategory._id.toString(),
            name: 'User A Debt',
            originalAmount: 5000,
            remainingBalance: 4000,
            interestRate: 4.5
          });

        // Create debt for User B
        await request(app)
          .post('/api/debts')
          .set('Authorization', `Bearer ${userBToken}`)
          .send({
            category: testCategory._id.toString(),
            name: 'User B Debt',
            originalAmount: 10000,
            remainingBalance: 8000,
            interestRate: 6.0
          });

        // User A should only see their debt
        const resA = await request(app)
          .get('/api/debts')
          .set('Authorization', `Bearer ${userAToken}`);

        expect(resA.body.length).toBe(1);
        expect(resA.body[0].name).toBe('User A Debt');
      });
    });

    describe('PUT /api/debts/:id', () => {
      let userADebt;

      beforeEach(async () => {
        const res = await request(app)
          .post('/api/debts')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({
            category: testCategory._id.toString(),
            name: 'Original Debt',
            originalAmount: 10000,
            remainingBalance: 8000,
            interestRate: 5.5
          });
        userADebt = res.body;
      });

      it('should update own debt', async () => {
        const res = await request(app)
          .put(`/api/debts/${userADebt._id}`)
          .set('Authorization', `Bearer ${userAToken}`)
          .send({
            name: 'Updated Debt',
            remainingBalance: 7000
          });

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Updated Debt');
        expect(res.body.remainingBalance).toBe(7000);
      });

      it('should NOT allow User B to update User A debt', async () => {
        const res = await request(app)
          .put(`/api/debts/${userADebt._id}`)
          .set('Authorization', `Bearer ${userBToken}`)
          .send({
            name: 'Hacked Debt',
            remainingBalance: 0
          });

        expect([401, 404]).toContain(res.status);
      });
    });

    describe('DELETE /api/debts/:id', () => {
      let userADebt;

      beforeEach(async () => {
        const res = await request(app)
          .post('/api/debts')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({
            category: testCategory._id.toString(),
            name: 'Test Debt',
            originalAmount: 10000,
            remainingBalance: 8000,
            interestRate: 5.5
          });
        userADebt = res.body;
      });

      it('should delete own debt', async () => {
        const res = await request(app)
          .delete(`/api/debts/${userADebt._id}`)
          .set('Authorization', `Bearer ${userAToken}`);

        expect(res.status).toBe(200);

        // Verify deletion
        const getRes = await request(app)
          .get('/api/debts')
          .set('Authorization', `Bearer ${userAToken}`);

        expect(getRes.body.length).toBe(0);
      });

      it('should NOT allow User B to delete User A debt', async () => {
        const res = await request(app)
          .delete(`/api/debts/${userADebt._id}`)
          .set('Authorization', `Bearer ${userBToken}`);

        expect([401, 404]).toContain(res.status);

        // Verify debt still exists
        const getRes = await request(app)
          .get('/api/debts')
          .set('Authorization', `Bearer ${userAToken}`);

        expect(getRes.body.length).toBe(1);
      });
    });
  });

  // ==================== BUDGET CRUD TESTS ====================

  describe('Budgets CRUD', () => {
    describe('POST /api/budgets', () => {
      it('should create a new budget', async () => {
        const budgetData = {
          category: testCategory._id.toString(),
          month: 1,
          year: 2024,
          limitAmount: 500
        };

        const res = await request(app)
          .post('/api/budgets')
          .set('Authorization', `Bearer ${userAToken}`)
          .send(budgetData);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('_id');
        expect(res.body.limitAmount).toBe(500);
      });

      it('should reject budget with missing required fields', async () => {
        const res = await request(app)
          .post('/api/budgets')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ limitAmount: 500 });

        expect(res.status).toBe(400);
      });
    });

    describe('GET /api/budgets', () => {
      it('should get all budgets for authenticated user', async () => {
        await request(app)
          .post('/api/budgets')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({
            category: testCategory._id.toString(),
            month: 1,
            year: 2024,
            limitAmount: 500
          });

        await request(app)
          .post('/api/budgets')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({
            category: testCategory._id.toString(),
            month: 2,
            year: 2024,
            limitAmount: 600
          });

        const res = await request(app)
          .get('/api/budgets')
          .set('Authorization', `Bearer ${userAToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2);
      });

      it('should only return budgets belonging to the authenticated user', async () => {
        // Create budget for User A
        await request(app)
          .post('/api/budgets')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({
            category: testCategory._id.toString(),
            month: 1,
            year: 2024,
            limitAmount: 500
          });

        // Create a second category for User B to avoid unique constraint
        const userBCategory = await Category.create({
          name: 'User B Category',
          type: 'expense',
          group: 'Test'
        });

        // Create budget for User B
        await request(app)
          .post('/api/budgets')
          .set('Authorization', `Bearer ${userBToken}`)
          .send({
            category: userBCategory._id.toString(),
            month: 1,
            year: 2024,
            limitAmount: 1000
          });

        // User A should only see their budget
        const resA = await request(app)
          .get('/api/budgets')
          .set('Authorization', `Bearer ${userAToken}`);

        expect(resA.body.length).toBe(1);
        expect(resA.body[0].limitAmount).toBe(500);
      });
    });

    describe('PUT /api/budgets/:id', () => {
      let userABudget;

      beforeEach(async () => {
        const res = await request(app)
          .post('/api/budgets')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({
            category: testCategory._id.toString(),
            month: 1,
            year: 2024,
            limitAmount: 500
          });
        userABudget = res.body;
      });

      it('should update own budget', async () => {
        const res = await request(app)
          .put(`/api/budgets/${userABudget._id}`)
          .set('Authorization', `Bearer ${userAToken}`)
          .send({
            limitAmount: 750
          });

        expect(res.status).toBe(200);
        expect(res.body.limitAmount).toBe(750);
      });

      it('should NOT allow User B to update User A budget', async () => {
        const res = await request(app)
          .put(`/api/budgets/${userABudget._id}`)
          .set('Authorization', `Bearer ${userBToken}`)
          .send({
            limitAmount: 99999
          });

        expect([401, 404]).toContain(res.status);
      });
    });

    describe('DELETE /api/budgets/:id', () => {
      let userABudget;

      beforeEach(async () => {
        const res = await request(app)
          .post('/api/budgets')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({
            category: testCategory._id.toString(),
            month: 1,
            year: 2024,
            limitAmount: 500
          });
        userABudget = res.body;
      });

      it('should delete own budget', async () => {
        const res = await request(app)
          .delete(`/api/budgets/${userABudget._id}`)
          .set('Authorization', `Bearer ${userAToken}`);

        expect(res.status).toBe(200);

        // Verify deletion
        const getRes = await request(app)
          .get('/api/budgets')
          .set('Authorization', `Bearer ${userAToken}`);

        expect(getRes.body.length).toBe(0);
      });

      it('should NOT allow User B to delete User A budget', async () => {
        const res = await request(app)
          .delete(`/api/budgets/${userABudget._id}`)
          .set('Authorization', `Bearer ${userBToken}`);

        expect([401, 404]).toContain(res.status);

        // Verify budget still exists
        const getRes = await request(app)
          .get('/api/budgets')
          .set('Authorization', `Bearer ${userAToken}`);

        expect(getRes.body.length).toBe(1);
      });
    });
  });
});
