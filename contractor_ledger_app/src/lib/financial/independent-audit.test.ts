import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calculateJobPricing } from './jobPricing';
import { calculateLaborCost } from './laborCost';
import { analyzeProfitMargin, calculateRequiredPrice } from './profitMargin';
import { calculateBreakEven } from './breakEven';
import { calculateMaterialMarkup } from './materialMarkup';
import { calculateProjectEstimate } from './projectEstimate';
import { calculatePriceScenarios } from './scenarios';
import { MAX_SAFE_CURRENCY } from './formatters';
import {
  loadSharedSettings,
  saveSharedSettings,
  resetSharedSettings,
  DEFAULT_SHARED_SETTINGS,
} from './storage';

describe('INDEPENDENT AUDIT: Mathematical Oracles & Precision', () => {
  it('Oracle Audit 1: Job Pricing Margin vs. Markup Mathematical Integrity', () => {
    // Independent manual calculation:
    // Direct Costs: $1,250 labor, $820 materials, $130 other = $2,200 direct
    // Overhead: 15% of $2,200 = $330.00
    // Total Estimated Cost = $2,530.00
    // Target Gross Margin = 30% (0.30)
    // Formula: Price = Cost ÷ (1 - Margin) = $2,530 ÷ 0.70 = $3,614.2857... -> $3,614.29
    // Gross Profit = $3,614.29 - $2,530.00 = $1,084.29
    // Actual Margin = $1,084.29 ÷ $3,614.29 = 0.2999997... -> 30.0%
    // Markup Equivalent = $1,084.29 ÷ $2,530.00 = 0.42857... -> 42.9%

    const result = calculateJobPricing({
      laborCost: 1250,
      materialCost: 820,
      otherCost: 130,
      overheadMode: 'percentage',
      overheadValue: 15,
      targetMarginPct: 30,
    });

    expect(result.isValid).toBe(true);
    expect(result.directCost).toBe(2200);
    expect(result.allocatedOverhead).toBe(330);
    expect(result.totalCost).toBe(2530);
    expect(result.sellingPrice).toBe(3614.29);
    expect(result.profit).toBe(1084.29);
    expect(result.actualMarginPct).toBe(30);
    expect(result.markupEquivalentPct).toBeCloseTo(42.86, 1);
  });

  it('Oracle Audit 2: Labor Cost Loaded Rate with Overtime and Tax Burden', () => {
    // Independent manual calculation:
    // 3 crew workers
    // 35 regular hours per worker @ $45.00/hr
    // 8 overtime hours per worker @ 1.5x multiplier ($67.50/hr)
    // Regular crew wages = 3 * 35 * $45.00 = $4,725.00
    // Overtime crew wages = 3 * 8 * $67.50 = $1,620.00
    // Gross Wages = $4,725 + $1,620 = $6,345.00
    // Employer Burden: 24% = $6,345 * 0.24 = $1,522.80
    // Additional Expenses: $250.00 (fuel/per-diem)
    // Total Labor Cost = $6,345.00 + $1,522.80 + $250.00 = $8,117.80
    // Total Crew Hours = 3 * (35 + 8) = 129 hours
    // Loaded Cost / Hour = $8,117.80 ÷ 129 = $62.9286... -> $62.93/hr

    const result = calculateLaborCost({
      workersCount: 3,
      regularHoursPerWorker: 35,
      hourlyWage: 45,
      overtimeHoursPerWorker: 8,
      overtimeMultiplier: 1.5,
      burdenPercentage: 24,
      additionalExpenses: 250,
    });

    expect(result.isValid).toBe(true);
    expect(result.totalWorkers).toBe(3);
    expect(result.regularHoursTotal).toBe(105);
    expect(result.overtimeHoursTotal).toBe(24);
    expect(result.totalHours).toBe(129);
    expect(result.regularWages).toBe(4725);
    expect(result.overtimeWages).toBe(1620);
    expect(result.grossWages).toBe(6345);
    expect(result.employerBurden).toBe(1522.8);
    expect(result.totalLaborCost).toBe(8117.8);
    expect(result.loadedHourlyCost).toBe(62.93);
  });

  it('Oracle Audit 3: Profit Margin Loss-Making & Extreme Boundary Cases', () => {
    // Case 1: Job sold at severe loss ($10,000 cost, $7,500 selling price)
    // Profit = -$2,500.00
    // Margin = -2500 / 7500 = -33.33%
    // Markup = -2500 / 10000 = -25.0%
    const lossResult = analyzeProfitMargin({
      totalCost: 10000,
      sellingPrice: 7500,
    });
    expect(lossResult.isLoss).toBe(true);
    expect(lossResult.profit).toBe(-2500);
    expect(lossResult.marginPct).toBeCloseTo(-33.33, 1);
    expect(lossResult.markupPct).toBe(-25);

    // Case 2: Margin at 99% boundary (valid positive cost)
    // Cost $100, Margin 99% -> Price = 100 / (1 - 0.99) = $10,000
    const highMarginResult = calculateRequiredPrice({
      totalCost: 100,
      targetMarginPct: 99,
    });
    expect(highMarginResult.isValid).toBe(true);
    expect(highMarginResult.sellingPrice).toBe(10000);
    expect(highMarginResult.profit).toBe(9900);

    // Case 3: Margin at 100% boundary (mathematical asymptote -> rejected)
    const invalidMarginResult = calculateRequiredPrice({
      totalCost: 100,
      targetMarginPct: 100,
    });
    expect(invalidMarginResult.isValid).toBe(false);
    expect(invalidMarginResult.sellingPrice).toBe(0);
  });

  it('Oracle Audit 4: Break-Even Recovery with Variable Hours', () => {
    // Fixed Costs: $8,400/mo (Office, shop, vehicle leases, insurance, licenses)
    // Billable Hours: 140 hrs/mo (2 full-time technicians billing 70 hrs/mo each)
    // Variable Cost/Hr: $18.50/hr
    // Fixed Overhead Recovery = $8,400 ÷ 140 = $60.00/hr
    // Break-Even Rate = $60.00 + $18.50 = $78.50/hr
    // Required Monthly Revenue = $8,400 + ($18.50 * 140) = $8,400 + $2,590 = $10,990.00/mo

    const result = calculateBreakEven({
      fixedMonthlyCosts: 8400,
      expectedMonthlyBillableHours: 140,
      variableCostPerHour: 18.5,
    });

    expect(result.isValid).toBe(true);
    expect(result.fixedOverheadPerHour).toBe(60);
    expect(result.breakEvenHourlyRate).toBe(78.5);
    expect(result.monthlyRevenueRequired).toBe(10990);
  });

  it('Oracle Audit 5: Material Markup with Fractional Scrap/Waste Allowance', () => {
    // 42.5 linear feet of custom millwork trim @ $18.25/ft
    // Waste allowance: 12.5% (cuts and miters)
    // Effective Quantity = 42.5 * 1.125 = 47.8125 ft
    // Adjusted Material Cost = 47.8125 * $18.25 = $872.578125 -> $872.58
    // Target Markup: 35.0%
    // Markup Amount = $872.58 * 0.35 = $305.403 -> $305.40
    // Selling Price = $872.58 + $305.40 = $1,177.98
    // Gross Profit = $305.40
    // Resulting Margin = $305.40 ÷ $1,177.98 = 0.259257... -> 25.9%

    const result = calculateMaterialMarkup({
      quantity: 42.5,
      unitCost: 18.25,
      wasteAllowancePct: 12.5,
      targetMarkupPct: 35,
    });

    expect(result.isValid).toBe(true);
    expect(result.effectiveQuantity).toBe(47.8125);
    expect(result.adjustedMaterialCost).toBe(872.58);
    expect(result.markupAmount).toBe(305.4);
    expect(result.sellingPrice).toBe(1177.98);
    expect(result.profit).toBe(305.4);
    expect(result.profitMarginPct).toBeCloseTo(25.9, 1);
  });

  it('Oracle Audit 6: Project Estimate Ledger Penny-Rounding & Category Segregation', () => {
    // 3 items with penny fractions:
    // Item 1 (Labor): 7 hrs @ $14.29 = $100.03
    // Item 2 (Materials): 13 units @ $3.33 = $43.29
    // Item 3 (Equipment): 0.5 days @ $99.99 = $50.00 (half of 99.99 = 49.995 -> 50.00)
    // Direct Costs = $100.03 + $43.29 + $50.00 = $193.32
    // Overhead: 15% of $193.32 = $28.998 -> $29.00
    // Total Cost = $193.32 + $29.00 = $222.32
    // Target Margin: 20% (divisor 0.8)
    // Selling Price = $222.32 ÷ 0.8 = $277.90
    // Profit = $277.90 - $222.32 = $55.58
    // Actual Margin = $55.58 ÷ $277.90 = 20.00%

    const result = calculateProjectEstimate({
      items: [
        { id: '1', category: 'labor', description: 'Labor', quantity: 7, unit: 'hrs', unitCost: 14.29 },
        { id: '2', category: 'materials', description: 'Materials', quantity: 13, unit: 'ea', unitCost: 3.33 },
        { id: '3', category: 'equipment', description: 'Equipment', quantity: 0.5, unit: 'day', unitCost: 99.99 },
      ],
      overheadMode: 'percentage',
      overheadValue: 15,
      targetMarginPct: 20,
    });

    expect(result.isValid).toBe(true);
    expect(result.categorySummaries.labor.subtotal).toBe(100.03);
    expect(result.categorySummaries.materials.subtotal).toBe(43.29);
    expect(result.categorySummaries.equipment.subtotal).toBe(50.0);
    expect(result.directCosts).toBe(193.32);
    expect(result.allocatedOverhead).toBe(29.0);
    expect(result.totalCost).toBe(222.32);
    expect(result.sellingPrice).toBe(277.9);
    expect(result.profit).toBe(55.58);
    expect(result.actualMarginPct).toBe(20.0);
  });

  it('Oracle Audit 7: Repeated fractional-cent line items round per row before summing', () => {
    const result = calculateProjectEstimate({
      items: [1, 2, 3].map(id => ({
        id: String(id),
        category: 'materials' as const,
        description: `Fractional material ${id}`,
        quantity: 1.25,
        unit: 'ea',
        unitCost: 0.1,
      })),
      overheadMode: 'fixed',
      overheadValue: 0,
      targetMarginPct: 0,
    });

    // Each row is $0.125 and rounds to $0.13. Three displayed line items sum to $0.39.
    expect(result.isValid).toBe(true);
    expect(result.categorySummaries.materials.subtotal).toBe(0.39);
    expect(result.directCosts).toBe(0.39);
    expect(result.sellingPrice).toBe(0.39);
  });

  it('Oracle Audit 8: Displayed job and labor components reconcile after cent rounding', () => {
    const job = calculateJobPricing({
      laborCost: 0.005,
      materialCost: 0.005,
      otherCost: 0,
      overheadMode: 'fixed',
      overheadValue: 0,
      targetMarginPct: 0,
    });
    expect(job.totalCost).toBe(0.02);
    expect(job.breakdown.reduce((sum, item) => sum + item.amount, 0)).toBe(0.02);
    expect(job.sellingPrice).toBe(0.02);

    const labor = calculateLaborCost({
      workersCount: 1,
      regularHoursPerWorker: 1,
      hourlyWage: 1.005,
      overtimeHoursPerWorker: 0,
      overtimeMultiplier: 1.5,
      burdenPercentage: 0,
      additionalExpenses: 0.005,
    });
    expect(labor.totalLaborCost).toBe(1.02);
    expect(labor.breakdown.reduce((sum, item) => sum + item.amount, 0)).toBe(1.02);
  });
});

