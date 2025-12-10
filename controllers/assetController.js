const Asset = require('../models/Asset');

/**
 * @desc    Create a new asset
 * @route   POST /api/assets
 * @access  Private
 */
const createAsset = async (req, res) => {
  try {
    const { category, name, currentValue } = req.body;

    // Validate required fields
    if (!category || !name || currentValue === undefined) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Create asset with initial value in valueHistory
    const asset = await Asset.create({
      userId: req.user.id,
      category,
      name,
      currentValue,
      valueHistory: [{
        date: new Date(),
        value: currentValue
      }]
    });

    res.status(201).json(asset);
  } catch (error) {
    console.error('Create asset error:', error.message);
    res.status(500).json({ message: 'Server error while creating asset' });
  }
};

/**
 * @desc    Get all assets for authenticated user
 * @route   GET /api/assets
 * @access  Private
 */
const getAssets = async (req, res) => {
  try {
    // Fetch assets only for the authenticated user
    const assets = await Asset.find({ userId: req.user.id })
      .populate('category', 'name type')
      .sort({ lastUpdated: -1 });

    res.json(assets);
  } catch (error) {
    console.error('Get assets error:', error.message);
    res.status(500).json({ message: 'Server error while fetching assets' });
  }
};

/**
 * @desc    Update an existing asset
 * @route   PUT /api/assets/:id
 * @access  Private
 */
const updateAsset = async (req, res) => {
  try {
    const { category, name, currentValue } = req.body;

    // Find asset by ID
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Verify user ownership
    if (asset.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to update this asset' });
    }

    // Update asset fields
    asset.category = category || asset.category;
    asset.name = name || asset.name;

    // If currentValue is being modified, add to valueHistory
    if (currentValue !== undefined && currentValue !== asset.currentValue) {
      asset.valueHistory.push({
        date: new Date(),
        value: currentValue
      });
      asset.currentValue = currentValue;
    }

    const updatedAsset = await asset.save();

    res.json(updatedAsset);
  } catch (error) {
    console.error('Update asset error:', error.message);
    res.status(500).json({ message: 'Server error while updating asset' });
  }
};

/**
 * @desc    Delete an asset
 * @route   DELETE /api/assets/:id
 * @access  Private
 */
const deleteAsset = async (req, res) => {
  try {
    // Find asset by ID
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Verify user ownership
    if (asset.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this asset' });
    }

    await Asset.findByIdAndDelete(req.params.id);

    res.json({ message: 'Asset removed successfully' });
  } catch (error) {
    console.error('Delete asset error:', error.message);
    res.status(500).json({ message: 'Server error while deleting asset' });
  }
};

module.exports = {
  createAsset,
  getAssets,
  updateAsset,
  deleteAsset
};
