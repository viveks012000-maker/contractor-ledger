import type { JobPricingInput, JobPricingResult, CurrencyBreakdownItem } from './types';
import { MAX_SAFE_CURRENCY, roundCurrency, safeDivide } from './formatters';

function invalidJobPricingResult(errorMessage: string, targetMarginPct = 0): JobPricingResult {
  return {
    directCost: 0,
    allocatedOverhead: 0,
    totalCost: 0,
    targetMarginPct,
    sellingPrice: 0,
    profit: 0,
    actualMarginPct: 0,
    markupEquivalentPct: 0,
    isValid: false,
    errorMessage,
    breakdown: [],
  };
}

export function calculateJobPricing(input: JobPricingInput): JobPricingResult {
  const rawNumbers = [input.laborCost, input.materialCost, input.otherCost, input.overheadValue, input.targetMarginPct];
  if (rawNumbers.some(value => !Number.isFinite(value) || Math.abs(value) > MAX_SAFE_CURRENCY)) {
    return invalidJobPricingResult('One or more values exceed the safe calculation range. Enter a smaller amount.');
  }

  // Normalize each displayed cost component to cents before summing so the breakdown reconciles.
  const labor = roundCurrency(Math.max(0, input.laborCost || 0));
  const materials = roundCurrency(Math.max(0, input.materialCost || 0));
  const other = roundCurrency(Math.max(0, input.otherCost || 0));
  const rawDirectCost = labor + materials + other;
  if (!Number.isFinite(rawDirectCost) || rawDirectCost > MAX_SAFE_CURRENCY) {
    return invalidJobPricingResult('Total direct costs exceed the safe calculation range.', input.targetMarginPct);
  }
  const directCost = roundCurrency(rawDirectCost);

  let allocatedOverhead = 0;
  if (input.overheadMode === 'percentage') {
    const overheadPct = Math.max(0, input.overheadValue || 0);
    const rawOverhead = directCost * (overheadPct / 100);
    if (!Number.isFinite(rawOverhead) || rawOverhead > MAX_SAFE_CURRENCY) {
      return invalidJobPricingResult('Allocated overhead exceeds the safe calculation range.', input.targetMarginPct);
    }
    allocatedOverhead = roundCurrency(rawOverhead);
  } else {
    allocatedOverhead = roundCurrency(Math.max(0, input.overheadValue || 0));
  }

  const rawTotalCost = directCost + allocatedOverhead;
  if (!Number.isFinite(rawTotalCost) || rawTotalCost > MAX_SAFE_CURRENCY) {
    return invalidJobPricingResult('Total job cost exceeds the safe calculation range.', input.targetMarginPct);
  }
  const totalCost = roundCurrency(rawTotalCost);
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
    const rawSellingPrice = totalCost / (1 - marginRatio);
    if (!Number.isFinite(rawSellingPrice) || rawSellingPrice > MAX_SAFE_CURRENCY) {
      return invalidJobPricingResult('The target margin produces a price outside the safe calculation range.', targetMarginPct);
    }
    sellingPrice = roundCurrency(rawSellingPrice);
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
      color: 'var(--color-chart-labor)',
    });
  }
  if (materials > 0) {
    breakdown.push({
      id: 'materials',
      label: 'Materials',
      amount: materials,
      percentageOfTotal: roundCurrency((materials / denominator) * 100),
      color: 'var(--color-chart-materials)',
    });
  }
  if (other > 0) {
    breakdown.push({
      id: 'other',
      label: 'Other Direct Costs',
      amount: other,
      percentageOfTotal: roundCurrency((other / denominator) * 100),
      color: 'var(--color-chart-other)',
    });
  }
  if (allocatedOverhead > 0) {
    breakdown.push({
      id: 'overhead',
      label: 'Allocated Overhead',
      amount: allocatedOverhead,
      percentageOfTotal: roundCurrency((allocatedOverhead / denominator) * 100),
      color: 'var(--color-chart-overhead)',
    });
  }
  if (profit > 0 && sellingPrice > 0) {
    breakdown.push({
      id: 'profit',
      label: 'Gross Profit',
      amount: profit,
      percentageOfTotal: roundCurrency((profit / denominator) * 100),
      color: 'var(--color-chart-profit)',
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
