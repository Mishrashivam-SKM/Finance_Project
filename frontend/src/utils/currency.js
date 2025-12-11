/**
 * Format a number as Indian Rupee (INR)
 * Uses the 'en-IN' locale for correct numeral grouping
 * 
 * @param {number} amount - The amount to format
 * @returns {string} - The formatted INR string (e.g., "₹1,23,456.00")
 */
export const formatINR = (amount) => {
  // Handle invalid inputs
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0.00';
  }

  // Convert to number if it's a string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  // Use Intl.NumberFormat for proper INR formatting with en-IN locale
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(numAmount);
};

/**
 * Format a number as INR without decimal places
 * Useful for whole amounts
 * 
 * @param {number} amount - The amount to format
 * @returns {string} - The formatted INR string without decimals
 */
export const formatINRWhole = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return formatter.format(numAmount);
};

/**
 * Convert a formatted INR string back to a number
 * Useful for parsing displayed values
 * 
 * @param {string} formattedValue - The formatted INR string
 * @returns {number} - The numeric value
 */
export const parseINR = (formattedValue) => {
  if (!formattedValue || typeof formattedValue !== 'string') {
    return 0;
  }

  // Remove currency symbol and all non-numeric characters except decimal point
  const numericString = formattedValue
    .replace(/₹/g, '')
    .replace(/[^\d.-]/g, '')
    .trim();

  const parsed = parseFloat(numericString);
  return isNaN(parsed) ? 0 : parsed;
};

export default formatINR;
