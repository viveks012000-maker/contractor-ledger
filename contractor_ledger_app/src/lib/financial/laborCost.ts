import type { LaborCostInput, LaborCostResult, CurrencyBreakdownItem } from './types';
import { MAX_SAFE_CURRENCY, roundCurrency, safeDivide } from './formatters';

function invalidLaborCostResult(errorMessage: string): LaborCostResult {
  return {
    totalWorkers: 0,
    regularHoursTotal: 0,
    overtimeHoursTotal: 0,
    totalHours: 0,
    regularWages: 0,
    overtimeWages: 0,
    grossWages: 0,
    employerBurden: 0,
    additionalExpenses: 0,
    totalLaborCost: 0,
    loadedHourlyCost: 0,
    isValid: false,
    errorMessage,
    breakdown: [],
  };
}

export function calculateLaborCost(input: LaborCostInput): LaborCostResult {
  const countAndRateInputs = [
    input.workersCount,
    input.regularHoursPerWorker,
    input.overtimeHoursPerWorker,
    input.overtimeMultiplier,
  ];
  const currencyAndPercentInputs = [input.hourlyWage, input.burdenPercentage, input.additionalExpenses];
  if (
    countAndRateInputs.some(value => !Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) ||
    currencyAndPercentInputs.some(value => !Number.isFinite(value) || Math.abs(value) > MAX_SAFE_CURRENCY)
  ) {
    return invalidLaborCostResult('One or more values exceed the safe calculation range. Enter a smaller amount.');
  }

  const workers = Math.max(0, input.workersCount || 0);
  const regHoursPerWorker = Math.max(0, input.regularHoursPerWorker || 0);
  const otHoursPerWorker = Math.max(0, input.overtimeHoursPerWorker || 0);
  const hourlyWage = Math.max(0, input.hourlyWage || 0);
  const otMultiplier = Math.max(1, input.overtimeMultiplier || 1.5);
  const burdenPct = Math.max(0, input.burdenPercentage || 0);
  const additionalExpenses = roundCurrency(Math.max(0, input.additionalExpenses || 0));

  const rawRegularHoursTotal = workers * regHoursPerWorker;
  const rawOvertimeHoursTotal = workers * otHoursPerWorker;
  if (
    !Number.isFinite(rawRegularHoursTotal) || Math.abs(rawRegularHoursTotal) > Number.MAX_SAFE_INTEGER ||
    !Number.isFinite(rawOvertimeHoursTotal) || Math.abs(rawOvertimeHoursTotal) > Number.MAX_SAFE_INTEGER
  ) {
    return invalidLaborCostResult('Total labor hours exceed the safe calculation range.');
  }
  const regularHoursTotal = roundCurrency(rawRegularHoursTotal);
  const overtimeHoursTotal = roundCurrency(rawOvertimeHoursTotal);
  const rawTotalHours = regularHoursTotal + overtimeHoursTotal;
  if (!Number.isFinite(rawTotalHours) || rawTotalHours > Number.MAX_SAFE_INTEGER) {
    return invalidLaborCostResult('Total labor hours exceed the safe calculation range.');
  }
  const totalHours = roundCurrency(rawTotalHours);

  const rawRegularWages = regularHoursTotal * hourlyWage;
  const rawOvertimeWages = overtimeHoursTotal * hourlyWage * otMultiplier;
  if (
    !Number.isFinite(rawRegularWages) || rawRegularWages > MAX_SAFE_CURRENCY ||
    !Number.isFinite(rawOvertimeWages) || rawOvertimeWages > MAX_SAFE_CURRENCY
  ) {
    return invalidLaborCostResult('Calculated wages exceed the safe currency range.');
  }
  const regularWages = roundCurrency(rawRegularWages);
  const overtimeWages = roundCurrency(rawOvertimeWages);
  const rawGrossWages = regularWages + overtimeWages;
  if (!Number.isFinite(rawGrossWages) || rawGrossWages > MAX_SAFE_CURRENCY) {
    return invalidLaborCostResult('Gross wages exceed the safe currency range.');
  }
  const grossWages = roundCurrency(rawGrossWages);

  const rawEmployerBurden = grossWages * (burdenPct / 100);
  if (!Number.isFinite(rawEmployerBurden) || rawEmployerBurden > MAX_SAFE_CURRENCY) {
    return invalidLaborCostResult('Employer burden exceeds the safe currency range.');
  }
  const employerBurden = roundCurrency(rawEmployerBurden);
  const rawTotalLaborCost = grossWages + employerBurden + additionalExpenses;
  if (!Number.isFinite(rawTotalLaborCost) || rawTotalLaborCost > MAX_SAFE_CURRENCY) {
    return invalidLaborCostResult('Total labor cost exceeds the safe currency range.');
  }
  const totalLaborCost = roundCurrency(rawTotalLaborCost);

  const rawLoadedHourlyCost = totalHours > 0 ? safeDivide(totalLaborCost, totalHours, 0) : 0;
  if (!Number.isFinite(rawLoadedHourlyCost) || rawLoadedHourlyCost > MAX_SAFE_CURRENCY) {
    return invalidLaborCostResult('Loaded hourly cost exceeds the safe currency range.');
  }
  const loadedHourlyCost = roundCurrency(rawLoadedHourlyCost);

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
