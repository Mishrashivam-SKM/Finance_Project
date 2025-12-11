const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../models/User');

/**
 * Generate JWT Token
 * @param {string} id - User ID
 * @returns {string} - JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Check if all required fields are provided
    if (!email || !username || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user (password hashing handled by pre-save hook in User model)
    const user = await User.create({
      email,
      username,
      password
    });

    if (user) {
      // Generate token and send response
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if all required fields are provided
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Verify password using bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token and send response
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/users/me
 * @access  Private
 */
const getCurrentUser = async (req, res) => {
  try {
    // Find user by ID from authenticated request (exclude password)
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error.message);
    res.status(500).json({ message: 'Server error while fetching user profile' });
  }
};

/**
 * @desc    Update current user profile
 * @route   PUT /api/users/me
 * @access  Private
 */
const updateUser = async (req, res) => {
  try {
    const { username, email, password, preferredTheme } = req.body;

    // Find user by ID from authenticated request
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify user ownership (user can only update their own profile)
    if (user._id.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to update this user' });
    }

    // Check if email is being changed and if new email already exists
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }

    // Update user fields
    if (username) user.username = username;
    if (preferredTheme) user.preferredTheme = preferredTheme;

    // Update password if provided (will be hashed by pre-save hook)
    if (password) {
      user.password = password;
    }

    const updatedUser = await user.save();

    // Return updated user without password
    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      preferredTheme: updatedUser.preferredTheme
    });
  } catch (error) {
    console.error('Update user error:', error.message);
    res.status(500).json({ message: 'Server error while updating user profile' });
  }
};

/**
 * @desc    Handle forgot password request
 * @route   POST /api/auth/forgotpassword
 * @access  Public
 */
const forgotPasswordRequest = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email is provided
    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address' });
    }

    // Check if user exists with this email
    const user = await User.findOne({ email });
    if (!user) {
      // Return generic message for security (don't reveal if email exists)
      return res.status(200).json({ 
        message: 'If an account exists with this email, a password reset token will be sent' 
      });
    }

    // Generate unique password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash the token for storage in database
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set token and expiration time (24 hours from now)
    const expirationTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = expirationTime;

    await user.save();

    // Log the token to console for sandbox environment
    console.log('==============================================');
    console.log('PASSWORD RESET TOKEN GENERATED');
    console.log('==============================================');
    console.log(`Email: ${user.email}`);
    console.log(`Reset Token: ${resetToken}`);
    console.log(`Token Expires At: ${expirationTime.toISOString()}`);
    console.log('==============================================');
    console.log('In production, this token would be sent via email');
    console.log('==============================================');

    // Return success response
    res.status(200).json({
      message: 'If an account exists with this email, a password reset token has been generated',
      // In production, do NOT return the token to the client
      // For testing purposes only:
      token: resetToken,
      expiresIn: '24 hours'
    });

  } catch (error) {
    console.error('Forgot password request error:', error.message);
    res.status(500).json({ message: 'Server error while processing password reset request' });
  }
};

/**
 * @desc    Reset user password using token
 * @route   POST /api/auth/resetpassword
 * @access  Public
 */
const resetPassword = async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;

    // Validate all required fields
    if (!token || !email || !newPassword) {
      return res.status(400).json({ message: 'Please provide token, email, and new password' });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has a reset token
    if (!user.passwordResetToken) {
      return res.status(400).json({ message: 'No password reset token found. Request a new one.' });
    }

    // Hash the provided token to compare with stored token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Verify token matches
    if (user.passwordResetToken !== hashedToken) {
      return res.status(401).json({ message: 'Invalid reset token' });
    }

    // Verify token hasn't expired
    if (new Date() > user.passwordResetExpires) {
      // Clear expired token
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save();
      
      return res.status(401).json({ message: 'Reset token has expired. Request a new one.' });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;

    // Clear reset token and expiration
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    // Save updated user
    await user.save();

    // Log successful password reset
    console.log(`✅ Password successfully reset for user: ${user.email}`);

    res.status(200).json({
      message: 'Password has been reset successfully',
      email: user.email
    });

  } catch (error) {
    console.error('Reset password error:', error.message);
    res.status(500).json({ message: 'Server error while resetting password' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  updateUser,
  forgotPasswordRequest,
  resetPassword,
  generateToken
};
