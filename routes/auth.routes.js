const express = require('express');
const { protect } = require('../middleware/auth');
const {
  registerUser,
  loginUser,
  getCurrentUser,
  updateUser,
  forgotPasswordRequest,
  resetPassword
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

// @route   POST /api/auth/forgotpassword
// @desc    Request password reset token
// @access  Public
router.post('/forgotpassword', forgotPasswordRequest);

// @route   POST /api/auth/resetpassword
// @desc    Reset password with token
// @access  Public
router.post('/resetpassword', resetPassword);

// @route   GET /api/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, getCurrentUser);

// @route   PUT /api/users/me
// @desc    Update current user profile
// @access  Private
router.put('/me', protect, updateUser);

module.exports = router;
