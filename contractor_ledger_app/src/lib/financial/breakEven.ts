import type { BreakEvenInput, BreakEvenResult } from './types';
import { MAX_SAFE_CURRENCY, roundCurrency, safeDivide } from './formatters';

export function calculateBreakEven(input: BreakEvenInput): BreakEvenResult {
  if (
    !Number.isFinite(input.fixedMonthlyCosts) || Math.abs(input.fixedMonthlyCosts) > MAX_SAFE_CURRENCY ||
    !Number.isFinite(input.variableCostPerHour) || Math.abs(input.variableCostPerHour) > MAX_SAFE_CURRENCY ||
    !Number.isFinite(input.expectedMonthlyBillableHours) || Math.abs(input.expectedMonthlyBillableHours) > Number.MAX_SAFE_INTEGER
  ) {
    return {
      fixedMonthlyCosts: 0,
      variableCostPerHour: 0,
      expectedMonthlyBillableHours: 0,
      fixedOverheadPerHour: 0,
      breakEvenHourlyRate: 0,
      monthlyRevenueRequired: 0,
      variableCostContribution: 0,
      isValid: false,
      errorMessage: 'One or more values exceed the safe calculation range.',
    };
  }

  const fixedMonthlyCosts = roundCurrency(Math.max(0, input.fixedMonthlyCosts || 0));
  const variableCostPerHour = roundCurrency(Math.max(0, input.variableCostPerHour || 0));
  const expectedMonthlyBillableHours = Math.max(0, input.expectedMonthlyBillableHours || 0);

  if (expectedMonthlyBillableHours <= 0) {
    return {
      fixedMonthlyCosts,
      variableCostPerHour,
      expectedMonthlyBillableHours: 0,
      fixedOverheadPerHour: 0,
      breakEvenHourlyRate: 0,
      monthlyRevenueRequired: fixedMonthlyCosts,
      variableCostContribution: 0,
      isValid: false,
      errorMessage: 'Expected monthly billable hours must be greater than zero to calculate an hourly rate.',
    };
  }

  const rawFixedOverheadPerHour = safeDivide(fixedMonthlyCosts, expectedMonthlyBillableHours, 0);
  const rawBreakEvenHourlyRate = rawFixedOverheadPerHour + variableCostPerHour;
  const rawVariableCostContribution = variableCostPerHour * expectedMonthlyBillableHours;
  const rawMonthlyRevenueRequired = fixedMonthlyCosts + rawVariableCostContribution;
  if (
    !Number.isFinite(rawFixedOverheadPerHour) || rawFixedOverheadPerHour > MAX_SAFE_CURRENCY ||
    !Number.isFinite(rawBreakEvenHourlyRate) || rawBreakEvenHourlyRate > MAX_SAFE_CURRENCY ||
    !Number.isFinite(rawVariableCostContribution) || rawVariableCostContribution > MAX_SAFE_CURRENCY ||
    !Number.isFinite(rawMonthlyRevenueRequired) || rawMonthlyRevenueRequired > MAX_SAFE_CURRENCY
  ) {
    return {
      fixedMonthlyCosts,
      variableCostPerHour,
      expectedMonthlyBillableHours,
      fixedOverheadPerHour: 0,
      breakEvenHourlyRate: 0,
      monthlyRevenueRequired: 0,
      variableCostContribution: 0,
      isValid: false,
      errorMessage: 'Calculated break-even amounts exceed the safe currency range.',
    };
  }

  const fixedOverheadPerHour = roundCurrency(rawFixedOverheadPerHour);
  const breakEvenHourlyRate = roundCurrency(rawBreakEvenHourlyRate);
  const variableCostContribution = roundCurrency(rawVariableCostContribution);
  const monthlyRevenueRequired = roundCurrency(rawMonthlyRevenueRequired);

  return {
    fixedMonthlyCosts,
    variableCostPerHour,
    expectedMonthlyBillableHours,
    fixedOverheadPerHour,
    breakEvenHourlyRate,
    monthlyRevenueRequired,
    variableCostContribution,
    isValid: true,
  };
}
