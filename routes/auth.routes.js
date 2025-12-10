const express = require('express');
const { protect } = require('../middleware/auth');
const {
  registerUser,
  loginUser,
  getCurrentUser,
  updateUser
} = require('../controllers/authController');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerUser);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', loginUser);

// @route   GET /api/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, getCurrentUser);

// @route   PUT /api/users/me
// @desc    Update current user profile
// @access  Private
router.put('/me', protect, updateUser);

module.exports = router;
