require('dotenv').config();
const mongoose = require('mongoose');
const QuizQuestion = require('./models/QuizQuestion');

/**
 * Seed script to populate the database with default quiz questions
 * Run with: node seed.js
 */

const quizQuestions = [
  // Debt Management Questions (5)
  {
    questionText: 'What is the debt avalanche method?',
    options: [
      'Paying off debts with the highest interest rate first',
      'Paying off debts with the lowest balance first',
      'Consolidating all debts into one payment',
      'Ignoring debt and focusing on savings'
    ],
    correctAnswerIndex: 0,
    category: 'Debt',
    difficulty: 'medium',
    explanation: 'The debt avalanche method prioritizes paying off debts with the highest interest rates first, which saves the most money on interest over time.'
  },
  {
    questionText: 'What is considered a healthy debt-to-income ratio?',
    options: [
      'Below 36%',
      'Between 40-50%',
      'Between 50-60%',
      'Above 60%'
    ],
    correctAnswerIndex: 0,
    category: 'Debt',
    difficulty: 'medium',
    explanation: 'A debt-to-income ratio below 36% is generally considered healthy. Lenders prefer to see ratios at or below this threshold.'
  },
  {
    questionText: 'Which type of debt typically has the highest interest rate?',
    options: [
      'Credit card debt',
      'Student loans',
      'Mortgage',
      'Auto loans'
    ],
    correctAnswerIndex: 0,
    category: 'Debt',
    difficulty: 'easy',
    explanation: 'Credit card debt typically carries the highest interest rates, often ranging from 15-25% APR or higher, making it the most expensive form of consumer debt.'
  },
  {
    questionText: 'What is debt consolidation?',
    options: [
      'Combining multiple debts into a single loan with one payment',
      'Declaring bankruptcy',
      'Negotiating with creditors to reduce debt',
      'Transferring debt to family members'
    ],
    correctAnswerIndex: 0,
    category: 'Debt',
    difficulty: 'easy',
    explanation: 'Debt consolidation combines multiple debts into a single loan, ideally with a lower interest rate and one monthly payment, making debt management easier.'
  },
  {
    questionText: 'What is the snowball method of debt repayment?',
    options: [
      'Paying off the smallest debt first to build momentum',
      'Making minimum payments on all debts',
      'Paying off the largest debt first',
      'Only paying debts when you have extra money'
    ],
    correctAnswerIndex: 0,
    category: 'Debt',
    difficulty: 'medium',
    explanation: 'The debt snowball method focuses on paying off the smallest debt first while making minimum payments on others. This creates psychological wins and momentum.'
  },

  // Investing Questions (5)
  {
    questionText: 'What is dollar-cost averaging?',
    options: [
      'Investing a fixed amount regularly regardless of market conditions',
      'Investing only when the market is down',
      'Timing the market to maximize returns',
      'Selling investments at their peak value'
    ],
    correctAnswerIndex: 0,
    category: 'Investing',
    difficulty: 'medium',
    explanation: 'Dollar-cost averaging involves investing a fixed amount at regular intervals, which helps reduce the impact of market volatility and removes the need to time the market.'
  },
  {
    questionText: 'What does diversification mean in investing?',
    options: [
      'Spreading investments across different assets to reduce risk',
      'Investing all money in one stock',
      'Only investing in bonds',
      'Keeping all money in a savings account'
    ],
    correctAnswerIndex: 0,
    category: 'Investing',
    difficulty: 'easy',
    explanation: 'Diversification is the practice of spreading investments across various assets, sectors, or geographic regions to reduce overall portfolio risk.'
  },
  {
    questionText: 'What is a stock dividend?',
    options: [
      'A portion of company profits paid to shareholders',
      'The price increase of a stock',
      'A fee charged by brokers',
      'The initial price of a stock offering'
    ],
    correctAnswerIndex: 0,
    category: 'Investing',
    difficulty: 'easy',
    explanation: 'A dividend is a distribution of a portion of a company\'s earnings to shareholders, typically paid quarterly in cash or additional shares.'
  },
  {
    questionText: 'What is the typical historical average annual return of the S&P 500?',
    options: [
      'Around 10%',
      'Around 2-3%',
      'Around 20%',
      'Around 50%'
    ],
    correctAnswerIndex: 0,
    category: 'Investing',
    difficulty: 'medium',
    explanation: 'The S&P 500 has historically returned approximately 10% annually over the long term, though individual years can vary significantly.'
  },
  {
    questionText: 'What is a bond?',
    options: [
      'A loan you make to a company or government',
      'A share of ownership in a company',
      'A type of savings account',
      'A cryptocurrency investment'
    ],
    correctAnswerIndex: 0,
    category: 'Investing',
    difficulty: 'easy',
    explanation: 'A bond is a debt security where you lend money to an entity (company or government) in exchange for periodic interest payments and the return of principal at maturity.'
  },

  // Budgeting Questions (5)
  {
    questionText: 'What is the 50/30/20 budgeting rule?',
    options: [
      '50% needs, 30% wants, 20% savings/debt',
      '50% savings, 30% needs, 20% wants',
      '50% wants, 30% savings, 20% needs',
      '50% debt, 30% bills, 20% entertainment'
    ],
    correctAnswerIndex: 0,
    category: 'Budgeting',
    difficulty: 'easy',
    explanation: 'The 50/30/20 rule allocates 50% of income to needs, 30% to wants, and 20% to savings and debt repayment, providing a balanced approach to budgeting.'
  },
  {
    questionText: 'What is zero-based budgeting?',
    options: [
      'Allocating every dollar of income to specific expenses or savings',
      'Starting your budget at zero each month',
      'Only budgeting when you have no money left',
      'Spending all your money before the month ends'
    ],
    correctAnswerIndex: 0,
    category: 'Budgeting',
    difficulty: 'medium',
    explanation: 'Zero-based budgeting means assigning every dollar of income a specific purpose, so your income minus expenses equals zero. This ensures intentional spending.'
  },
  {
    questionText: 'What is a discretionary expense?',
    options: [
      'Non-essential spending like entertainment and dining out',
      'Required bills like rent and utilities',
      'Emergency medical costs',
      'Minimum debt payments'
    ],
    correctAnswerIndex: 0,
    category: 'Budgeting',
    difficulty: 'easy',
    explanation: 'Discretionary expenses are non-essential purchases you choose to make, such as entertainment, hobbies, and dining out, as opposed to necessities.'
  },
  {
    questionText: 'How often should you review and adjust your budget?',
    options: [
      'Monthly',
      'Once a year',
      'Every 5 years',
      'Only when you get a raise'
    ],
    correctAnswerIndex: 0,
    category: 'Budgeting',
    difficulty: 'easy',
    explanation: 'Reviewing your budget monthly allows you to track spending, adjust for changes, and ensure you\'re meeting your financial goals consistently.'
  },
  {
    questionText: 'What is the envelope budgeting method?',
    options: [
      'Allocating cash to different envelopes for specific expense categories',
      'Saving money in hidden envelopes around the house',
      'Mailing budget payments in envelopes',
      'Using digital envelopes for cryptocurrency'
    ],
    correctAnswerIndex: 0,
    category: 'Budgeting',
    difficulty: 'medium',
    explanation: 'The envelope method involves dividing cash into physical envelopes labeled for specific expenses. Once an envelope is empty, you stop spending in that category.'
  },

  // Saving Questions (5)
  {
    questionText: 'How much should you aim to have in an emergency fund?',
    options: [
      '3-6 months of expenses',
      '1 month of expenses',
      '1 year of expenses',
      'Whatever is left at the end of the month'
    ],
    correctAnswerIndex: 0,
    category: 'Saving',
    difficulty: 'easy',
    explanation: 'Financial experts recommend having 3-6 months of living expenses saved in an emergency fund to cover unexpected costs or income loss.'
  },
  {
    questionText: 'What is the purpose of a high-yield savings account?',
    options: [
      'To earn higher interest rates on savings',
      'To invest in stocks',
      'To pay bills automatically',
      'To hide money from taxes'
    ],
    correctAnswerIndex: 0,
    category: 'Saving',
    difficulty: 'easy',
    explanation: 'High-yield savings accounts offer significantly higher interest rates than traditional savings accounts, helping your money grow faster while remaining accessible.'
  },
  {
    questionText: 'What is compound interest?',
    options: [
      'Interest earned on both principal and previously earned interest',
      'Interest paid only on the original principal',
      'A penalty for late payments',
      'Interest charged on credit cards'
    ],
    correctAnswerIndex: 0,
    category: 'Saving',
    difficulty: 'medium',
    explanation: 'Compound interest is interest calculated on the initial principal and accumulated interest from previous periods, allowing your savings to grow exponentially over time.'
  },
  {
    questionText: 'What is the best strategy for building savings?',
    options: [
      'Pay yourself first by automating savings',
      'Save whatever is left at month end',
      'Only save during high-income months',
      'Wait until you have a lot to save before starting'
    ],
    correctAnswerIndex: 0,
    category: 'Saving',
    difficulty: 'easy',
    explanation: 'Paying yourself first by automating transfers to savings ensures consistent saving habits and treats savings as a priority, not an afterthought.'
  },
  {
    questionText: 'What is a sinking fund?',
    options: [
      'Money saved gradually for a specific planned expense',
      'An emergency fund for unexpected costs',
      'A retirement investment account',
      'A fund that loses value over time'
    ],
    correctAnswerIndex: 0,
    category: 'Saving',
    difficulty: 'medium',
    explanation: 'A sinking fund is money set aside over time for a specific future purchase or expense, such as a vacation, car, or holiday gifts, helping avoid debt.'
  },

  // Additional Mixed Questions (2)
  {
    questionText: 'What is the Rule of 72?',
    options: [
      'A formula to estimate how long it takes to double your money',
      'The age you should retire',
      'The percentage of income to save',
      'The maximum credit card interest rate allowed'
    ],
    correctAnswerIndex: 0,
    category: 'Investing',
    difficulty: 'hard',
    explanation: 'The Rule of 72 estimates investment doubling time by dividing 72 by the annual rate of return. For example, at 8% return, investments double in approximately 9 years (72÷8).'
  },
  {
    questionText: 'What is lifestyle inflation?',
    options: [
      'Increasing spending as income rises',
      'The general rise in prices over time',
      'Investing in luxury goods',
      'Reducing expenses to save more'
    ],
    correctAnswerIndex: 0,
    category: 'Budgeting',
    difficulty: 'medium',
    explanation: 'Lifestyle inflation (or lifestyle creep) occurs when people increase their spending as their income grows, preventing them from building wealth despite earning more.'
  }
];

/**
 * Main seeding function
 */
const seedQuizzes = async () => {
  try {
    console.log('🌱 Starting quiz questions seeding process...\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/finance_db');
    console.log('✅ Successfully connected to MongoDB\n');

    // Clear existing quiz questions
    console.log('🗑️  Clearing existing quiz questions...');
    const deleteResult = await QuizQuestion.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} existing quiz questions\n`);

    // Insert new quiz questions
    console.log('📝 Inserting new quiz questions...');
    const insertedQuestions = await QuizQuestion.insertMany(quizQuestions);
    console.log(`✅ Successfully inserted ${insertedQuestions.length} quiz questions\n`);

    // Display summary by category
    console.log('📊 Quiz Questions Summary by Category:');
    const categories = ['Debt', 'Investing', 'Budgeting', 'Saving'];
    for (const category of categories) {
      const count = insertedQuestions.filter(q => q.category === category).length;
      console.log(`   • ${category}: ${count} questions`);
    }

    console.log('\n✨ Seeding completed successfully!\n');

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during seeding process:');
    console.error(error);
    
    // Ensure disconnection even on error
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('👋 Disconnected from MongoDB');
    }
    
    process.exit(1);
  }
};

// Run the seeding function
seedQuizzes();
