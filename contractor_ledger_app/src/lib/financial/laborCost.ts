import type { LaborCostInput, LaborCostResult, CurrencyBreakdownItem } from './types';
import { roundCurrency, safeDivide } from './formatters';

export function calculateLaborCost(input: LaborCostInput): LaborCostResult {
  const workers = Math.max(0, input.workersCount || 0);
  const regHoursPerWorker = Math.max(0, input.regularHoursPerWorker || 0);
  const otHoursPerWorker = Math.max(0, input.overtimeHoursPerWorker || 0);
  const hourlyWage = Math.max(0, input.hourlyWage || 0);
  const otMultiplier = Math.max(1, input.overtimeMultiplier || 1.5);
  const burdenPct = Math.max(0, input.burdenPercentage || 0);
  const additionalExpenses = Math.max(0, input.additionalExpenses || 0);

  const regularHoursTotal = roundCurrency(workers * regHoursPerWorker);
  const overtimeHoursTotal = roundCurrency(workers * otHoursPerWorker);
  const totalHours = roundCurrency(regularHoursTotal + overtimeHoursTotal);

  const regularWages = roundCurrency(regularHoursTotal * hourlyWage);
  const overtimeWages = roundCurrency(overtimeHoursTotal * hourlyWage * otMultiplier);
  const grossWages = roundCurrency(regularWages + overtimeWages);

  const employerBurden = roundCurrency(grossWages * (burdenPct / 100));
  const totalLaborCost = roundCurrency(grossWages + employerBurden + additionalExpenses);

  const loadedHourlyCost = totalHours > 0 
    ? roundCurrency(safeDivide(totalLaborCost, totalHours, 0)) 
    : 0;

  const breakdown: CurrencyBreakdownItem[] = [];
  const denominator = totalLaborCost > 0 ? totalLaborCost : 1;

  if (regularWages > 0) {
    breakdown.push({
      id: 'reg-wages',
      label: 'Regular Wages',
      amount: regularWages,
      percentageOfTotal: roundCurrency((regularWages / denominator) * 100),
      color: '#4F5B57',
    });
  }
  if (overtimeWages > 0) {
    breakdown.push({
      id: 'ot-wages',
      label: 'Overtime Wages',
      amount: overtimeWages,
      percentageOfTotal: roundCurrency((overtimeWages / denominator) * 100),
      color: '#6F7974',
    });
  }
  if (employerBurden > 0) {
    breakdown.push({
      id: 'burden',
      label: `Payroll Taxes & Burden (${burdenPct}%)`,
      amount: employerBurden,
      percentageOfTotal: roundCurrency((employerBurden / denominator) * 100),
      color: '#176B53',
    });
  }
  if (additionalExpenses > 0) {
    breakdown.push({
      id: 'expenses',
      label: 'Additional Labor Expenses',
      amount: additionalExpenses,
      percentageOfTotal: roundCurrency((additionalExpenses / denominator) * 100),
      color: '#9CA3AF',
    });
  }

  return {
    totalWorkers: workers,
    regularHoursTotal,
    overtimeHoursTotal,
    totalHours,
    regularWages,
    overtimeWages,
    grossWages,
    employerBurden,
    additionalExpenses,
    totalLaborCost,
    loadedHourlyCost,
    isValid: true,
    breakdown,
  };
}
