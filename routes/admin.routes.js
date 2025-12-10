const express = require('express');
const Tip = require('../models/Tip');
const { adminProtect } = require('../middleware/adminAuth');

const router = express.Router();

// @route   POST /api/admin/tips
// @desc    Create a new financial tip
// @access  Admin only
router.post('/tips', adminProtect, async (req, res) => {
  try {
    const { title, body, category, isPublished } = req.body;

    // Validate required fields
    if (!title || !body || !category) {
      return res.status(400).json({ message: 'Please provide title, body, and category' });
    }

    // Create tip with adminId from authenticated admin user
    const tip = await Tip.create({
      adminId: req.user,
      title,
      body,
      category,
      isPublished: isPublished !== undefined ? isPublished : true
    });

    res.status(201).json(tip);
  } catch (error) {
    console.error('Create tip error:', error.message);
    res.status(500).json({ message: 'Server error while creating tip' });
  }
});

// @route   GET /api/admin/tips
// @desc    Get all tips (admin view)
// @access  Admin only
router.get('/tips', adminProtect, async (req, res) => {
  try {
    const tips = await Tip.find()
      .populate('adminId', 'username email')
      .sort({ createdAt: -1 });

    res.json(tips);
  } catch (error) {
    console.error('Get tips error:', error.message);
    res.status(500).json({ message: 'Server error while fetching tips' });
  }
});

// @route   PUT /api/admin/tips/:id
// @desc    Update an existing tip
// @access  Admin only
router.put('/tips/:id', adminProtect, async (req, res) => {
  try {
    const { title, body, category, isPublished } = req.body;

    // Find tip by ID
    const tip = await Tip.findById(req.params.id);

    if (!tip) {
      return res.status(404).json({ message: 'Tip not found' });
    }

    // Update tip fields
    tip.title = title || tip.title;
    tip.body = body || tip.body;
    tip.category = category || tip.category;
    tip.isPublished = isPublished !== undefined ? isPublished : tip.isPublished;

    const updatedTip = await tip.save();

    res.json(updatedTip);
  } catch (error) {
    console.error('Update tip error:', error.message);
    res.status(500).json({ message: 'Server error while updating tip' });
  }
});

// @route   DELETE /api/admin/tips/:id
// @desc    Delete a tip
// @access  Admin only
router.delete('/tips/:id', adminProtect, async (req, res) => {
  try {
    // Find tip by ID
    const tip = await Tip.findById(req.params.id);

    if (!tip) {
      return res.status(404).json({ message: 'Tip not found' });
    }

    await Tip.findByIdAndDelete(req.params.id);

    res.json({ message: 'Tip removed successfully' });
  } catch (error) {
    console.error('Delete tip error:', error.message);
    res.status(500).json({ message: 'Server error while deleting tip' });
  }
});

module.exports = router;
