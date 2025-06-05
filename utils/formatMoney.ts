export function formatMoney(amount: number, currency: string = 'USD') {
  // For JPY, don't divide by 100
  const isZeroDecimal = ['JPY'].includes(currency);
  const value = isZeroDecimal ? amount : amount / 100;
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
} 