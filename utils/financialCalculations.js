/**
 * Financial calculation utilities for investment projections
 */

/**
 * Calculate compound interest with monthly contributions
 * @param {number} initialInvestment - Initial principal amount
 * @param {number} monthlyContribution - Amount contributed each month
 * @param {number} annualReturn - Annual return rate as percentage (e.g., 7 for 7%)
 * @param {number} years - Investment time horizon in years
 * @returns {object} - Object containing yearly projections and final value
 */
const calculateCompoundInterest = (initialInvestment, monthlyContribution, annualReturn, years) => {
  const monthlyRate = annualReturn / 100 / 12;
  const yearlyProjections = [];
  
  let currentValue = initialInvestment;
  let totalContributions = initialInvestment;

  for (let year = 1; year <= years; year++) {
    // Calculate growth for each month of the year
    for (let month = 1; month <= 12; month++) {
      // Add monthly contribution at the beginning of each month
      currentValue += monthlyContribution;
      totalContributions += monthlyContribution;
      
      // Apply monthly interest
      currentValue *= (1 + monthlyRate);
    }

    // Record yearly projection
    yearlyProjections.push({
      year,
      value: Math.round(currentValue * 100) / 100,
      totalContributions: Math.round(totalContributions * 100) / 100,
      interestEarned: Math.round((currentValue - totalContributions) * 100) / 100
    });
  }

  return {
    initialInvestment,
    monthlyContribution,
    annualReturn,
    years,
    yearlyProjections,
    finalValue: Math.round(currentValue * 100) / 100,
    totalContributions: Math.round(totalContributions * 100) / 100,
    totalInterestEarned: Math.round((currentValue - totalContributions) * 100) / 100
  };
};

module.exports = {
  calculateCompoundInterest
};
