/**
 * Format number as Pakistani Rupee (PKR)
 * @param amount - The amount to format
 * @returns Formatted string with Rs. prefix
 */
export function formatCurrency(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(numAmount)) return 'Rs. 0.00'
  return `Rs. ${numAmount.toFixed(2)}`
}

/**
 * Format number as Pakistani Rupee without decimal places
 * @param amount - The amount to format
 * @returns Formatted string with Rs. prefix (no decimals)
 */
export function formatCurrencyNoDecimals(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(numAmount)) return 'Rs. 0'
  return `Rs. ${Math.round(numAmount)}`
}

/**
 * Get just the currency symbol
 */
export const CURRENCY_SYMBOL = 'Rs.'

