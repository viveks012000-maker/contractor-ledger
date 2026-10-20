import type { PriceScenario, ScenarioComparisonResult } from './types';
import { MAX_SAFE_CURRENCY, roundCurrency, safeDivide } from './formatters';

function invalidScenarioResult(errorMessage: string): ScenarioComparisonResult {
  return {
    directCost: 0,
    allocatedOverhead: 0,
    totalCost: 0,
    isValid: false,
    errorMessage,
    scenarios: [],
  };
}

export function calculatePriceScenarios(
  directCost: number,
  overhead: number,
  targetMarginPct: number = 25,
  customMargins?: { lower?: number; target?: number; higher?: number }
): ScenarioComparisonResult {
  const marginValues = [targetMarginPct, customMargins?.lower, customMargins?.target, customMargins?.higher]
    .filter((value): value is number => value !== undefined);

  if (
    !Number.isFinite(directCost) || Math.abs(directCost) > MAX_SAFE_CURRENCY ||
    !Number.isFinite(overhead) || Math.abs(overhead) > MAX_SAFE_CURRENCY ||
    marginValues.some(value => !Number.isFinite(value))
  ) {
    return invalidScenarioResult('Scenario inputs must be finite values within the supported range.');
  }

  const safeDirectCost = roundCurrency(Math.max(0, directCost));
  const safeOverhead = roundCurrency(Math.max(0, overhead));
  const rawTotalCost = safeDirectCost + safeOverhead;
  if (!Number.isFinite(rawTotalCost) || rawTotalCost > MAX_SAFE_CURRENCY) {
    return invalidScenarioResult('Scenario costs exceed the safe currency range.');
  }
  const totalCost = roundCurrency(rawTotalCost);

  const baseTarget = Math.min(Math.max(customMargins?.target ?? targetMarginPct, 0), 99);
  const lowerMargin = Math.min(Math.max(customMargins?.lower ?? baseTarget - 10, 0), 99);
  const higherMargin = Math.min(Math.max(customMargins?.higher ?? baseTarget + 10, 0), 99);

  const configs = [
    { id: 'lower', label: 'Lower Price', tagline: 'Competitive / Volume Bid', marginPct: lowerMargin },
    { id: 'target', label: 'Target Price', tagline: 'Selected Target', marginPct: baseTarget, isActive: true },
    { id: 'higher', label: 'Higher Margin', tagline: 'Premium / Complex Scope', marginPct: higherMargin },
  ];

  const scenarios: PriceScenario[] = configs.map(config => {
    if (totalCost === 0) {
      return {
        ...config,
        sellingPrice: 0,
        totalCost,
        profit: 0,
        markupPct: 0,
        isValid: true,
      };
    }

    const rawSellingPrice = totalCost / (1 - config.marginPct / 100);
    if (!Number.isFinite(rawSellingPrice) || rawSellingPrice > MAX_SAFE_CURRENCY) {
      return {
        ...config,
        sellingPrice: 0,
        totalCost,
        profit: 0,
        markupPct: 0,
        isValid: false,
        errorMessage: 'This margin produces a price outside the supported currency range.',
      };
    }

    const sellingPrice = roundCurrency(rawSellingPrice);
    const profit = roundCurrency(sellingPrice - totalCost);
    return {
      ...config,
      sellingPrice,
      totalCost,
      profit,
      markupPct: roundCurrency(safeDivide(profit, totalCost, 0) * 100),
      isValid: true,
    };
  });

  return {
    directCost: safeDirectCost,
    allocatedOverhead: safeOverhead,
    totalCost,
    isValid: true,
    scenarios,
  };
}
