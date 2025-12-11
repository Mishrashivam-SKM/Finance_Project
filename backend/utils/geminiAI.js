const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Generate a personalized saving tip using Google Gemini AI
 * @param {object} financialData - User's financial data including income, expenses, assets, debts
 * @returns {Promise<string>} - A personalized saving tip from the AI
 */
const generateSavingTipFromAI = async (financialData) => {
  // Initialize the Gemini client with API key
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  // Get the Gemini model
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  // Construct the detailed prompt
  const prompt = `You are a Personal Finance Coach with expertise in budgeting, saving, and debt management. Based on the following financial data for a user, provide ONE specific, actionable, and personalized saving tip.

The tip should be:
- Directly relevant to the user's financial situation
- Practical and implementable immediately
- Specific (include numbers or percentages when appropriate)
- Encouraging and supportive in tone

User's Financial Data (Last 90 Days):
${JSON.stringify(financialData, null, 2)}

Key metrics to consider:
- Total Income: $${financialData.income?.total || 0}
- Total Expenses: $${financialData.expenses?.total || 0}
- Savings Rate: ${financialData.savingsRate || 0}%
- Highest Spending Category: ${financialData.expenses?.highestCategory?.name || 'N/A'} ($${financialData.expenses?.highestCategory?.amount || 0})
- Total Assets Value: $${financialData.assets?.totalValue || 0}
- Total Debts Balance: $${financialData.debts?.totalBalance || 0}
- Net Worth: $${financialData.netWorth || 0}

Please provide your personalized saving tip in 2-3 sentences. Focus on the most impactful action the user can take based on their specific situation.`;

  try {
    // Generate content using Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text.trim();
  } catch (error) {
    console.error('Gemini AI error:', error.message);
    throw new Error('Failed to generate saving tip from AI');
  }
};

module.exports = {
  generateSavingTipFromAI
};
