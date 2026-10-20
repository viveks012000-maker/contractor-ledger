import type {
  ProjectEstimateInput,
  ProjectEstimateResult,
  EstimateCategory,
  CategorySummary,
  CurrencyBreakdownItem,
} from './types';
import { MAX_SAFE_CURRENCY, roundCurrency, safeDivide } from './formatters';

const CATEGORY_LABELS: Record<EstimateCategory, string> = {
  labor: 'Direct Labor',
  materials: 'Materials & Supplies',
  equipment: 'Equipment & Tooling',
  subcontractors: 'Subcontractors',
  other: 'Permits & Other Direct',
};

const CATEGORY_COLORS: Record<EstimateCategory, string> = {
  labor: 'var(--color-chart-labor)',
  materials: 'var(--color-chart-materials)',
  equipment: 'var(--color-chart-equipment)',
  subcontractors: 'var(--color-chart-subcontractors)',
  other: 'var(--color-chart-other)',
};

function emptyCategorySummaries(): Record<EstimateCategory, CategorySummary> {
  const categories: EstimateCategory[] = ['labor', 'materials', 'equipment', 'subcontractors', 'other'];
  return Object.fromEntries(categories.map(category => [category, {
    category,
    label: CATEGORY_LABELS[category],
    itemCount: 0,
    subtotal: 0,
    pctOfDirect: 0,
  }])) as Record<EstimateCategory, CategorySummary>;
}

function invalidProjectEstimateResult(errorMessage: string): ProjectEstimateResult {
  return {
    categorySummaries: emptyCategorySummaries(),
    directCosts: 0,
    allocatedOverhead: 0,
    totalCost: 0,
    targetMarginPct: 0,
    sellingPrice: 0,
    profit: 0,
    actualMarginPct: 0,
    markupEquivalentPct: 0,
    isValid: false,
    errorMessage,
    breakdown: [],
  };
}

export function calculateProjectEstimate(input: ProjectEstimateInput): ProjectEstimateResult {
  const items = input.items || [];
  if (
    !Number.isFinite(input.overheadValue) || Math.abs(input.overheadValue) > MAX_SAFE_CURRENCY ||
    !Number.isFinite(input.targetMarginPct) || Math.abs(input.targetMarginPct) > Number.MAX_SAFE_INTEGER ||
    items.some(item =>
      !Number.isFinite(item.quantity) || Math.abs(item.quantity) > Number.MAX_SAFE_INTEGER ||
      !Number.isFinite(item.unitCost) || Math.abs(item.unitCost) > MAX_SAFE_CURRENCY
    )
  ) {
    return invalidProjectEstimateResult('One or more values exceed the safe calculation range.');
  }

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

  for (const item of items) {
    const qty = Math.max(0, item.quantity || 0);
    const cost = Math.max(0, item.unitCost || 0);
    const rawRowTotal = qty * cost;
    if (!Number.isFinite(rawRowTotal) || rawRowTotal > MAX_SAFE_CURRENCY) {
      return invalidProjectEstimateResult('A line item exceeds the safe currency range.');
    }
    const rowTotal = roundCurrency(rawRowTotal);

    if (categorySummaries[item.category]) {
      const nextSubtotal = categorySummaries[item.category].subtotal + rowTotal;
      const nextDirectCosts = totalDirectCosts + rowTotal;
      if (nextSubtotal > MAX_SAFE_CURRENCY || nextDirectCosts > MAX_SAFE_CURRENCY) {
        return invalidProjectEstimateResult('Project direct costs exceed the safe currency range.');
      }
      categorySummaries[item.category].itemCount += 1;
      categorySummaries[item.category].subtotal = roundCurrency(nextSubtotal);
      totalDirectCosts = roundCurrency(nextDirectCosts);
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
    const rawOverhead = totalDirectCosts * (overheadPct / 100);
    if (!Number.isFinite(rawOverhead) || rawOverhead > MAX_SAFE_CURRENCY) {
      return invalidProjectEstimateResult('Allocated overhead exceeds the safe currency range.');
    }
    allocatedOverhead = roundCurrency(rawOverhead);
  } else {
    allocatedOverhead = roundCurrency(Math.max(0, input.overheadValue || 0));
  }

  const rawTotalCost = totalDirectCosts + allocatedOverhead;
  if (!Number.isFinite(rawTotalCost) || rawTotalCost > MAX_SAFE_CURRENCY) {
    return invalidProjectEstimateResult('Total project cost exceeds the safe currency range.');
  }
  const totalCost = roundCurrency(rawTotalCost);
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
    const rawSellingPrice = totalCost / (1 - marginRatio);
    if (!Number.isFinite(rawSellingPrice) || rawSellingPrice > MAX_SAFE_CURRENCY) {
      return invalidProjectEstimateResult('The target margin produces a price outside the safe currency range.');
    }
    sellingPrice = roundCurrency(rawSellingPrice);
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
      color: 'var(--color-chart-overhead)',
    });
  }

  if (profit > 0 && sellingPrice > 0) {
    breakdown.push({
      id: 'profit',
      label: 'Net Gross Profit',
      amount: profit,
      percentageOfTotal: roundCurrency((profit / denominator) * 100),
      color: 'var(--color-chart-profit)',
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
