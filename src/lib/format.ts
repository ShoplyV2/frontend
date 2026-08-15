export function formatMoney(minor: number, currency = 'GHS'): string {
  const major = minor / 100;
  const formatted = major.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${currency} ${formatted}`;
}
