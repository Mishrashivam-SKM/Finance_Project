const express = require('express');
const { protect } = require('../middleware/auth');
const {
  createAsset,
  getAssets,
  updateAsset,
  deleteAsset
} = require('../controllers/assetController');

const router = express.Router();

// @route   POST /api/assets
// @desc    Create a new asset
// @access  Private
router.post('/', protect, createAsset);

// @route   GET /api/assets
// @desc    Get all assets for authenticated user
// @access  Private
router.get('/', protect, getAssets);

// @route   PUT /api/assets/:id
// @desc    Update an existing asset
// @access  Private
router.put('/:id', protect, updateAsset);

// @route   DELETE /api/assets/:id
// @desc    Delete an asset
// @access  Private
router.delete('/:id', protect, deleteAsset);

module.exports = router;
