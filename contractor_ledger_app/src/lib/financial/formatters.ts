/**
 * Precision and formatting utilities for financial calculations
 */

/** Largest currency amount whose cents can still be represented as a safe integer. */
export const MAX_SAFE_CURRENCY = Number.MAX_SAFE_INTEGER / 100;

export function roundCurrency(value: number): number {
  if (!Number.isFinite(value) || Math.abs(value) > MAX_SAFE_CURRENCY) return 0;
  const cents = Math.round((value + Number.EPSILON) * 100);
  return Number.isSafeInteger(cents) ? cents / 100 : 0;
}

export function roundPrecision(value: number, decimals: number = 2): number {
  if (!Number.isFinite(value)) return 0;
  const factor = Math.pow(10, decimals);
  const rounded = Math.round((value + Number.EPSILON) * factor) / factor;
  return Number.isFinite(rounded) ? rounded : 0;
}

export function safeDivide(numerator: number, denominator: number, fallback: number = 0): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return fallback;
  }
  const result = numerator / denominator;
  return Number.isFinite(result) ? result : fallback;
}

export function parseSafeNumber(value: unknown, fallback: number = 0): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/[\$,\s%]/g, '');
    if (cleaned === '' || cleaned === '-') return fallback;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

export function formatCurrency(
  value: number,
  options?: {
    showCents?: boolean;
    useAccountingNegative?: boolean;
  }
): string {
  if (!Number.isFinite(value) || Math.abs(value) > MAX_SAFE_CURRENCY) return '—';

  const showCents = options?.showCents !== false;
  const isNegative = value < 0;
  const absoluteValue = Math.abs(value);

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(absoluteValue);

  if (isNegative) {
    return options?.useAccountingNegative ? `(${formatted})` : `-${formatted}`;
  }
  return formatted;
}

export function formatPercent(value: number, decimals: number = 1): string {
  if (!Number.isFinite(value)) return '0.0%';
  return `${value.toFixed(decimals)}%`;
}

export function formatQuantity(value: number, decimals: number = 2): string {
  if (!Number.isFinite(value)) return '0';
  // Avoid trailing zeros if it's an integer
  if (Number.isInteger(value)) return value.toString();
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}
