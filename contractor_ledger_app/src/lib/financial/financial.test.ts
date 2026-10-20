import { describe, it, expect } from 'vitest';
import { roundCurrency, roundPrecision, safeDivide, parseSafeNumber, formatCurrency, formatPercent } from './formatters';
import { calculateJobPricing } from './jobPricing';
import { calculateLaborCost } from './laborCost';
import { analyzeProfitMargin, calculateRequiredPrice } from './profitMargin';
import { calculateBreakEven } from './breakEven';
import { calculateMaterialMarkup } from './materialMarkup';
import { calculateProjectEstimate } from './projectEstimate';
import { calculatePriceScenarios } from './scenarios';
import { DEFAULT_SHARED_SETTINGS } from './storage';

describe('Financial Formatters & Precision Utilities', () => {
  it('rounds currency accurately to 2 decimal places avoiding IEEE floating point errors', () => {
    expect(roundCurrency(0.1 + 0.2)).toBe(0.3);
    expect(roundCurrency(1234.567)).toBe(1234.57);
    expect(roundCurrency(1234.561)).toBe(1234.56);
    expect(roundCurrency(-1.005)).toBe(-1.01);
    expect(roundCurrency(-1.004)).toBe(-1);
    expect(roundCurrency(NaN)).toBe(0);
    expect(roundCurrency(Infinity)).toBe(0);
    expect(roundCurrency(Number.MAX_VALUE)).toBe(0);
    expect(formatCurrency(Infinity)).toBe('—');
    expect(formatCurrency(Number.MAX_VALUE)).toBe('—');
  });

  it('rounds precision accurately to arbitrary decimal places', () => {
    expect(roundPrecision(1.23456, 3)).toBe(1.235);
    expect(roundPrecision(1.23456, 4)).toBe(1.2346);
    expect(roundPrecision(NaN, 2)).toBe(0);
  });

  it('safely divides without throwing or returning NaN or Infinity', () => {
    expect(safeDivide(100, 2)).toBe(50);
    expect(safeDivide(100, 0)).toBe(0);
    expect(safeDivide(0, 0)).toBe(0);
    expect(safeDivide(NaN, 10)).toBe(0);
  });

  it('safely parses number strings with currency symbols and commas', () => {
    expect(parseSafeNumber('$1,250.50')).toBe(1250.5);
    expect(parseSafeNumber('25%')).toBe(25);
    expect(parseSafeNumber('')).toBe(0);
    expect(parseSafeNumber('invalid')).toBe(0);
    expect(parseSafeNumber(450)).toBe(450);
  });

  it('formats standard USD strings properly', () => {
    expect(formatCurrency(1600)).toBe('$1,600.00');
    expect(formatCurrency(0)).toBe('$0.00');
    expect(formatCurrency(-50.25)).toBe('-$50.25');
    expect(formatCurrency(NaN)).toBe('—');
  });

  it('formats percentages clearly', () => {
    expect(formatPercent(25)).toBe('25.0%');
    expect(formatPercent(33.3333, 1)).toBe('33.3%');
    expect(formatPercent(NaN)).toBe('0.0%');
  });
});

