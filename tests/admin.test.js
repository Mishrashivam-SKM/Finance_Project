/**
 * Role-Based Access and Quizzes Integration Tests
 * Tests for admin-only routes, tips and quiz CRUD, and quiz submission logic
 */

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');

// Models
const User = require('../models/User');
const Tip = require('../models/Tip');
const QuizQuestion = require('../models/QuizQuestion');

// Routes
const authRoutes = require('../routes/auth.routes');
const adminRoutes = require('../routes/admin.routes');
const quizRoutes = require('../routes/quizzes.routes');

// Setup Express app for testing
const app = express();
app.use(express.json());

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/quizzes', quizRoutes);

// Set JWT_SECRET for testing
process.env.JWT_SECRET = 'test-jwt-secret-for-integration-tests';

describe('Role-Based Access and Quizzes Tests', () => {
  let regularUserToken, regularUserId;
  let adminUserToken, adminUserId;

  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    // Create regular user via API
    const regularUserRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'regular@example.com',
        username: 'regularuser',
        password: 'RegularPassword123'
      });
    regularUserToken = regularUserRes.body.token;
    regularUserId = regularUserRes.body._id;

    // Create admin user via API first
    const adminRegisterRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'admin@example.com',
        username: 'adminuser',
        password: 'AdminPassword123'
      });
    
    // Update the user to have admin role directly in database
    await User.findByIdAndUpdate(adminRegisterRes.body._id, { role: 'admin' });
    adminUserId = adminRegisterRes.body._id;

    // Login as admin to get token
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'AdminPassword123'
      });
    adminUserToken = adminLoginRes.body.token;
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  // ==================== ADMIN ACCESS CONTROL TESTS ====================

  describe('Admin Access Control', () => {
    describe('Regular User Access Restrictions', () => {
      it('should return 403 when regular user tries to POST /api/admin/tips', async () => {
        const res = await request(app)
          .post('/api/admin/tips')
          .set('Authorization', `Bearer ${regularUserToken}`)
          .send({
            title: 'Test Tip',
            body: 'This is a test tip body',
            category: 'Budgeting'
          });

        expect(res.status).toBe(403);
        expect(res.body.message).toMatch(/forbidden|admin/i);
      });

      it('should return 403 when regular user tries to GET /api/admin/tips', async () => {
        const res = await request(app)
          .get('/api/admin/tips')
          .set('Authorization', `Bearer ${regularUserToken}`);

        expect(res.status).toBe(403);
      });

      it('should return 403 when regular user tries to PUT /api/admin/tips/:id', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
          .put(`/api/admin/tips/${fakeId}`)
          .set('Authorization', `Bearer ${regularUserToken}`)
          .send({ title: 'Updated Title' });

        expect(res.status).toBe(403);
      });

      it('should return 403 when regular user tries to DELETE /api/admin/tips/:id', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
          .delete(`/api/admin/tips/${fakeId}`)
          .set('Authorization', `Bearer ${regularUserToken}`);

        expect(res.status).toBe(403);
      });

      it('should return 403 when regular user tries to POST /api/admin/quizzes', async () => {
        const res = await request(app)
          .post('/api/admin/quizzes')
          .set('Authorization', `Bearer ${regularUserToken}`)
          .send({
            questionText: 'Test Question?',
            options: ['A', 'B', 'C', 'D'],
            correctAnswerIndex: 0,
            category: 'Budgeting'
          });

        expect(res.status).toBe(403);
      });

      it('should return 403 when regular user tries to GET /api/admin/quizzes', async () => {
        const res = await request(app)
          .get('/api/admin/quizzes')
          .set('Authorization', `Bearer ${regularUserToken}`);

        expect(res.status).toBe(403);
      });
    });

    describe('Admin User Access', () => {
      it('should allow admin to access POST /api/admin/tips', async () => {
        const res = await request(app)
          .post('/api/admin/tips')
          .set('Authorization', `Bearer ${adminUserToken}`)
          .send({
            title: 'Admin Tip',
            body: 'This is an admin tip body',
            category: 'Budgeting'
          });

        expect(res.status).toBe(201);
      });

      it('should allow admin to access GET /api/admin/tips', async () => {
        const res = await request(app)
          .get('/api/admin/tips')
          .set('Authorization', `Bearer ${adminUserToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
      });

      it('should allow admin to access POST /api/admin/quizzes', async () => {
        const res = await request(app)
          .post('/api/admin/quizzes')
          .set('Authorization', `Bearer ${adminUserToken}`)
          .send({
            questionText: 'Admin Question?',
            options: ['A', 'B', 'C', 'D'],
            correctAnswerIndex: 0,
            category: 'Budgeting'
          });

        expect(res.status).toBe(201);
      });

      it('should allow admin to access GET /api/admin/quizzes', async () => {
        const res = await request(app)
          .get('/api/admin/quizzes')
          .set('Authorization', `Bearer ${adminUserToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
      });
    });
  });

  // ==================== TIP CRUD TESTS (Admin) ====================

  describe('Admin Tip CRUD Operations', () => {
    describe('POST /api/admin/tips', () => {
      it('should create a new tip', async () => {
        const tipData = {
          title: 'Save Money on Groceries',
          body: 'Buy in bulk and use coupons to save up to 30% on your grocery bills.',
          category: 'Saving',
          isPublished: true
        };

        const res = await request(app)
          .post('/api/admin/tips')
          .set('Authorization', `Bearer ${adminUserToken}`)
          .send(tipData);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('_id');
        expect(res.body.title).toBe(tipData.title);
        expect(res.body.body).toBe(tipData.body);
        expect(res.body.category).toBe(tipData.category);
        expect(res.body.isPublished).toBe(true);
        expect(res.body.adminId).toBe(adminUserId);
      });

      it('should reject tip with missing required fields', async () => {
        const res = await request(app)
          .post('/api/admin/tips')
          .set('Authorization', `Bearer ${adminUserToken}`)
          .send({ title: 'Incomplete Tip' });

        expect(res.status).toBe(400);
      });

      it('should create tip with default isPublished=true', async () => {
        const res = await request(app)
          .post('/api/admin/tips')
          .set('Authorization', `Bearer ${adminUserToken}`)
          .send({
            title: 'Default Published Tip',
            body: 'This tip should be published by default',
            category: 'Investing'
          });

        expect(res.status).toBe(201);
        expect(res.body.isPublished).toBe(true);
      });
    });

    describe('GET /api/admin/tips', () => {
      beforeEach(async () => {
        await Tip.create([
          {
            adminId: new mongoose.Types.ObjectId(adminUserId),
            title: 'Tip 1',
            body: 'Body 1',
            category: 'Budgeting',
            isPublished: true
          },
          {
            adminId: new mongoose.Types.ObjectId(adminUserId),
            title: 'Tip 2',
            body: 'Body 2',
            category: 'Saving',
            isPublished: false
          }
        ]);
      });

      it('should get all tips', async () => {
        const res = await request(app)
          .get('/api/admin/tips')
          .set('Authorization', `Bearer ${adminUserToken}`);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(2);
      });

      it('should include both published and unpublished tips', async () => {
        const res = await request(app)
          .get('/api/admin/tips')
          .set('Authorization', `Bearer ${adminUserToken}`);

        const published = res.body.filter(tip => tip.isPublished);
        const unpublished = res.body.filter(tip => !tip.isPublished);

        expect(published.length).toBe(1);
        expect(unpublished.length).toBe(1);
      });
    });

    describe('PUT /api/admin/tips/:id', () => {
      let testTip;

      beforeEach(async () => {
        testTip = await Tip.create({
          adminId: new mongoose.Types.ObjectId(adminUserId),
          title: 'Original Tip',
          body: 'Original Body',
          category: 'Budgeting',
          isPublished: true
        });
      });

      it('should update an existing tip', async () => {
        const res = await request(app)
          .put(`/api/admin/tips/${testTip._id}`)
          .set('Authorization', `Bearer ${adminUserToken}`)
          .send({
            title: 'Updated Tip',
            body: 'Updated Body',
            isPublished: false
          });

        expect(res.status).toBe(200);
        expect(res.body.title).toBe('Updated Tip');
        expect(res.body.body).toBe('Updated Body');
        expect(res.body.isPublished).toBe(false);
      });

      it('should return 404 for non-existent tip', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
          .put(`/api/admin/tips/${fakeId}`)
          .set('Authorization', `Bearer ${adminUserToken}`)
          .send({ title: 'Updated' });

        expect(res.status).toBe(404);
      });
    });

    describe('DELETE /api/admin/tips/:id', () => {
      let testTip;

      beforeEach(async () => {
        testTip = await Tip.create({
          adminId: new mongoose.Types.ObjectId(adminUserId),
          title: 'Tip to Delete',
          body: 'This tip will be deleted',
          category: 'Debt Management'
        });
      });

      it('should delete an existing tip', async () => {
        const res = await request(app)
          .delete(`/api/admin/tips/${testTip._id}`)
          .set('Authorization', `Bearer ${adminUserToken}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/removed|deleted/i);

        // Verify deletion
        const deletedTip = await Tip.findById(testTip._id);
        expect(deletedTip).toBeNull();
      });

      it('should return 404 for non-existent tip', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
          .delete(`/api/admin/tips/${fakeId}`)
          .set('Authorization', `Bearer ${adminUserToken}`);

        expect(res.status).toBe(404);
      });
    });
  });

  // ==================== QUIZ QUESTION CRUD TESTS (Admin) ====================

  describe('Admin Quiz Question CRUD Operations', () => {
    describe('POST /api/admin/quizzes', () => {
      it('should create a new quiz question', async () => {
        const quizData = {
          questionText: 'What is compound interest?',
          options: [
            'Interest on interest',
            'Simple interest',
            'No interest',
            'Negative interest'
          ],
          correctAnswerIndex: 0,
          category: 'Investing'
        };

        const res = await request(app)
          .post('/api/admin/quizzes')
          .set('Authorization', `Bearer ${adminUserToken}`)
          .send(quizData);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('_id');
        expect(res.body.questionText).toBe(quizData.questionText);
        expect(res.body.options).toEqual(quizData.options);
        expect(res.body.correctAnswerIndex).toBe(0);
        expect(res.body.category).toBe('Investing');
      });

      it('should reject quiz with missing required fields', async () => {
        const res = await request(app)
          .post('/api/admin/quizzes')
          .set('Authorization', `Bearer ${adminUserToken}`)
          .send({ questionText: 'Incomplete Question?' });

        expect(res.status).toBe(400);
      });

      it('should reject quiz with less than 2 options', async () => {
        const res = await request(app)
          .post('/api/admin/quizzes')
          .set('Authorization', `Bearer ${adminUserToken}`)
          .send({
            questionText: 'Invalid Question?',
            options: ['Only one option'],
            correctAnswerIndex: 0,
            category: 'Budgeting'
          });

        expect(res.status).toBe(400);
      });

      it('should reject quiz with invalid correctAnswerIndex', async () => {
        const res = await request(app)
          .post('/api/admin/quizzes')
          .set('Authorization', `Bearer ${adminUserToken}`)
          .send({
            questionText: 'Invalid Index Question?',
            options: ['A', 'B', 'C'],
            correctAnswerIndex: 5, // Out of bounds
            category: 'Saving'
          });

        expect(res.status).toBe(400);
      });
    });

    describe('GET /api/admin/quizzes', () => {
      beforeEach(async () => {
        await QuizQuestion.create([
          {
            questionText: 'Question 1?',
            options: ['A', 'B', 'C', 'D'],
            correctAnswerIndex: 0,
            category: 'Budgeting'
          },
          {
            questionText: 'Question 2?',
            options: ['W', 'X', 'Y', 'Z'],
            correctAnswerIndex: 2,
            category: 'Investing'
          }
        ]);
      });

      it('should get all quiz questions', async () => {
        const res = await request(app)
          .get('/api/admin/quizzes')
          .set('Authorization', `Bearer ${adminUserToken}`);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(2);
      });

      it('should include correctAnswerIndex in admin view', async () => {
        const res = await request(app)
          .get('/api/admin/quizzes')
          .set('Authorization', `Bearer ${adminUserToken}`);

        expect(res.body[0]).toHaveProperty('correctAnswerIndex');
        expect(res.body[1]).toHaveProperty('correctAnswerIndex');
      });
    });

    describe('PUT /api/admin/quizzes/:id', () => {
      let testQuiz;

      beforeEach(async () => {
        testQuiz = await QuizQuestion.create({
          questionText: 'Original Question?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswerIndex: 0,
          category: 'Budgeting'
        });
      });

      it('should update an existing quiz question', async () => {
        const res = await request(app)
          .put(`/api/admin/quizzes/${testQuiz._id}`)
          .set('Authorization', `Bearer ${adminUserToken}`)
          .send({
            questionText: 'Updated Question?',
            correctAnswerIndex: 2
          });

        expect(res.status).toBe(200);
        expect(res.body.questionText).toBe('Updated Question?');
        expect(res.body.correctAnswerIndex).toBe(2);
      });

      it('should return 404 for non-existent quiz', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
          .put(`/api/admin/quizzes/${fakeId}`)
          .set('Authorization', `Bearer ${adminUserToken}`)
          .send({ questionText: 'Updated' });

        expect(res.status).toBe(404);
      });
    });

    describe('DELETE /api/admin/quizzes/:id', () => {
      let testQuiz;

      beforeEach(async () => {
        testQuiz = await QuizQuestion.create({
          questionText: 'Question to Delete?',
          options: ['A', 'B'],
          correctAnswerIndex: 1,
          category: 'Saving'
        });
      });

      it('should delete an existing quiz question', async () => {
        const res = await request(app)
          .delete(`/api/admin/quizzes/${testQuiz._id}`)
          .set('Authorization', `Bearer ${adminUserToken}`);

        expect(res.status).toBe(200);

        // Verify deletion
        const deletedQuiz = await QuizQuestion.findById(testQuiz._id);
        expect(deletedQuiz).toBeNull();
      });

      it('should return 404 for non-existent quiz', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
          .delete(`/api/admin/quizzes/${fakeId}`)
          .set('Authorization', `Bearer ${adminUserToken}`);

        expect(res.status).toBe(404);
      });
    });
  });

  // ==================== USER QUIZ SUBMISSION TESTS ====================

  describe('User Quiz Submission', () => {
    let quizQuestions;

    beforeEach(async () => {
      // Create test quiz questions
      quizQuestions = await QuizQuestion.create([
        {
          questionText: 'What is a budget?',
          options: [
            'A spending plan',
            'A type of investment',
            'A loan type',
            'A savings account'
          ],
          correctAnswerIndex: 0,
          category: 'Budgeting'
        },
        {
          questionText: 'What is an emergency fund?',
          options: [
            'Money for vacations',
            'Savings for unexpected expenses',
            'Investment portfolio',
            'Retirement account'
          ],
          correctAnswerIndex: 1,
          category: 'Saving'
        },
        {
          questionText: 'What does APR stand for?',
          options: [
            'Annual Payment Rate',
            'Annual Percentage Rate',
            'Average Price Return',
            'Asset Protection Ratio'
          ],
          correctAnswerIndex: 1,
          category: 'Debt'
        },
        {
          questionText: 'What is diversification?',
          options: [
            'Putting all eggs in one basket',
            'Spreading investments across different assets',
            'Selling all stocks',
            'Borrowing money'
          ],
          correctAnswerIndex: 1,
          category: 'Investing'
        },
        {
          questionText: 'What is a 401(k)?',
          options: [
            'A type of loan',
            'A credit card',
            'A retirement savings plan',
            'A checking account'
          ],
          correctAnswerIndex: 2,
          category: 'Retirement'
        }
      ]);
    });

    describe('GET /api/quizzes/start', () => {
      it('should return quiz questions without correct answers', async () => {
        const res = await request(app)
          .get('/api/quizzes/start')
          .set('Authorization', `Bearer ${regularUserToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('totalQuestions');
        expect(res.body).toHaveProperty('questions');
        expect(Array.isArray(res.body.questions)).toBe(true);

        // Verify correctAnswerIndex is NOT included
        res.body.questions.forEach(question => {
          expect(question).toHaveProperty('questionText');
          expect(question).toHaveProperty('options');
          expect(question).not.toHaveProperty('correctAnswerIndex');
        });
      });

      it('should return 401 without authentication', async () => {
        const res = await request(app)
          .get('/api/quizzes/start');

        expect(res.status).toBe(401);
      });
    });

    describe('POST /api/quizzes/submit', () => {
      it('should calculate score correctly for all correct answers', async () => {
        const answers = quizQuestions.map(q => ({
          questionId: q._id.toString(),
          selectedIndex: q.correctAnswerIndex
        }));

        const res = await request(app)
          .post('/api/quizzes/submit')
          .set('Authorization', `Bearer ${regularUserToken}`)
          .send({ answers });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('score', 5);
        expect(res.body).toHaveProperty('totalQuestions', 5);
        expect(res.body).toHaveProperty('scorePercentage', 100);
        expect(res.body).toHaveProperty('results');
        expect(res.body.results.length).toBe(5);

        // All answers should be correct
        res.body.results.forEach(result => {
          expect(result.isCorrect).toBe(true);
        });
      });

      it('should calculate score correctly for all incorrect answers', async () => {
        const answers = quizQuestions.map(q => ({
          questionId: q._id.toString(),
          selectedIndex: (q.correctAnswerIndex + 1) % q.options.length // Wrong answer
        }));

        const res = await request(app)
          .post('/api/quizzes/submit')
          .set('Authorization', `Bearer ${regularUserToken}`)
          .send({ answers });

        expect(res.status).toBe(200);
        expect(res.body.score).toBe(0);
        expect(res.body.scorePercentage).toBe(0);

        // All answers should be incorrect
        res.body.results.forEach(result => {
          expect(result.isCorrect).toBe(false);
        });
      });

      it('should calculate score correctly for mixed answers', async () => {
        // Answer 3 correctly, 2 incorrectly
        const answers = [
          { questionId: quizQuestions[0]._id.toString(), selectedIndex: 0 }, // Correct
          { questionId: quizQuestions[1]._id.toString(), selectedIndex: 1 }, // Correct
          { questionId: quizQuestions[2]._id.toString(), selectedIndex: 0 }, // Incorrect (correct is 1)
          { questionId: quizQuestions[3]._id.toString(), selectedIndex: 1 }, // Correct
          { questionId: quizQuestions[4]._id.toString(), selectedIndex: 0 }  // Incorrect (correct is 2)
        ];

        const res = await request(app)
          .post('/api/quizzes/submit')
          .set('Authorization', `Bearer ${regularUserToken}`)
          .send({ answers });

        expect(res.status).toBe(200);
        expect(res.body.score).toBe(3);
        expect(res.body.totalQuestions).toBe(5);
        expect(res.body.scorePercentage).toBe(60); // 3/5 = 60%
      });

      it('should reveal correct answers in the results', async () => {
        const answers = [
          { questionId: quizQuestions[0]._id.toString(), selectedIndex: 3 } // Wrong answer
        ];

        const res = await request(app)
          .post('/api/quizzes/submit')
          .set('Authorization', `Bearer ${regularUserToken}`)
          .send({ answers });

        expect(res.status).toBe(200);

        const result = res.body.results[0];
        expect(result).toHaveProperty('correctAnswerIndex', 0);
        expect(result).toHaveProperty('selectedIndex', 3);
        expect(result).toHaveProperty('isCorrect', false);
        expect(result).toHaveProperty('questionText');
        expect(result).toHaveProperty('options');
      });

      it('should include question details in results', async () => {
        const answers = [
          { questionId: quizQuestions[0]._id.toString(), selectedIndex: 0 }
        ];

        const res = await request(app)
          .post('/api/quizzes/submit')
          .set('Authorization', `Bearer ${regularUserToken}`)
          .send({ answers });

        expect(res.status).toBe(200);

        const result = res.body.results[0];
        expect(result.questionText).toBe('What is a budget?');
        expect(result.options).toEqual([
          'A spending plan',
          'A type of investment',
          'A loan type',
          'A savings account'
        ]);
        expect(result.category).toBe('Budgeting');
      });

      it('should reject submission with empty answers array', async () => {
        const res = await request(app)
          .post('/api/quizzes/submit')
          .set('Authorization', `Bearer ${regularUserToken}`)
          .send({ answers: [] });

        expect(res.status).toBe(400);
      });

      it('should reject submission without answers', async () => {
        const res = await request(app)
          .post('/api/quizzes/submit')
          .set('Authorization', `Bearer ${regularUserToken}`)
          .send({});

        expect(res.status).toBe(400);
      });

      it('should handle submission with non-existent question IDs gracefully', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const answers = [
          { questionId: fakeId.toString(), selectedIndex: 0 }
        ];

        const res = await request(app)
          .post('/api/quizzes/submit')
          .set('Authorization', `Bearer ${regularUserToken}`)
          .send({ answers });

        expect(res.status).toBe(200);
        expect(res.body.results[0]).toHaveProperty('error', 'Question not found');
      });

      it('should return 401 without authentication', async () => {
        const res = await request(app)
          .post('/api/quizzes/submit')
          .send({
            answers: [
              { questionId: quizQuestions[0]._id.toString(), selectedIndex: 0 }
            ]
          });

        expect(res.status).toBe(401);
      });
    });
  });
});
