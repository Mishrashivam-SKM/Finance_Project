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

/**
 * Calculate retirement future value with inflation adjustment
 * @param {number} currentSavings - Current retirement savings
 * @param {number} annualContribution - Amount contributed each year
 * @param {number} annualReturn - Annual return rate as percentage (e.g., 7 for 7%)
 * @param {number} inflationRate - Annual inflation rate as percentage (e.g., 3 for 3%)
 * @param {number} yearsUntilRetirement - Years until retirement
 * @returns {object} - Object containing inflation-adjusted future value and yearly projections
 */
const calculateRetirementFutureValue = (currentSavings, annualContribution, annualReturn, inflationRate, yearsUntilRetirement) => {
  const nominalRate = annualReturn / 100;
  const inflation = inflationRate / 100;
  
  // Calculate real rate of return (adjusted for inflation)
  // Using Fisher equation: realRate ≈ (1 + nominalRate) / (1 + inflationRate) - 1
  const realRate = (1 + nominalRate) / (1 + inflation) - 1;
  
  const yearlyProjections = [];
  
  let nominalValue = currentSavings;
  let inflationAdjustedValue = currentSavings;
  let totalContributions = currentSavings;

  for (let year = 1; year <= yearsUntilRetirement; year++) {
    // Add annual contribution at the beginning of each year
    nominalValue += annualContribution;
    totalContributions += annualContribution;
    
    // Apply nominal return
    nominalValue *= (1 + nominalRate);
    
    // Calculate inflation-adjusted value using real rate
    inflationAdjustedValue += annualContribution;
    inflationAdjustedValue *= (1 + realRate);

    // Record yearly projection
    yearlyProjections.push({
      year,
      nominalValue: Math.round(nominalValue * 100) / 100,
      inflationAdjustedValue: Math.round(inflationAdjustedValue * 100) / 100,
      totalContributions: Math.round(totalContributions * 100) / 100,
      purchasingPowerLoss: Math.round((nominalValue - inflationAdjustedValue) * 100) / 100
    });
  }

  return {
    currentSavings,
    annualContribution,
    annualReturn,
    inflationRate,
    yearsUntilRetirement,
    realRateOfReturn: Math.round(realRate * 10000) / 100, // as percentage
    yearlyProjections,
    projectedNominalValue: Math.round(nominalValue * 100) / 100,
    projectedInflationAdjustedValue: Math.round(inflationAdjustedValue * 100) / 100,
    totalContributions: Math.round(totalContributions * 100) / 100,
    totalNominalGrowth: Math.round((nominalValue - totalContributions) * 100) / 100,
    totalRealGrowth: Math.round((inflationAdjustedValue - totalContributions) * 100) / 100
  };
};

module.exports = {
  calculateCompoundInterest,
  calculateRetirementFutureValue
};
