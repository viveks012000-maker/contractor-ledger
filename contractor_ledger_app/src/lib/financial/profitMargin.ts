import type { AnalyzeMarginInput, AnalyzeMarginResult, RequiredPriceInput, RequiredPriceResult } from './types';
import { MAX_SAFE_CURRENCY, roundCurrency, safeDivide } from './formatters';

// Mode A: Analyze Price
export function analyzeProfitMargin(input: AnalyzeMarginInput): AnalyzeMarginResult {
  if (
    !Number.isFinite(input.totalCost) || Math.abs(input.totalCost) > MAX_SAFE_CURRENCY ||
    !Number.isFinite(input.sellingPrice) || Math.abs(input.sellingPrice) > MAX_SAFE_CURRENCY
  ) {
    return {
      totalCost: 0,
      sellingPrice: 0,
      profit: 0,
      marginPct: 0,
      markupPct: 0,
      isLoss: false,
      isValid: false,
      errorMessage: 'One or more values exceed the safe currency range.',
    };
  }

  const totalCost = roundCurrency(Math.max(0, input.totalCost || 0));
  const sellingPrice = roundCurrency(Math.max(0, input.sellingPrice || 0));

  const profit = roundCurrency(sellingPrice - totalCost);
  const isLoss = profit < 0;

  let marginPct = 0;
  let markupPct = 0;

  if (sellingPrice > 0) {
    marginPct = roundCurrency((profit / sellingPrice) * 100);
  } else if (totalCost > 0) {
    marginPct = -100;
  }

  if (totalCost > 0) {
    markupPct = roundCurrency((profit / totalCost) * 100);
  } else if (sellingPrice > 0) {
    markupPct = 100; // Zero cost implies infinite/pure markup, capped
  }

  return {
    totalCost,
    sellingPrice,
    profit,
    marginPct,
    markupPct,
    isLoss,
    isValid: true,
  };
}

// Mode B: Calculate Required Price
export function calculateRequiredPrice(input: RequiredPriceInput): RequiredPriceResult {
  if (
    !Number.isFinite(input.totalCost) || Math.abs(input.totalCost) > MAX_SAFE_CURRENCY ||
    !Number.isFinite(input.targetMarginPct) || Math.abs(input.targetMarginPct) > MAX_SAFE_CURRENCY
  ) {
    return {
      totalCost: 0,
      targetMarginPct: 0,
      sellingPrice: 0,
      profit: 0,
      markupPct: 0,
      isValid: false,
      errorMessage: 'One or more values exceed the safe calculation range.',
    };
  }

  const totalCost = roundCurrency(Math.max(0, input.totalCost || 0));
  const targetMarginPct = input.targetMarginPct || 0;

  if (targetMarginPct >= 100) {
    return {
      totalCost,
      targetMarginPct,
      sellingPrice: 0,
      profit: 0,
      markupPct: 0,
      isValid: false,
      errorMessage: 'Target margin must be strictly less than 100%.',
    };
  }

  if (targetMarginPct < 0) {
    return {
      totalCost,
      targetMarginPct,
      sellingPrice: 0,
      profit: 0,
      markupPct: 0,
      isValid: false,
      errorMessage: 'Target margin cannot be negative.',
    };
  }

  let sellingPrice = 0;
  let profit = 0;
  let markupPct = 0;

  if (totalCost > 0) {
    const marginRatio = targetMarginPct / 100;
    const rawSellingPrice = totalCost / (1 - marginRatio);
    if (!Number.isFinite(rawSellingPrice) || rawSellingPrice > MAX_SAFE_CURRENCY) {
      return {
        totalCost,
        targetMarginPct,
        sellingPrice: 0,
        profit: 0,
        markupPct: 0,
        isValid: false,
        errorMessage: 'The target margin produces a price outside the safe currency range.',
      };
    }
    sellingPrice = roundCurrency(rawSellingPrice);
    profit = roundCurrency(sellingPrice - totalCost);
    markupPct = roundCurrency(safeDivide(profit, totalCost, 0) * 100);
  }

  return {
    totalCost,
    targetMarginPct,
    sellingPrice,
    profit,
    markupPct,
    isValid: true,
  };
}