describe('Calculator 1: Job Pricing Calculator', () => {
  it('computes prompt test case: Labor $600, Materials $450, Other $150, Overhead $0, Margin 25%', () => {
    const result = calculateJobPricing({
      laborCost: 600,
      materialCost: 450,
      otherCost: 150,
      overheadMode: 'fixed',
      overheadValue: 0,
      targetMarginPct: 25,
    });

    expect(result.isValid).toBe(true);
    expect(result.directCost).toBe(1200);
    expect(result.allocatedOverhead).toBe(0);
    expect(result.totalCost).toBe(1200);
    expect(result.sellingPrice).toBe(1600);
    expect(result.profit).toBe(400);
    expect(result.actualMarginPct).toBe(25);
    expect(result.markupEquivalentPct).toBeCloseTo(33.33, 1);
  });

  it('correctly applies percentage overhead', () => {
    const result = calculateJobPricing({
      laborCost: 1000,
      materialCost: 500,
      otherCost: 0,
      overheadMode: 'percentage',
      overheadValue: 10, // 10% of $1,500 = $150
      targetMarginPct: 20,
    });

    expect(result.directCost).toBe(1500);
    expect(result.allocatedOverhead).toBe(150);
    expect(result.totalCost).toBe(1650);
    // Selling price = 1650 / 0.8 = 2062.50
    expect(result.sellingPrice).toBe(2062.5);
    expect(result.profit).toBe(412.5);
    expect(result.actualMarginPct).toBe(20);
  });

  it('rejects invalid margins of 100% or greater', () => {
    const result = calculateJobPricing({
      laborCost: 500,
      materialCost: 500,
      otherCost: 0,
      overheadMode: 'fixed',
      overheadValue: 0,
      targetMarginPct: 100,
    });

    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBeDefined();
    expect(result.sellingPrice).toBe(0);
  });

  it('handles zero costs without producing NaN or Infinity', () => {
    const result = calculateJobPricing({
      laborCost: 0,
      materialCost: 0,
      otherCost: 0,
      overheadMode: 'fixed',
      overheadValue: 0,
      targetMarginPct: 25,
    });

    expect(result.isValid).toBe(true);
    expect(result.totalCost).toBe(0);
    expect(result.sellingPrice).toBe(0);
    expect(result.profit).toBe(0);
  });
});

describe('Calculator 2: Labor Cost Calculator', () => {
  it('computes prompt test case: 1 worker, 10 reg hrs, $30 wage, 0 OT, 20% burden -> $360', () => {
    const result = calculateLaborCost({
      workersCount: 1,
      regularHoursPerWorker: 10,
      hourlyWage: 30,
      overtimeHoursPerWorker: 0,
      overtimeMultiplier: 1.5,
      burdenPercentage: 20,
      additionalExpenses: 0,
    });

    expect(result.isValid).toBe(true);
    expect(result.regularHoursTotal).toBe(10);
    expect(result.regularWages).toBe(300);
    expect(result.overtimeWages).toBe(0);
    expect(result.grossWages).toBe(300);
    expect(result.employerBurden).toBe(60);
    expect(result.totalLaborCost).toBe(360);
    expect(result.loadedHourlyCost).toBe(36);
  });

  it('computes overtime wages with multiplier', () => {
    const result = calculateLaborCost({
      workersCount: 2,
      regularHoursPerWorker: 40,
      hourlyWage: 25,
      overtimeHoursPerWorker: 10,
      overtimeMultiplier: 1.5,
      burdenPercentage: 25,
      additionalExpenses: 100,
    });

    // 2 * 40 * 25 = $2,000 regular
    expect(result.regularWages).toBe(2000);
    // 2 * 10 * 25 * 1.5 = $750 OT
    expect(result.overtimeWages).toBe(750);
    expect(result.grossWages).toBe(2750);
    // Burden = 2750 * 0.25 = 687.50
    expect(result.employerBurden).toBe(687.5);
    // Total = 2750 + 687.50 + 100 = 3537.50
    expect(result.totalLaborCost).toBe(3537.5);
    // Total hours = 2 * (40 + 10) = 100 hrs -> loaded rate = $35.38/hr
    expect(result.loadedHourlyCost).toBe(35.38);
  });

  it('handles zero hours gracefully without division by zero', () => {
    const result = calculateLaborCost({
      workersCount: 0,
      regularHoursPerWorker: 0,
      hourlyWage: 30,
      overtimeHoursPerWorker: 0,
      overtimeMultiplier: 1.5,
      burdenPercentage: 20,
      additionalExpenses: 0,
    });

    expect(result.totalLaborCost).toBe(0);
    expect(result.loadedHourlyCost).toBe(0);
    expect(Number.isFinite(result.loadedHourlyCost)).toBe(true);
  });
});

