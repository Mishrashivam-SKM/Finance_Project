const Debt = require('../models/Debt');

/**
 * @desc    Create a new debt
 * @route   POST /api/debts
 * @access  Private
 */
const createDebt = async (req, res) => {
  try {
    const { category, name, originalAmount, remainingBalance, interestRate, minimumPayment, nextPaymentDate } = req.body;

    // Validate required fields
    if (!category || !name || originalAmount === undefined || remainingBalance === undefined || interestRate === undefined) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Create debt with userId from authenticated user
    const debt = await Debt.create({
      userId: req.user.id,
      category,
      name,
      originalAmount,
      remainingBalance,
      interestRate,
      minimumPayment,
      nextPaymentDate
    });

    res.status(201).json(debt);
  } catch (error) {
    console.error('Create debt error:', error.message);
    res.status(500).json({ message: 'Server error while creating debt' });
  }
};

/**
 * @desc    Get all debts for authenticated user
 * @route   GET /api/debts
 * @access  Private
 */
const getDebts = async (req, res) => {
  try {
    // Fetch debts only for the authenticated user
    const debts = await Debt.find({ userId: req.user.id })
      .populate('category', 'name type')
      .sort({ createdAt: -1 });

    res.json(debts);
  } catch (error) {
    console.error('Get debts error:', error.message);
    res.status(500).json({ message: 'Server error while fetching debts' });
  }
};

/**
 * @desc    Update an existing debt
 * @route   PUT /api/debts/:id
 * @access  Private
 */
const updateDebt = async (req, res) => {
  try {
    const { category, name, originalAmount, remainingBalance, interestRate, minimumPayment, nextPaymentDate } = req.body;

    // Find debt by ID
    const debt = await Debt.findById(req.params.id);

    if (!debt) {
      return res.status(404).json({ message: 'Debt not found' });
    }

    // Verify user ownership
    if (debt.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to update this debt' });
    }

    // Update debt fields
    debt.category = category || debt.category;
    debt.name = name || debt.name;
    debt.originalAmount = originalAmount !== undefined ? originalAmount : debt.originalAmount;
    debt.remainingBalance = remainingBalance !== undefined ? remainingBalance : debt.remainingBalance;
    debt.interestRate = interestRate !== undefined ? interestRate : debt.interestRate;
    debt.minimumPayment = minimumPayment !== undefined ? minimumPayment : debt.minimumPayment;
    debt.nextPaymentDate = nextPaymentDate !== undefined ? nextPaymentDate : debt.nextPaymentDate;

    const updatedDebt = await debt.save();

    res.json(updatedDebt);
  } catch (error) {
    console.error('Update debt error:', error.message);
    res.status(500).json({ message: 'Server error while updating debt' });
  }
};

/**
 * @desc    Delete a debt
 * @route   DELETE /api/debts/:id
 * @access  Private
 */
const deleteDebt = async (req, res) => {
  try {
    // Find debt by ID
    const debt = await Debt.findById(req.params.id);

    if (!debt) {
      return res.status(404).json({ message: 'Debt not found' });
    }

    // Verify user ownership
    if (debt.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this debt' });
    }

    await Debt.findByIdAndDelete(req.params.id);

    res.json({ message: 'Debt removed successfully' });
  } catch (error) {
    console.error('Delete debt error:', error.message);
    res.status(500).json({ message: 'Server error while deleting debt' });
  }
};

module.exports = {
  createDebt,
  getDebts,
  updateDebt,
  deleteDebt
};
