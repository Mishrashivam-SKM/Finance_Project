const express = require('express');
const { adminProtect } = require('../middleware/adminAuth');
const {
  createTip,
  getTips,
  updateTip,
  deleteTip,
  createQuiz,
  getQuizzesAdmin,
  updateQuiz,
  deleteQuiz
} = require('../controllers/adminController');

const router = express.Router();

// ==================== TIP ROUTES ====================

// @route   POST /api/admin/tips
// @desc    Create a new financial tip
// @access  Admin only
router.post('/tips', adminProtect, createTip);

// @route   GET /api/admin/tips
// @desc    Get all tips (admin view)
// @access  Admin only
router.get('/tips', adminProtect, getTips);

// @route   PUT /api/admin/tips/:id
// @desc    Update an existing tip
// @access  Admin only
router.put('/tips/:id', adminProtect, updateTip);

// @route   DELETE /api/admin/tips/:id
// @desc    Delete a tip
// @access  Admin only
router.delete('/tips/:id', adminProtect, deleteTip);

// ==================== QUIZ QUESTION ROUTES ====================

// @route   POST /api/admin/quizzes
// @desc    Create a new quiz question
// @access  Admin only
router.post('/quizzes', adminProtect, createQuiz);

// @route   GET /api/admin/quizzes
// @desc    Get all quiz questions (admin view)
// @access  Admin only
router.get('/quizzes', adminProtect, getQuizzesAdmin);

// @route   PUT /api/admin/quizzes/:id
// @desc    Update an existing quiz question
// @access  Admin only
router.put('/quizzes/:id', adminProtect, updateQuiz);

// @route   DELETE /api/admin/quizzes/:id
// @desc    Delete a quiz question
// @access  Admin only
router.delete('/quizzes/:id', adminProtect, deleteQuiz);

module.exports = router;
