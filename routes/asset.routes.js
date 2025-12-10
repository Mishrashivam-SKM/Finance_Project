const express = require('express');
const Asset = require('../models/Asset');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/assets
// @desc    Create a new asset
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { category, name, currentValue } = req.body;

    // Validate required fields
    if (!category || !name || currentValue === undefined) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Create asset with initial value in history
    const asset = await Asset.create({
      userId: req.user,
      category,
      name,
      currentValue,
      valueHistory: [{ date: new Date(), value: currentValue }]
    });

    res.status(201).json(asset);
  } catch (error) {
    console.error('Create asset error:', error.message);
    res.status(500).json({ message: 'Server error while creating asset' });
  }
});

// @route   GET /api/assets
// @desc    Get all assets for authenticated user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // Fetch assets only for the authenticated user
    const assets = await Asset.find({ userId: req.user })
      .populate('category', 'name type')
      .sort({ createdAt: -1 });

    res.json(assets);
  } catch (error) {
    console.error('Get assets error:', error.message);
    res.status(500).json({ message: 'Server error while fetching assets' });
  }
});

// @route   PUT /api/assets/:id
// @desc    Update an existing asset
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { category, name, currentValue } = req.body;

    // Find asset by ID
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Verify user ownership
    if (asset.userId.toString() !== req.user) {
      return res.status(401).json({ message: 'Not authorized to update this asset' });
    }

    // Update asset fields
    asset.category = category || asset.category;
    asset.name = name || asset.name;

    // If currentValue changed, update it and add to valueHistory
    if (currentValue !== undefined && currentValue !== asset.currentValue) {
      asset.valueHistory.push({ date: new Date(), value: currentValue });
      asset.currentValue = currentValue;
    }

    const updatedAsset = await asset.save();

    res.json(updatedAsset);
  } catch (error) {
    console.error('Update asset error:', error.message);
    res.status(500).json({ message: 'Server error while updating asset' });
  }
});

// @route   DELETE /api/assets/:id
// @desc    Delete an asset
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    // Find asset by ID
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Verify user ownership
    if (asset.userId.toString() !== req.user) {
      return res.status(401).json({ message: 'Not authorized to delete this asset' });
    }

    await Asset.findByIdAndDelete(req.params.id);

    res.json({ message: 'Asset removed successfully' });
  } catch (error) {
    console.error('Delete asset error:', error.message);
    res.status(500).json({ message: 'Server error while deleting asset' });
  }
});

module.exports = router;
