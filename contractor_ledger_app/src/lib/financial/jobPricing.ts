import type { JobPricingInput, JobPricingResult, CurrencyBreakdownItem } from './types';
import { roundCurrency, safeDivide } from './formatters';

export function calculateJobPricing(input: JobPricingInput): JobPricingResult {
  const labor = Math.max(0, input.laborCost || 0);
  const materials = Math.max(0, input.materialCost || 0);
  const other = Math.max(0, input.otherCost || 0);
  const directCost = roundCurrency(labor + materials + other);

  let allocatedOverhead = 0;
  if (input.overheadMode === 'percentage') {
    const overheadPct = Math.max(0, input.overheadValue || 0);
    allocatedOverhead = roundCurrency(directCost * (overheadPct / 100));
  } else {
    allocatedOverhead = roundCurrency(Math.max(0, input.overheadValue || 0));
  }

  const totalCost = roundCurrency(directCost + allocatedOverhead);
  const targetMarginPct = input.targetMarginPct || 0;

  // Validation
  if (targetMarginPct >= 100) {
    return {
      directCost,
      allocatedOverhead,
      totalCost,
      targetMarginPct,
      sellingPrice: 0,
      profit: 0,
      actualMarginPct: 0,
      markupEquivalentPct: 0,
      isValid: false,
      errorMessage: 'Target margin must be strictly less than 100%.',
      breakdown: [],
    };
  }

  if (targetMarginPct < 0) {
    return {
      directCost,
      allocatedOverhead,
      totalCost,
      targetMarginPct,
      sellingPrice: 0,
      profit: 0,
      actualMarginPct: 0,
      markupEquivalentPct: 0,
      isValid: false,
      errorMessage: 'Target margin cannot be negative.',
      breakdown: [],
    };
  }

  let sellingPrice = 0;
  let profit = 0;
  let actualMarginPct = 0;
  let markupEquivalentPct = 0;

  if (totalCost > 0) {
    const marginRatio = targetMarginPct / 100;
    sellingPrice = roundCurrency(totalCost / (1 - marginRatio));
    profit = roundCurrency(sellingPrice - totalCost);
    actualMarginPct = roundCurrency(safeDivide(profit, sellingPrice, 0) * 100);
    markupEquivalentPct = roundCurrency(safeDivide(profit, totalCost, 0) * 100);
  } else {
    sellingPrice = 0;
    profit = 0;
    actualMarginPct = targetMarginPct;
    markupEquivalentPct = 0;
  }

  // Construct Breakdown for Visualization
  const breakdown: CurrencyBreakdownItem[] = [];
  const denominator = sellingPrice > 0 ? sellingPrice : (totalCost > 0 ? totalCost : 1);

  if (labor > 0) {
    breakdown.push({
      id: 'labor',
      label: 'Direct Labor',
      amount: labor,
      percentageOfTotal: roundCurrency((labor / denominator) * 100),
      color: '#4F5B57',
    });
  }
  if (materials > 0) {
    breakdown.push({
      id: 'materials',
      label: 'Materials',
      amount: materials,
      percentageOfTotal: roundCurrency((materials / denominator) * 100),
      color: '#6F7974',
    });
  }
  if (other > 0) {
    breakdown.push({
      id: 'other',
      label: 'Other Direct Costs',
      amount: other,
      percentageOfTotal: roundCurrency((other / denominator) * 100),
      color: '#9CA3AF',
    });
  }
  if (allocatedOverhead > 0) {
    breakdown.push({
      id: 'overhead',
      label: 'Allocated Overhead',
      amount: allocatedOverhead,
      percentageOfTotal: roundCurrency((allocatedOverhead / denominator) * 100),
      color: '#D1D5DB',
    });
  }
  if (profit > 0 && sellingPrice > 0) {
    breakdown.push({
      id: 'profit',
      label: 'Gross Profit',
      amount: profit,
      percentageOfTotal: roundCurrency((profit / denominator) * 100),
      color: '#176B53',
    });
  }

  return {
    directCost,
    allocatedOverhead,
    totalCost,
    targetMarginPct,
    sellingPrice,
    profit,
    actualMarginPct,
    markupEquivalentPct,
    isValid: true,
    breakdown,
  };
}
