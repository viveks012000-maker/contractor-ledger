import type { AnalyzeMarginInput, AnalyzeMarginResult, RequiredPriceInput, RequiredPriceResult } from './types';
import { roundCurrency, safeDivide } from './formatters';

// Mode A: Analyze Price
export function analyzeProfitMargin(input: AnalyzeMarginInput): AnalyzeMarginResult {
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
    sellingPrice = roundCurrency(totalCost / (1 - marginRatio));
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