describe('Calculator 3: Profit Margin Calculator', () => {
  it('Mode A: Cost $100, selling price $125 -> Profit $25, Markup 25%, Margin 20%', () => {
    const result = analyzeProfitMargin({
      totalCost: 100,
      sellingPrice: 125,
    });

    expect(result.isValid).toBe(true);
    expect(result.profit).toBe(25);
    expect(result.markupPct).toBe(25);
    expect(result.marginPct).toBe(20);
    expect(result.isLoss).toBe(false);
  });

  it('Mode A: accurately handles loss-making scenarios', () => {
    const result = analyzeProfitMargin({
      totalCost: 100,
      sellingPrice: 80,
    });

    expect(result.profit).toBe(-20);
    expect(result.isLoss).toBe(true);
    expect(result.marginPct).toBe(-25); // -20 / 80 = -25%
    expect(result.markupPct).toBe(-20); // -20 / 100 = -20%
  });

  it('Mode B: Cost $1,200, target margin 25% -> Required price $1,600', () => {
    const result = calculateRequiredPrice({
      totalCost: 1200,
      targetMarginPct: 25,
    });

    expect(result.isValid).toBe(true);
    expect(result.sellingPrice).toBe(1600);
    expect(result.profit).toBe(400);
    expect(result.markupPct).toBeCloseTo(33.33, 1);
  });

  it('calculates every $1,000 margin-to-markup reference row to the cent', () => {
    const expectedRows = [
      { targetMarginPct: 10, markupPct: 11.11, sellingPrice: 1111.11, profit: 111.11 },
      { targetMarginPct: 15, markupPct: 17.65, sellingPrice: 1176.47, profit: 176.47 },
      { targetMarginPct: 20, markupPct: 25, sellingPrice: 1250, profit: 250 },
      { targetMarginPct: 25, markupPct: 33.33, sellingPrice: 1333.33, profit: 333.33 },
      { targetMarginPct: 30, markupPct: 42.86, sellingPrice: 1428.57, profit: 428.57 },
      { targetMarginPct: 40, markupPct: 66.67, sellingPrice: 1666.67, profit: 666.67 },
    ];

    const actualRows = expectedRows.map(({ targetMarginPct }) => {
      const result = calculateRequiredPrice({ totalCost: 1000, targetMarginPct });
      expect(result.isValid).toBe(true);
      return {
        targetMarginPct: result.targetMarginPct,
        markupPct: result.markupPct,
        sellingPrice: result.sellingPrice,
        profit: result.profit,
      };
    });

    expect(actualRows).toEqual(expectedRows);
  });

  it('never treats margin and markup as interchangeable', () => {
    const result = analyzeProfitMargin({
      totalCost: 1000,
      sellingPrice: 1500,
    });

    // Profit = 500
    // Margin = 500 / 1500 = 33.33%
    // Markup = 500 / 1000 = 50%
    expect(result.marginPct).toBeCloseTo(33.33, 1);
    expect(result.markupPct).toBe(50);
    expect(result.marginPct).not.toBe(result.markupPct);
  });
});

describe('Calculator 4: Break-Even Calculator', () => {
  it('computes prompt test case: Fixed $5,000, 100 billable hrs, $20/hr variable -> $70/hr rate, $7,000 revenue', () => {
    const result = calculateBreakEven({
      fixedMonthlyCosts: 5000,
      expectedMonthlyBillableHours: 100,
      variableCostPerHour: 20,
    });

    expect(result.isValid).toBe(true);
    expect(result.fixedOverheadPerHour).toBe(50);
    expect(result.breakEvenHourlyRate).toBe(70);
    expect(result.monthlyRevenueRequired).toBe(7000);
  });

  it('requires positive billable hours and rejects zero billable hours', () => {
    const result = calculateBreakEven({
      fixedMonthlyCosts: 5000,
      expectedMonthlyBillableHours: 0,
      variableCostPerHour: 20,
    });

    expect(result.isValid).toBe(false);
    expect(result.breakEvenHourlyRate).toBe(0);
    expect(result.errorMessage).toBeDefined();
  });
});

