const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('./models/Category');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const seedCategories = async () => {
  try {
    // Check if categories already exist
    const existingCount = await Category.countDocuments();
    if (existingCount > 0) {
      console.log('Categories already exist. Skipping seed.');
      process.exit(0);
    }

    const categories = [
      // Income categories
      { name: 'Salary', type: 'income', group: 'Work' },
      { name: 'Freelance', type: 'income', group: 'Work' },
      { name: 'Investment Returns', type: 'income', group: 'Investments' },
      { name: 'Bonus', type: 'income', group: 'Work' },
      { name: 'Other Income', type: 'income', group: 'Other' },

      // Expense categories
      { name: 'Groceries', type: 'expense', group: 'Food & Dining' },
      { name: 'Restaurant', type: 'expense', group: 'Food & Dining' },
      { name: 'Utilities', type: 'expense', group: 'Housing' },
      { name: 'Rent', type: 'expense', group: 'Housing' },
      { name: 'Gas', type: 'expense', group: 'Transportation' },
      { name: 'Car Payment', type: 'expense', group: 'Transportation' },
      { name: 'Insurance', type: 'expense', group: 'Protection' },
      { name: 'Entertainment', type: 'expense', group: 'Entertainment' },
      { name: 'Shopping', type: 'expense', group: 'Shopping' },
      { name: 'Healthcare', type: 'expense', group: 'Healthcare' },
      { name: 'Subscription', type: 'expense', group: 'Entertainment' },
      { name: 'Other Expense', type: 'expense', group: 'Other' },

      // Asset categories
      { name: 'Savings Account', type: 'asset', group: 'Banking' },
      { name: 'Checking Account', type: 'asset', group: 'Banking' },
      { name: 'Investment Account', type: 'asset', group: 'Investments' },
      { name: 'Real Estate', type: 'asset', group: 'Real Estate' },
      { name: 'Vehicle', type: 'asset', group: 'Vehicle' },
      { name: 'Retirement Account', type: 'asset', group: 'Retirement' },
      { name: 'Cryptocurrency', type: 'asset', group: 'Investments' },
      { name: 'Other Asset', type: 'asset', group: 'Other' },

      // Debt categories
      { name: 'Credit Card', type: 'debt', group: 'Credit' },
      { name: 'Student Loan', type: 'debt', group: 'Loans' },
      { name: 'Mortgage', type: 'debt', group: 'Housing' },
      { name: 'Car Loan', type: 'debt', group: 'Loans' },
      { name: 'Personal Loan', type: 'debt', group: 'Loans' },
      { name: 'Other Debt', type: 'debt', group: 'Other' }
    ];

    await Category.insertMany(categories);
    console.log(`✓ Successfully seeded ${categories.length} categories`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error.message);
    process.exit(1);
  }
};

seedCategories();
