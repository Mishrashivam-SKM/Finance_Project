/**
 * Security and Authentication Integration Tests
 * Tests for user registration, login, JWT tokens, and protected routes
 */

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');

// Models
const User = require('../models/User');
const Category = require('../models/Category');

// Routes
const authRoutes = require('../routes/auth.routes');
const transactionRoutes = require('../routes/transactions.routes');
const assetRoutes = require('../routes/asset.routes');
const debtRoutes = require('../routes/debt.routes');
const budgetRoutes = require('../routes/budget.routes');
const reportRoutes = require('../routes/reports.routes');

// Setup Express app for testing
const app = express();
app.use(express.json());

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/reports', reportRoutes);

// Set JWT_SECRET for testing
process.env.JWT_SECRET = 'test-jwt-secret-for-integration-tests';

describe('Security and Authentication Tests', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  // ==================== USER REGISTRATION TESTS ====================

  describe('POST /api/auth/register', () => {
    it('should successfully register a new user', async () => {
      const userData = {
        email: 'testuser@example.com',
        username: 'testuser',
        password: 'TestPassword123'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('email', userData.email);
      expect(res.body).toHaveProperty('username', userData.username);
      expect(res.body).toHaveProperty('role', 'user');
      expect(res.body).toHaveProperty('token');
      expect(res.body).not.toHaveProperty('password');
    });

    it('should return valid JWT token structure on registration', async () => {
      const userData = {
        email: 'jwttest@example.com',
        username: 'jwtuser',
        password: 'TestPassword123'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();

      // Verify JWT structure
      const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
      expect(decoded).toHaveProperty('id');
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
      expect(decoded.id).toBe(res.body._id);
    });

    it('should reject registration with missing required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'incomplete@example.com' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should reject registration with duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        username: 'user1',
        password: 'TestPassword123'
      };

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Second registration with same email
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          username: 'user2',
          password: 'TestPassword456'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already exists');
    });
  });

  // ==================== USER LOGIN TESTS ====================

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a user for login tests
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'logintest@example.com',
          username: 'loginuser',
          password: 'LoginPassword123'
        });
    });

    it('should successfully login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'LoginPassword123'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('email', 'logintest@example.com');
      expect(res.body).toHaveProperty('username', 'loginuser');
      expect(res.body).toHaveProperty('token');
    });

    it('should return valid JWT token structure on login', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'LoginPassword123'
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();

      // Verify JWT structure
      const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
      expect(decoded).toHaveProperty('id');
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
    });

    it('should reject login with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'LoginPassword123'
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should reject login with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'WrongPassword'
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should reject login with missing credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });
  });

  // ==================== GET CURRENT USER TESTS ====================

  describe('GET /api/auth/me', () => {
    let userToken;
    let userId;

    beforeEach(async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'metest@example.com',
          username: 'meuser',
          password: 'MePassword123'
        });

      userToken = registerRes.body.token;
      userId = registerRes.body._id;
    });

    it('should return current user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('_id', userId);
      expect(res.body).toHaveProperty('email', 'metest@example.com');
      expect(res.body).toHaveProperty('username', 'meuser');
      expect(res.body).not.toHaveProperty('password');
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });

    it('should return 401 with malformed authorization header', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'NotBearer token');

      expect(res.status).toBe(401);
    });
  });

  // ==================== PROTECTED ROUTES TESTS ====================

  describe('Protected Routes - Authentication Required', () => {
    const protectedEndpoints = [
      { method: 'get', path: '/api/transactions' },
      { method: 'post', path: '/api/transactions' },
      { method: 'get', path: '/api/assets' },
      { method: 'post', path: '/api/assets' },
      { method: 'get', path: '/api/debts' },
      { method: 'post', path: '/api/debts' },
      { method: 'get', path: '/api/budgets' },
      { method: 'post', path: '/api/budgets' },
      { method: 'get', path: '/api/reports/networth' },
      { method: 'get', path: '/api/reports/spending-breakdown' },
      { method: 'get', path: '/api/reports/saving-tips' },
      { method: 'post', path: '/api/reports/simulations/investment' },
      { method: 'post', path: '/api/reports/simulations/retirement' }
    ];

    protectedEndpoints.forEach(({ method, path }) => {
      it(`should return 401 for ${method.toUpperCase()} ${path} without token`, async () => {
        const res = await request(app)[method](path);

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toMatch(/not authorized|no token/i);
      });
    });

    it('should return 401 for PUT /api/transactions/:id without token', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).put(`/api/transactions/${fakeId}`);

      expect(res.status).toBe(401);
    });

    it('should return 401 for DELETE /api/transactions/:id without token', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).delete(`/api/transactions/${fakeId}`);

      expect(res.status).toBe(401);
    });

    it('should return 401 for PUT /api/assets/:id without token', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).put(`/api/assets/${fakeId}`);

      expect(res.status).toBe(401);
    });

    it('should return 401 for DELETE /api/assets/:id without token', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).delete(`/api/assets/${fakeId}`);

      expect(res.status).toBe(401);
    });

    it('should return 401 for PUT /api/debts/:id without token', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).put(`/api/debts/${fakeId}`);

      expect(res.status).toBe(401);
    });

    it('should return 401 for DELETE /api/debts/:id without token', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).delete(`/api/debts/${fakeId}`);

      expect(res.status).toBe(401);
    });
  });

  // ==================== TOKEN EXPIRATION TESTS ====================

  describe('JWT Token Validation', () => {
    it('should reject expired token', async () => {
      // Create user first
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'expiredtest@example.com',
          username: 'expireduser',
          password: 'Password123'
        });

      // Create an expired token
      const expiredToken = jwt.sign(
        { id: registerRes.body._id },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Already expired
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
    });

    it('should reject token with wrong secret', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'wrongsecret@example.com',
          username: 'wrongsecretuser',
          password: 'Password123'
        });

      // Create token with wrong secret
      const wrongSecretToken = jwt.sign(
        { id: registerRes.body._id },
        'wrong-secret-key',
        { expiresIn: '30d' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${wrongSecretToken}`);

      expect(res.status).toBe(401);
    });
  });
});