describe('Calculator 5: Material Markup Calculator', () => {
  it('computes prompt test case: Qty 1, Unit Cost $100, Waste 0%, Markup 25% -> Price $125, Margin 20%', () => {
    const result = calculateMaterialMarkup({
      quantity: 1,
      unitCost: 100,
      wasteAllowancePct: 0,
      targetMarkupPct: 25,
    });

    expect(result.isValid).toBe(true);
    expect(result.adjustedMaterialCost).toBe(100);
    expect(result.markupAmount).toBe(25);
    expect(result.sellingPrice).toBe(125);
    expect(result.profit).toBe(25);
    expect(result.profitMarginPct).toBe(20);
  });

  it('accurately includes waste allowance and handles fractional units', () => {
    const result = calculateMaterialMarkup({
      quantity: 10.5,
      unitCost: 20,
      wasteAllowancePct: 10, // 10.5 * 1.1 = 11.55 units
      targetMarkupPct: 30,
    });

    expect(result.effectiveQuantity).toBe(11.55);
    expect(result.adjustedMaterialCost).toBe(231); // 11.55 * 20
    expect(result.markupAmount).toBe(69.3); // 231 * 0.30
    expect(result.sellingPrice).toBe(300.3);
    expect(result.profit).toBe(69.3);
  });
});

describe('Calculator 6: Project Estimate Calculator', () => {
  it('computes prompt test case: Labor $3080, Mat $2111, Sub $1650, Equip $0, OH 12%, Margin 22%', () => {
    const result = calculateProjectEstimate({
      items: [
        { id: '1', category: 'labor', description: 'Framing crew', quantity: 44, unit: 'hrs', unitCost: 70 }, // 3080
        { id: '2', category: 'materials', description: 'Lumber package', quantity: 1, unit: 'lump', unitCost: 2111 }, // 2111
        { id: '3', category: 'subcontractors', description: 'Electrical rough-in', quantity: 1, unit: 'lump', unitCost: 1650 }, // 1650
      ],
      overheadMode: 'percentage',
      overheadValue: 12,
      targetMarginPct: 22,
    });

    expect(result.isValid).toBe(true);
    expect(result.directCosts).toBe(6841);
    expect(result.allocatedOverhead).toBe(820.92);
    expect(result.totalCost).toBe(7661.92);
    expect(result.sellingPrice).toBe(9822.97);
    expect(result.profit).toBe(2161.05);
  });

  it('handles item additions, subtractions, and zero categories without error', () => {
    const result = calculateProjectEstimate({
      items: [],
      overheadMode: 'fixed',
      overheadValue: 500,
      targetMarginPct: 20,
    });

    expect(result.directCosts).toBe(0);
    expect(result.allocatedOverhead).toBe(500);
    expect(result.totalCost).toBe(500);
    expect(result.sellingPrice).toBe(625); // 500 / 0.8
    expect(result.profit).toBe(125);
  });
});

describe('Shared Capabilities: Price Scenario Comparison', () => {
  it('verifies standard shared settings schema and defaults', () => {
    expect(DEFAULT_SHARED_SETTINGS.version).toBe(1);
    expect(DEFAULT_SHARED_SETTINGS.defaultLaborRate).toBe(65);
    expect(DEFAULT_SHARED_SETTINGS.defaultBurdenPercent).toBe(22);
    expect(DEFAULT_SHARED_SETTINGS.defaultOverheadPercent).toBe(15);
    expect(DEFAULT_SHARED_SETTINGS.defaultTargetMarginPercent).toBe(25);
  });

  it('generates three independent scenarios with valid mathematical results', () => {
    const result = calculatePriceScenarios(1000, 200, 25);

    expect(result.totalCost).toBe(1200);
    expect(result.scenarios.length).toBe(3);

    const [lower, target, higher] = result.scenarios;
    expect(lower.marginPct).toBe(15);
    expect(target.marginPct).toBe(25);
    expect(higher.marginPct).toBe(35);

    expect(target.sellingPrice).toBe(1600);
    expect(target.profit).toBe(400);

    // Each scenario has its own distinct price and profit
    expect(lower.sellingPrice).toBeLessThan(target.sellingPrice);
    expect(higher.sellingPrice).toBeGreaterThan(target.sellingPrice);
  });
});
