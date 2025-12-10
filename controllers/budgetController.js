const Budget = require('../models/Budget');

/**
 * @desc    Create a new monthly budget
 * @route   POST /api/budgets
 * @access  Private
 */
const createBudget = async (req, res) => {
  try {
    const { category, limitAmount, month, year } = req.body;

    // Validate required fields
    if (!category || limitAmount === undefined || month === undefined || year === undefined) {
      return res.status(400).json({ message: 'Please provide all required fields (category, limitAmount, month, year)' });
    }

    // Create periodStart as the first day of the specified month
    const periodStart = new Date(year, month - 1, 1);

    // Check if budget already exists for this user, category, and period (uniqueness check)
    const existingBudget = await Budget.findOne({
      userId: req.user.id,
      category,
      periodStart
    });

    if (existingBudget) {
      return res.status(400).json({ message: 'Budget already exists for this category and period' });
    }

    // Create budget with userId from authenticated user
    const budget = await Budget.create({
      userId: req.user.id,
      category,
      periodStart,
      limitAmount
    });

    res.status(201).json(budget);
  } catch (error) {
    console.error('Create budget error:', error.message);
    res.status(500).json({ message: 'Server error while creating budget' });
  }
};

/**
 * @desc    Get all budgets for authenticated user
 * @route   GET /api/budgets
 * @access  Private
 */
const getBudgets = async (req, res) => {
  try {
    // Fetch budgets only for the authenticated user
    const budgets = await Budget.find({ userId: req.user.id })
      .populate('category', 'name type')
      .sort({ periodStart: -1 });

    res.json(budgets);
  } catch (error) {
    console.error('Get budgets error:', error.message);
    res.status(500).json({ message: 'Server error while fetching budgets' });
  }
};

/**
 * @desc    Update an existing budget
 * @route   PUT /api/budgets/:id
 * @access  Private
 */
const updateBudget = async (req, res) => {
  try {
    const { category, limitAmount, month, year } = req.body;

    // Find budget by ID
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Verify user ownership
    if (budget.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to update this budget' });
    }

    // Update budget fields
    budget.category = category || budget.category;
    budget.limitAmount = limitAmount !== undefined ? limitAmount : budget.limitAmount;

    // Update periodStart if month and year are provided
    if (month !== undefined && year !== undefined) {
      budget.periodStart = new Date(year, month - 1, 1);
    }

    const updatedBudget = await budget.save();

    res.json(updatedBudget);
  } catch (error) {
    console.error('Update budget error:', error.message);
    res.status(500).json({ message: 'Server error while updating budget' });
  }
};

/**
 * @desc    Delete a budget
 * @route   DELETE /api/budgets/:id
 * @access  Private
 */
const deleteBudget = async (req, res) => {
  try {
    // Find budget by ID
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Verify user ownership
    if (budget.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this budget' });
    }

    await Budget.findByIdAndDelete(req.params.id);

    res.json({ message: 'Budget removed successfully' });
  } catch (error) {
    console.error('Delete budget error:', error.message);
    res.status(500).json({ message: 'Server error while deleting budget' });
  }
};

module.exports = {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget
};
