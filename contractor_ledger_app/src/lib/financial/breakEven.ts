import type { BreakEvenInput, BreakEvenResult } from './types';
import { roundCurrency, safeDivide } from './formatters';

export function calculateBreakEven(input: BreakEvenInput): BreakEvenResult {
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

  const fixedOverheadPerHour = roundCurrency(safeDivide(fixedMonthlyCosts, expectedMonthlyBillableHours, 0));
  const breakEvenHourlyRate = roundCurrency(fixedOverheadPerHour + variableCostPerHour);
  const variableCostContribution = roundCurrency(variableCostPerHour * expectedMonthlyBillableHours);
  const monthlyRevenueRequired = roundCurrency(fixedMonthlyCosts + variableCostContribution);

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