describe('INDEPENDENT AUDIT: Shared Capabilities & Storage Robustness', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    vi.stubGlobal('window', {
      localStorage: {
        getItem: vi.fn((key: string) => mockStorage[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
          mockStorage[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete mockStorage[key];
        }),
      },
    });
  });

  it('Storage Audit 1: Clean Save, Load, and Reset Cycle', () => {
    // 1. Initial load falls back to defaults
    const initial = loadSharedSettings();
    expect(initial.defaultLaborRate).toBe(DEFAULT_SHARED_SETTINGS.defaultLaborRate);

    // 2. Save custom overrides
    const saved = saveSharedSettings({
      defaultLaborRate: 85,
      defaultBurdenPercent: 28,
      defaultOverheadPercent: 18,
      defaultTargetMarginPercent: 30,
    });
    expect(saved).toBe(true);

    // 3. Reload verifies persisted values
    const reloaded = loadSharedSettings();
    expect(reloaded.defaultLaborRate).toBe(85);
    expect(reloaded.defaultBurdenPercent).toBe(28);
    expect(reloaded.defaultOverheadPercent).toBe(18);
    expect(reloaded.defaultTargetMarginPercent).toBe(30);

    // 4. Reset returns to defaults
    const reset = resetSharedSettings();
    expect(reset.defaultLaborRate).toBe(DEFAULT_SHARED_SETTINGS.defaultLaborRate);
  });

  it('Storage Audit 1b: Persists intentional zero defaults', () => {
    expect(saveSharedSettings({
      defaultLaborRate: 0,
      defaultBurdenPercent: 0,
      defaultOverheadPercent: 0,
      defaultTargetMarginPercent: 0,
    })).toBe(true);

    expect(loadSharedSettings()).toMatchObject({
      defaultLaborRate: 0,
      defaultBurdenPercent: 0,
      defaultOverheadPercent: 0,
      defaultTargetMarginPercent: 0,
    });
  });

  it('Storage Audit 1c: Rejects unsafe defaults without replacing the prior saved values', () => {
    expect(saveSharedSettings({ defaultLaborRate: 85 })).toBe(true);
    expect(saveSharedSettings({ defaultLaborRate: Number.POSITIVE_INFINITY })).toBe(false);
    expect(loadSharedSettings().defaultLaborRate).toBe(85);
  });

  it('Storage Audit 2: Handles Corrupted and Malformed LocalStorage Without Crashing', () => {
    // Corrupt data with invalid non-JSON string
    mockStorage['contractor_ledger_user_defaults_v1'] = '{bad_json: invalid!###';
    const fallback1 = loadSharedSettings();
    expect(fallback1.defaultLaborRate).toBe(DEFAULT_SHARED_SETTINGS.defaultLaborRate);

    // Incompatible version schema (e.g. version 99)
    mockStorage['contractor_ledger_user_defaults_v1'] = JSON.stringify({ version: 99, defaultLaborRate: 999 });
    const fallback2 = loadSharedSettings();
    expect(fallback2.defaultLaborRate).toBe(DEFAULT_SHARED_SETTINGS.defaultLaborRate);
  });

  it('Storage Audit 3: Handles Blocked Storage (e.g. Safari Private Mode / SecurityError)', () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: vi.fn(() => {
          throw new Error('SecurityError: The operation is insecure.');
        }),
        setItem: vi.fn(() => {
          throw new Error('SecurityError: The operation is insecure.');
        }),
        removeItem: vi.fn(),
      },
    });

    // Must return safe defaults without throwing
    expect(() => loadSharedSettings()).not.toThrow();
    const result = loadSharedSettings();
    expect(result.defaultLaborRate).toBe(DEFAULT_SHARED_SETTINGS.defaultLaborRate);

    // Saving returns false safely without throwing
    expect(() => saveSharedSettings({ defaultLaborRate: 90 })).not.toThrow();
    const saveResult = saveSharedSettings({ defaultLaborRate: 90 });
    expect(saveResult).toBe(false);
  });

  it('Scenario Audit: Side-by-Side Comparison Independence', () => {
    const baseline = calculatePriceScenarios(1000, 200, 25);
    expect(baseline.totalCost).toBe(1200);

    // Custom override on lower margin only
    const custom = calculatePriceScenarios(1000, 200, 25, { lower: 10 });
    const [lower, target, higher] = custom.scenarios;

    expect(lower.marginPct).toBe(10);
    expect(target.marginPct).toBe(25);
    expect(higher.marginPct).toBe(35);

    // Verifies lower scenario modification does not alter target or higher calculations
    expect(target.sellingPrice).toBe(1600);
    expect(target.profit).toBe(400);
    expect(lower.sellingPrice).toBeCloseTo(1333.33, 2);
    expect(higher.sellingPrice).toBeCloseTo(1846.15, 2);
  });

  it('Scenario Audit: rejects non-finite percentages and marks only overflowing margin cards unavailable', () => {
    expect(calculatePriceScenarios(100, 0, Number.POSITIVE_INFINITY).isValid).toBe(false);
    expect(calculatePriceScenarios(100, 0, 25, { higher: Number.NaN }).isValid).toBe(false);

    const capped = calculatePriceScenarios(100, 0, 100);
    expect(capped.isValid).toBe(true);
    expect(capped.scenarios[1].marginPct).toBe(99);

    const boundary = calculatePriceScenarios(MAX_SAFE_CURRENCY * 0.02, 0, 99, { higher: 99 });
    expect(boundary.isValid).toBe(true);
    expect(boundary.scenarios[0].isValid).toBe(true);
    expect(boundary.scenarios[1].isValid).toBe(false);
    expect(boundary.scenarios[2].isValid).toBe(false);
  });

  it('Scenario Audit: lower and higher defaults stay on the correct side of the selected target', () => {
    const zeroTarget = calculatePriceScenarios(100, 0, 0);
    expect(zeroTarget.scenarios.map(scenario => scenario.marginPct)).toEqual([0, 0, 10]);

    const highTarget = calculatePriceScenarios(100, 0, 80);
    expect(highTarget.scenarios.map(scenario => scenario.marginPct)).toEqual([70, 80, 90]);

    const upperBoundary = calculatePriceScenarios(100, 0, 99);
    expect(upperBoundary.scenarios.map(scenario => scenario.marginPct)).toEqual([89, 99, 99]);
  });

  it('rejects non-finite and unsafe monetary calculations instead of displaying zero as a valid result', () => {
    expect(calculateJobPricing({
      laborCost: Number.POSITIVE_INFINITY,
      materialCost: 0,
      otherCost: 0,
      overheadMode: 'fixed',
      overheadValue: 0,
      targetMarginPct: 25,
    }).isValid).toBe(false);

    expect(calculateLaborCost({
      workersCount: 1,
      regularHoursPerWorker: 1,
      hourlyWage: Number.POSITIVE_INFINITY,
      overtimeHoursPerWorker: 0,
      overtimeMultiplier: 1.5,
      burdenPercentage: 0,
      additionalExpenses: 0,
    }).isValid).toBe(false);

    expect(analyzeProfitMargin({ totalCost: 10, sellingPrice: Number.POSITIVE_INFINITY }).isValid).toBe(false);
    expect(calculateRequiredPrice({ totalCost: Number.MAX_VALUE, targetMarginPct: 25 }).isValid).toBe(false);

    expect(calculateBreakEven({
      fixedMonthlyCosts: 0,
      variableCostPerHour: 100,
      expectedMonthlyBillableHours: 1_000_000_000_000,
    }).isValid).toBe(false);

    expect(calculateMaterialMarkup({
      quantity: Number.MAX_SAFE_INTEGER,
      unitCost: 1,
      wasteAllowancePct: 0,
      targetMarkupPct: 25,
    }).isValid).toBe(false);

    expect(calculateProjectEstimate({
      items: [{ id: 'large', category: 'materials', description: 'Large amount', quantity: 1_000_000_000, unit: 'ea', unitCost: 1_000_000_000 }],
      overheadMode: 'fixed',
      overheadValue: 0,
      targetMarginPct: 25,
    }).isValid).toBe(false);
  });
});
