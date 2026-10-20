import React, { useState } from 'react';
import { CurrencyInput } from '../ui/CurrencyInput';
import { PercentageInput } from '../ui/PercentageInput';
import { NumberInput } from '../ui/NumberInput';
import { ProfitBreakdownBar } from '../ui/ProfitBreakdownBar';
import { calculateLaborCost } from '../../lib/financial/laborCost';
import { formatCurrency } from '../../lib/financial/formatters';
import { loadSharedSettings } from '../../lib/financial/storage';
import { ClockIcon } from '../ui/Icons';

export const LaborCostCalculator: React.FC = () => {
  const [workersCount, setWorkersCount] = useState(1);
  const [regularHoursPerWorker, setRegularHoursPerWorker] = useState(10);
  const [hourlyWage, setHourlyWage] = useState(30);
  const [overtimeHoursPerWorker, setOvertimeHoursPerWorker] = useState(0);
  const [overtimeMultiplier, setOvertimeMultiplier] = useState(1.5);
  const [burdenPercentage, setBurdenPercentage] = useState(20);
  const [additionalExpenses, setAdditionalExpenses] = useState(0);

  const handleApplyDefaults = () => {
    const settings = loadSharedSettings();
    if (settings.defaultLaborRate > 0) setHourlyWage(settings.defaultLaborRate);
    if (settings.defaultBurdenPercent > 0) setBurdenPercentage(settings.defaultBurdenPercent);
  };

  const result = calculateLaborCost({
    workersCount,
    regularHoursPerWorker,
    hourlyWage,
    overtimeHoursPerWorker,
    overtimeMultiplier,
    burdenPercentage,
    additionalExpenses,
  });

  const handleReset = () => {
    setWorkersCount(1);
    setRegularHoursPerWorker(10);
    setHourlyWage(30);
    setOvertimeHoursPerWorker(0);
    setOvertimeMultiplier(1.5);
    setBurdenPercentage(20);
    setAdditionalExpenses(0);
  };

  return (
    <div className="bg-surface rounded-xl border border-border-default shadow-card p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-border-default gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-green-light flex items-center justify-center text-brand-green shrink-0">
            <ClockIcon size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary tracking-tight font-headline">
              Labor Cost &amp; Burden Calculator
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Calculate fully burdened hourly rate and project payroll expenses
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleApplyDefaults}
            className="text-xs font-semibold text-brand-green hover:text-brand-green-hover px-2.5 py-1.5 rounded border border-brand-green-border hover:bg-brand-green-light transition-colors"
            title="Apply your saved defaults from settings"
          >
            Apply Shared Settings
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-medium text-text-muted hover:text-text-primary px-2.5 py-1.5 rounded hover:bg-canvas transition-colors"
          >
            Reset Example
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Inputs */}
        <div className="lg:col-span-7 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NumberInput
              label="Number of Crew / Workers"
              hint="Headcount on this job"
              value={workersCount}
              onChange={setWorkersCount}
              min={1}
              step={1}
              id="labor-workers"
            />
            <CurrencyInput
              label="Base Hourly Wage ($/hr)"
              hint="Direct pay rate per hour"
              value={hourlyWage}
              onChange={setHourlyWage}
              id="labor-wage"
            />
            <NumberInput
              label="Regular Hours (per worker)"
              hint="Straight-time hours"
              value={regularHoursPerWorker}
              onChange={setRegularHoursPerWorker}
              min={0}
              unitLabel="hrs"
              id="labor-reg-hours"
            />
            <NumberInput
              label="Overtime Hours (per worker)"
              hint="Overtime hours"
              value={overtimeHoursPerWorker}
              onChange={setOvertimeHoursPerWorker}
              min={0}
              unitLabel="hrs"
              id="labor-ot-hours"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <NumberInput
              label="OT Multiplier"
              hint="e.g. 1.5x time-and-a-half"
              value={overtimeMultiplier}
              onChange={setOvertimeMultiplier}
              min={1}
              step={0.1}
              unitLabel="x"
              id="labor-multiplier"
            />
            <PercentageInput
              label="Employer Burden (%)"
              hint="FICA, FUTA, SUTA, workers comp"
              value={burdenPercentage}
              onChange={setBurdenPercentage}
              max={100}
              id="labor-burden"
            />
            <CurrencyInput
              label="Per-Diem / Extra ($)"
              hint="Travel, stipends, tooling"
              value={additionalExpenses}
              onChange={setAdditionalExpenses}
              id="labor-extra"
            />
          </div>

          <div className="p-3.5 rounded bg-canvas border border-border-default text-xs text-text-secondary leading-relaxed">
            <strong>Estimating Assumption:</strong> Overtime multipliers and burden percentages are user-entered estimating assumptions, not official legal or state payroll tax determinations.
          </div>
        </div>

        {/* Output Card */}
        <div className="lg:col-span-5">
          <div className="rounded-xl bg-brand-green-light/40 border border-brand-green-border/80 p-6 shadow-subtle space-y-5">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-text-secondary block">
                Total Labor Cost
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-4xl md:text-5xl font-bold font-sans tracking-tight text-brand-green tabular-nums">
                  {formatCurrency(result.totalLaborCost)}
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                For {result.totalHours} total hours worked across {result.totalWorkers} worker{result.totalWorkers === 1 ? '' : 's'}
              </p>
            </div>

            {/* Loaded Hourly Cost Highlight */}
            <div className="p-3.5 rounded-lg bg-surface border border-brand-green-border flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-text-secondary block">
                  Loaded Cost Per Hour:
                </span>
                <span className="text-xs text-text-muted">Direct wage + full employer burden</span>
              </div>
              <span className="text-2xl font-bold text-text-primary tabular-nums">
                {formatCurrency(result.loadedHourlyCost)}
                <span className="text-xs text-text-muted font-normal">/hr</span>
              </span>
            </div>

            {/* Financial Breakdown Table */}
            <div className="space-y-2 text-xs border-t border-brand-green-border/60 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Gross Regular Wages:</span>
                <span className="font-semibold text-text-primary tabular-nums">
                  {formatCurrency(result.regularWages)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Overtime Wages:</span>
                <span className="font-semibold text-text-primary tabular-nums">
                  {formatCurrency(result.overtimeWages)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Total Gross Wages:</span>
                <span className="font-bold text-text-primary tabular-nums">
                  {formatCurrency(result.grossWages)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Employer Payroll Burden ({burdenPercentage}%):</span>
                <span className="font-semibold text-brand-green tabular-nums">
                  +{formatCurrency(result.employerBurden)}
                </span>
              </div>
              {result.additionalExpenses > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Additional Labor Expenses:</span>
                  <span className="font-semibold text-text-primary tabular-nums">
                    +{formatCurrency(result.additionalExpenses)}
                  </span>
                </div>
              )}
            </div>

            {/* Breakdown Visualizer */}
            <ProfitBreakdownBar
              title="Payroll Allocation Breakdown"
              totalAmount={result.totalLaborCost}
              totalLabel="Labor Cost"
              items={result.breakdown}
              className="pt-2"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
