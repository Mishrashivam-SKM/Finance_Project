const User = require('../models/User');
const { protect } = require('./auth');

/**
 * Admin protection middleware
 * First verifies JWT token, then checks if user has admin role
 */
const adminProtect = async (req, res, next) => {
  // First, run the standard protect middleware
  protect(req, res, async (err) => {
    if (err) {
      return next(err);
    }

    try {
      // Fetch user from database to get the role
      const user = await User.findById(req.user).select('role');

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Check if user has admin role
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Admin access required' });
      }

      // Attach full user info to request for potential use in routes
      req.userRole = user.role;

      next();
    } catch (error) {
      console.error('Admin authorization error:', error.message);
      return res.status(500).json({ message: 'Server error during admin authorization' });
    }
  });
};

module.exports = { adminProtect };
