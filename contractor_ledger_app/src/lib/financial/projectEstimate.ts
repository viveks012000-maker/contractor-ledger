import type {
  ProjectEstimateInput,
  ProjectEstimateResult,
  EstimateCategory,
  CategorySummary,
  CurrencyBreakdownItem,
} from './types';
import { roundCurrency, safeDivide } from './formatters';

const CATEGORY_LABELS: Record<EstimateCategory, string> = {
  labor: 'Direct Labor',
  materials: 'Materials & Supplies',
  equipment: 'Equipment & Tooling',
  subcontractors: 'Subcontractors',
  other: 'Permits & Other Direct',
};

const CATEGORY_COLORS: Record<EstimateCategory, string> = {
  labor: '#4F5B57',
  materials: '#6F7974',
  equipment: '#8B9B95',
  subcontractors: '#A4B4AE',
  other: '#C3D0CA',
};

export function calculateProjectEstimate(input: ProjectEstimateInput): ProjectEstimateResult {
  const categories: EstimateCategory[] = ['labor', 'materials', 'equipment', 'subcontractors', 'other'];

  const categorySummaries: Record<EstimateCategory, CategorySummary> = {
    labor: { category: 'labor', label: CATEGORY_LABELS.labor, itemCount: 0, subtotal: 0, pctOfDirect: 0 },
    materials: { category: 'materials', label: CATEGORY_LABELS.materials, itemCount: 0, subtotal: 0, pctOfDirect: 0 },
    equipment: { category: 'equipment', label: CATEGORY_LABELS.equipment, itemCount: 0, subtotal: 0, pctOfDirect: 0 },
    subcontractors: { category: 'subcontractors', label: CATEGORY_LABELS.subcontractors, itemCount: 0, subtotal: 0, pctOfDirect: 0 },
    other: { category: 'other', label: CATEGORY_LABELS.other, itemCount: 0, subtotal: 0, pctOfDirect: 0 },
  };

  // Tally valid items
  let totalDirectCosts = 0;

  for (const item of input.items || []) {
    const qty = Math.max(0, item.quantity || 0);
    const cost = Math.max(0, item.unitCost || 0);
    const rowTotal = roundCurrency(qty * cost);

    if (categorySummaries[item.category]) {
      categorySummaries[item.category].itemCount += 1;
      categorySummaries[item.category].subtotal = roundCurrency(
        categorySummaries[item.category].subtotal + rowTotal
      );
      totalDirectCosts = roundCurrency(totalDirectCosts + rowTotal);
    }
  }

  // Calculate percentages of direct costs
  for (const cat of categories) {
    categorySummaries[cat].pctOfDirect = totalDirectCosts > 0
      ? roundCurrency((categorySummaries[cat].subtotal / totalDirectCosts) * 100)
      : 0;
  }

  // Calculate overhead
  let allocatedOverhead = 0;
  if (input.overheadMode === 'percentage') {
    const overheadPct = Math.max(0, input.overheadValue || 0);
    allocatedOverhead = roundCurrency(totalDirectCosts * (overheadPct / 100));
  } else {
    allocatedOverhead = roundCurrency(Math.max(0, input.overheadValue || 0));
  }

  const totalCost = roundCurrency(totalDirectCosts + allocatedOverhead);
  const targetMarginPct = input.targetMarginPct || 0;

  // Validation
  if (targetMarginPct >= 100) {
    return {
      categorySummaries,
      directCosts: totalDirectCosts,
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
      categorySummaries,
      directCosts: totalDirectCosts,
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
  }

  // Breakdown for visual bar
  const breakdown: CurrencyBreakdownItem[] = [];
  const denominator = sellingPrice > 0 ? sellingPrice : (totalCost > 0 ? totalCost : 1);

  for (const cat of categories) {
    const amt = categorySummaries[cat].subtotal;
    if (amt > 0) {
      breakdown.push({
        id: cat,
        label: CATEGORY_LABELS[cat],
        amount: amt,
        percentageOfTotal: roundCurrency((amt / denominator) * 100),
        color: CATEGORY_COLORS[cat],
      });
    }
  }

  if (allocatedOverhead > 0) {
    breakdown.push({
      id: 'overhead',
      label: 'Allocated Overhead',
      amount: allocatedOverhead,
      percentageOfTotal: roundCurrency((allocatedOverhead / denominator) * 100),
      color: '#CBD5E1',
    });
  }

  if (profit > 0 && sellingPrice > 0) {
    breakdown.push({
      id: 'profit',
      label: 'Net Gross Profit',
      amount: profit,
      percentageOfTotal: roundCurrency((profit / denominator) * 100),
      color: '#176B53',
    });
  }

  return {
    categorySummaries,
    directCosts: totalDirectCosts,
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
