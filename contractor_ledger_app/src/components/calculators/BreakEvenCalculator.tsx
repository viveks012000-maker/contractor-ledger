import React, { useState } from 'react';
import { CurrencyInput } from '../ui/CurrencyInput';
import { NumberInput } from '../ui/NumberInput';
import { calculateBreakEven } from '../../lib/financial/breakEven';
import { formatCurrency } from '../../lib/financial/formatters';
import { ScaleIcon } from '../ui/Icons';

export const BreakEvenCalculator: React.FC = () => {
  const [fixedMonthlyCosts, setFixedMonthlyCosts] = useState(5000);
  const [variableCostPerHour, setVariableCostPerHour] = useState(20);
  const [expectedMonthlyBillableHours, setExpectedMonthlyBillableHours] = useState(100);

  const result = calculateBreakEven({
    fixedMonthlyCosts,
    variableCostPerHour,
    expectedMonthlyBillableHours,
  });

  const handleReset = () => {
    setFixedMonthlyCosts(5000);
    setVariableCostPerHour(20);
    setExpectedMonthlyBillableHours(100);
  };

  return (
    <div className="bg-surface rounded-xl border border-border-default shadow-card p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-border-default gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-green-light flex items-center justify-center text-brand-green shrink-0">
            <ScaleIcon size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary tracking-tight font-headline">
              Monthly Break-Even Rate Calculator
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Determine the minimum billable rate to cover overhead and variable project costs
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="text-xs font-medium text-text-muted hover:text-text-primary px-2.5 py-1.5 rounded hover:bg-canvas transition-colors self-start sm:self-auto"
        >
          Reset Example
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Inputs */}
        <div className="lg:col-span-7 space-y-5">
          <div className="space-y-4">
            <CurrencyInput
              label="Fixed Monthly Operating Costs ($/mo)"
              hint="Shop rent, vehicle leases, insurance, software, admin salaries"
              value={fixedMonthlyCosts}
              onChange={setFixedMonthlyCosts}
              id="break-even-fixed"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NumberInput
                label="Monthly Billable Hours"
                hint="Actual billable hours performed"
                value={expectedMonthlyBillableHours}
                onChange={setExpectedMonthlyBillableHours}
                min={1}
                step={1}
                unitLabel="hrs/mo"
                id="break-even-hours"
                error={!result.isValid ? result.errorMessage : undefined}
              />
              <CurrencyInput
                label="Variable Cost per Billable Hour ($/hr)"
                hint="Job consumables, fuel, tools, direct wear"
                value={variableCostPerHour}
                onChange={setVariableCostPerHour}
                id="break-even-var"
              />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-canvas border border-border-default text-xs text-text-secondary leading-relaxed space-y-2">
            <span className="font-bold text-text-primary text-sm font-headline block">
              Monthly Accounting Standard
            </span>
            <p>
              Your break-even rate is the baseline price where revenue equals total expenses (zero profit, zero loss). Any billable rate below this figure produces an operational deficit.
            </p>
            <p className="text-text-muted">
              Formula: <code className="font-semibold text-text-primary">Break-Even Rate = (Monthly Fixed Costs ÷ Billable Hours) + Variable Cost/Hr</code>
            </p>
          </div>
        </div>

        {/* Results Card */}
        <div className="lg:col-span-5">
          <div className="rounded-xl bg-brand-green-light/40 border border-brand-green-border/80 p-6 shadow-subtle space-y-5">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-text-secondary block">
                Minimum Break-Even Rate
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-4xl md:text-5xl font-bold font-sans tracking-tight text-brand-green tabular-nums">
                  {formatCurrency(result.breakEvenHourlyRate)}
                  <span className="text-sm font-normal text-text-secondary">/hr</span>
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Minimum hourly charge to cover all monthly overhead &amp; variable costs
              </p>
            </div>

            {/* Total Monthly Revenue Required */}
            <div className="p-4 rounded-lg bg-surface border border-brand-green-border">
              <span className="text-xs text-text-secondary font-medium block">
                Monthly Revenue Required to Break Even:
              </span>
              <span className="text-3xl font-bold text-text-primary tabular-nums block mt-1">
                {formatCurrency(result.monthlyRevenueRequired)}
                <span className="text-xs text-text-muted font-normal"> / month</span>
              </span>
              <span className="text-xs text-text-muted block mt-1">
                Based on {expectedMonthlyBillableHours} billable hours per month
              </span>
            </div>

            {/* Breakdown Rate Details */}
            <div className="space-y-2 text-xs border-t border-brand-green-border/60 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Fixed Overhead Recovery:</span>
                <span className="font-semibold text-text-primary tabular-nums">
                  {formatCurrency(result.fixedOverheadPerHour)} / hr
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Variable Operating Cost:</span>
                <span className="font-semibold text-text-primary tabular-nums">
                  +{formatCurrency(result.variableCostPerHour)} / hr
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border-default font-semibold text-text-primary">
                <span>Total Break-Even Hourly Cost:</span>
                <span className="text-brand-green tabular-nums">
                  {formatCurrency(result.breakEvenHourlyRate)} / hr
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
