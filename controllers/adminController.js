const Tip = require('../models/Tip');
const QuizQuestion = require('../models/QuizQuestion');

// ==================== TIP CONTROLLER FUNCTIONS ====================

/**
 * @desc    Create a new financial tip
 * @route   POST /api/admin/tips
 * @access  Admin only
 */
const createTip = async (req, res) => {
  try {
    const { title, body, category, isPublished } = req.body;

    // Validate required fields
    if (!title || !body || !category) {
      return res.status(400).json({ message: 'Please provide title, body, and category' });
    }

    // Create tip with adminId from authenticated admin user
    const tip = await Tip.create({
      adminId: req.user.id,
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
};

/**
 * @desc    Get all tips (admin view)
 * @route   GET /api/admin/tips
 * @access  Admin only
 */
const getTips = async (req, res) => {
  try {
    const tips = await Tip.find()
      .populate('adminId', 'username email')
      .sort({ createdAt: -1 });

    res.json(tips);
  } catch (error) {
    console.error('Get tips error:', error.message);
    res.status(500).json({ message: 'Server error while fetching tips' });
  }
};

/**
 * @desc    Update an existing tip
 * @route   PUT /api/admin/tips/:id
 * @access  Admin only
 */
const updateTip = async (req, res) => {
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
};

/**
 * @desc    Delete a tip
 * @route   DELETE /api/admin/tips/:id
 * @access  Admin only
 */
const deleteTip = async (req, res) => {
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
};

// ==================== QUIZ CONTROLLER FUNCTIONS ====================

/**
 * @desc    Create a new quiz question
 * @route   POST /api/admin/quizzes
 * @access  Admin only
 */
const createQuiz = async (req, res) => {
  try {
    const { questionText, options, correctAnswerIndex, category } = req.body;

    // Validate required fields
    if (!questionText || !options || correctAnswerIndex === undefined || !category) {
      return res.status(400).json({
        message: 'Please provide questionText, options, correctAnswerIndex, and category'
      });
    }

    // Validate options is an array with at least 2 items
    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        message: 'Options must be an array with at least 2 items'
      });
    }

    // Validate correctAnswerIndex is within bounds
    if (correctAnswerIndex < 0 || correctAnswerIndex >= options.length) {
      return res.status(400).json({
        message: 'correctAnswerIndex must be a valid index within the options array'
      });
    }

    const quizQuestion = await QuizQuestion.create({
      questionText,
      options,
      correctAnswerIndex,
      category
    });

    res.status(201).json(quizQuestion);
  } catch (error) {
    console.error('Create quiz question error:', error.message);
    res.status(500).json({ message: 'Server error while creating quiz question' });
  }
};

/**
 * @desc    Get all quiz questions (admin view)
 * @route   GET /api/admin/quizzes
 * @access  Admin only
 */
const getQuizzesAdmin = async (req, res) => {
  try {
    const { category } = req.query;

    // Build query filter
    const filter = {};
    if (category) {
      filter.category = category;
    }

    const quizQuestions = await QuizQuestion.find(filter).sort({ createdAt: -1 });

    res.json(quizQuestions);
  } catch (error) {
    console.error('Get quiz questions error:', error.message);
    res.status(500).json({ message: 'Server error while fetching quiz questions' });
  }
};

/**
 * @desc    Update an existing quiz question
 * @route   PUT /api/admin/quizzes/:id
 * @access  Admin only
 */
const updateQuiz = async (req, res) => {
  try {
    const { questionText, options, correctAnswerIndex, category } = req.body;

    // Find quiz question by ID
    const quizQuestion = await QuizQuestion.findById(req.params.id);

    if (!quizQuestion) {
      return res.status(404).json({ message: 'Quiz question not found' });
    }

    // Validate options if provided
    if (options) {
      if (!Array.isArray(options) || options.length < 2) {
        return res.status(400).json({
          message: 'Options must be an array with at least 2 items'
        });
      }
    }

    // Determine options array for validation
    const finalOptions = options || quizQuestion.options;

    // Validate correctAnswerIndex if provided
    if (correctAnswerIndex !== undefined) {
      if (correctAnswerIndex < 0 || correctAnswerIndex >= finalOptions.length) {
        return res.status(400).json({
          message: 'correctAnswerIndex must be a valid index within the options array'
        });
      }
    }

    // Update quiz question fields
    quizQuestion.questionText = questionText || quizQuestion.questionText;
    quizQuestion.options = options || quizQuestion.options;
    quizQuestion.correctAnswerIndex = correctAnswerIndex !== undefined ? correctAnswerIndex : quizQuestion.correctAnswerIndex;
    quizQuestion.category = category || quizQuestion.category;

    const updatedQuizQuestion = await quizQuestion.save();

    res.json(updatedQuizQuestion);
  } catch (error) {
    console.error('Update quiz question error:', error.message);
    res.status(500).json({ message: 'Server error while updating quiz question' });
  }
};

/**
 * @desc    Delete a quiz question
 * @route   DELETE /api/admin/quizzes/:id
 * @access  Admin only
 */
const deleteQuiz = async (req, res) => {
  try {
    // Find quiz question by ID
    const quizQuestion = await QuizQuestion.findById(req.params.id);

    if (!quizQuestion) {
      return res.status(404).json({ message: 'Quiz question not found' });
    }

    await QuizQuestion.findByIdAndDelete(req.params.id);

    res.json({ message: 'Quiz question removed successfully' });
  } catch (error) {
    console.error('Delete quiz question error:', error.message);
    res.status(500).json({ message: 'Server error while deleting quiz question' });
  }
};

module.exports = {
  createTip,
  getTips,
  updateTip,
  deleteTip,
  createQuiz,
  getQuizzesAdmin,
  updateQuiz,
  deleteQuiz
};
