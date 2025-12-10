const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
    trim: true
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
        return v && v.length >= 2;
      },
      message: 'At least 2 options are required'
    }
  },
  correctAnswerIndex: {
    type: Number,
    required: true,
    validate: {
      validator: function(v) {
        return v >= 0 && v < this.options.length;
      },
      message: 'Correct answer index must be a valid option index'
    }
  },
  category: {
    type: String,
    enum: ['Debt', 'Investing', 'Budgeting', 'Saving', 'Tax Planning', 'Retirement', 'General'],
    required: true
  }
}, {
  timestamps: true
});

const QuizQuestion = mongoose.model('QuizQuestion', quizQuestionSchema);

module.exports = QuizQuestion;
