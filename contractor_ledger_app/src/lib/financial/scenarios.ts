import type { PriceScenario, ScenarioComparisonResult } from './types';
import { roundCurrency, safeDivide } from './formatters';

export function calculatePriceScenarios(
  directCost: number,
  overhead: number,
  targetMarginPct: number = 25,
  customMargins?: { lower?: number; target?: number; higher?: number }
): ScenarioComparisonResult {
  const safeDirectCost = Math.max(0, directCost || 0);
  const safeOverhead = Math.max(0, overhead || 0);
  const totalCost = roundCurrency(safeDirectCost + safeOverhead);

  const baseTarget = Math.min(Math.max(customMargins?.target ?? targetMarginPct, 0), 99);
  const lowerMargin = Math.min(Math.max(customMargins?.lower ?? Math.max(5, baseTarget - 10), 0), 99);
  const higherMargin = Math.min(Math.max(customMargins?.higher ?? Math.min(60, baseTarget + 10), 0), 99);

  const configs = [
    {
      id: 'lower',
      label: 'Lower Price',
      tagline: 'Competitive / Volume Bid',
      marginPct: lowerMargin,
    },
    {
      id: 'target',
      label: 'Target Price',
      tagline: 'Standard Operational Goal',
      marginPct: baseTarget,
      isActive: true,
    },
    {
      id: 'higher',
      label: 'Higher Margin',
      tagline: 'Premium / Complex Scope',
      marginPct: higherMargin,
    },
  ];

  const scenarios: PriceScenario[] = configs.map(cfg => {
    let sellingPrice = 0;
    let profit = 0;
    let markupPct = 0;

    if (totalCost > 0 && cfg.marginPct < 100) {
      const marginRatio = cfg.marginPct / 100;
      sellingPrice = roundCurrency(totalCost / (1 - marginRatio));
      profit = roundCurrency(sellingPrice - totalCost);
      markupPct = roundCurrency(safeDivide(profit, totalCost, 0) * 100);
    }

    return {
      id: cfg.id,
      label: cfg.label,
      tagline: cfg.tagline,
      marginPct: cfg.marginPct,
      sellingPrice,
      totalCost,
      profit,
      markupPct,
      isActive: cfg.isActive,
    };
  });

  return {
    directCost: safeDirectCost,
    allocatedOverhead: safeOverhead,
    totalCost,
    scenarios,
  };
}
