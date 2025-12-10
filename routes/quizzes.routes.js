const express = require('express');
const { protect } = require('../middleware/auth');
const {
  startQuiz,
  submitQuiz
} = require('../controllers/quizController');

const router = express.Router();

// @route   GET /api/quizzes/start
// @desc    Get a random set of 10 quiz questions (without correct answers)
// @access  Private
router.get('/start', protect, startQuiz);

// @route   POST /api/quizzes/submit
// @desc    Submit quiz answers and get results
// @access  Private
router.post('/submit', protect, submitQuiz);

module.exports = router;
