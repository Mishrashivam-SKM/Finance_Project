const express = require('express');
const QuizQuestion = require('../models/QuizQuestion');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/quizzes/start
// @desc    Get a random set of 10 quiz questions (without correct answers)
// @access  Private
router.get('/start', protect, async (req, res) => {
  try {
    const { category } = req.query;

    // Build match filter
    const matchFilter = {};
    if (category) {
      matchFilter.category = category;
    }

    // Fetch 10 random questions using MongoDB aggregation
    const questions = await QuizQuestion.aggregate([
      { $match: matchFilter },
      { $sample: { size: 10 } },
      {
        $project: {
          _id: 1,
          questionText: 1,
          options: 1,
          category: 1
          // Exclude correctAnswerIndex for the user
        }
      }
    ]);

    if (questions.length === 0) {
      return res.status(404).json({ message: 'No quiz questions available' });
    }

    res.json({
      totalQuestions: questions.length,
      questions
    });
  } catch (error) {
    console.error('Get quiz questions error:', error.message);
    res.status(500).json({ message: 'Server error while fetching quiz questions' });
  }
});

// @route   POST /api/quizzes/submit
// @desc    Submit quiz answers and get results
// @access  Private
router.post('/submit', protect, async (req, res) => {
  try {
    const { answers } = req.body;

    // Validate answers array
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of answers' });
    }

    // Get the question IDs from answers
    const questionIds = answers.map(a => a.questionId);

    // Fetch the questions with correct answers
    const questions = await QuizQuestion.find({ _id: { $in: questionIds } });

    // Create a map for quick lookup
    const questionMap = {};
    questions.forEach(q => {
      questionMap[q._id.toString()] = q;
    });

    // Calculate score and build results
    let correctCount = 0;
    const results = answers.map(answer => {
      const question = questionMap[answer.questionId];
      if (!question) {
        return {
          questionId: answer.questionId,
          error: 'Question not found'
        };
      }

      const isCorrect = answer.selectedIndex === question.correctAnswerIndex;
      if (isCorrect) correctCount++;

      return {
        questionId: answer.questionId,
        questionText: question.questionText,
        options: question.options,
        selectedIndex: answer.selectedIndex,
        correctAnswerIndex: question.correctAnswerIndex,
        isCorrect,
        category: question.category
      };
    });

    const totalQuestions = answers.length;
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);

    res.json({
      score: correctCount,
      totalQuestions,
      scorePercentage,
      results
    });
  } catch (error) {
    console.error('Submit quiz error:', error.message);
    res.status(500).json({ message: 'Server error while submitting quiz' });
  }
});

module.exports = router;
