import React, { useState } from 'react';
import { CurrencyInput } from '../ui/CurrencyInput';
import { PercentageInput } from '../ui/PercentageInput';
import { ProfitBreakdownBar } from '../ui/ProfitBreakdownBar';
import { ScenarioComparisonCard } from '../ui/ScenarioComparisonCard';
import { calculateJobPricing } from '../../lib/financial/jobPricing';
import { formatCurrency, formatPercent } from '../../lib/financial/formatters';
import { loadSharedSettings } from '../../lib/financial/storage';
import type { OverheadMode } from '../../lib/financial/types';
import { CalculatorIcon, OpenInNewIcon } from '../ui/Icons';

interface JobPricingCalculatorProps {
  isPreview?: boolean;
  className?: string;
}

export const JobPricingCalculator: React.FC<JobPricingCalculatorProps> = ({
  isPreview = false,
  className = '',
}) => {
  const [laborCost, setLaborCost] = useState(600);
  const [materialCost, setMaterialCost] = useState(450);
  const [otherCost, setOtherCost] = useState(150);
  const [overheadMode, setOverheadMode] = useState<OverheadMode>('fixed');
  const [overheadValue, setOverheadValue] = useState(0);
  const [targetMarginPct, setTargetMarginPct] = useState(25);

  const result = calculateJobPricing({
    laborCost,
    materialCost,
    otherCost,
    overheadMode,
    overheadValue,
    targetMarginPct,
  });

  const handleApplyDefaults = () => {
    const settings = loadSharedSettings();
    setTargetMarginPct(settings.defaultTargetMarginPercent);
    setOverheadMode('percentage');
    setOverheadValue(settings.defaultOverheadPercent);
  };

  const handleReset = () => {
    setLaborCost(600);
    setMaterialCost(450);
    setOtherCost(150);
    setOverheadMode('fixed');
    setOverheadValue(0);
    setTargetMarginPct(25);
  };

  return (
    <div className={`calculator-workspace bg-surface rounded-xl border border-border-default shadow-card p-6 md:p-8 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-border-default gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-copper-light flex items-center justify-center text-brand-copper shrink-0">
            <CalculatorIcon size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary tracking-tight font-headline">
              {isPreview ? 'Job Pricing Calculator' : 'Job Pricing & Margin Engine'}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Cost-divided gross margin formula: <code className="font-semibold text-text-primary">Price = Cost ÷ (1 − Margin)</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPreview ? (
            <span className="px-2.5 py-1 rounded bg-brand-copper-light text-brand-copper font-semibold text-xs">
              Interactive Live Preview
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={handleApplyDefaults}
                className="text-xs font-semibold text-brand-copper hover:text-brand-copper-hover px-2.5 py-1.5 rounded border border-brand-copper-border hover:bg-brand-copper-light transition-colors"
                title="Apply your saved settings from the top navigation"
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
            </>
          )}
        </div>
      </div>

      {/* Main Grid: Inputs on Left, Output Card on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Inputs (Left) */}
        <div className={isPreview ? 'lg:col-span-12 space-y-4' : 'lg:col-span-7 space-y-5'}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CurrencyInput
              label="Direct Labor Cost"
              hint="Wages & burdened payroll"
              value={laborCost}
              onChange={setLaborCost}
              id="job-labor"
            />
            <CurrencyInput
              label="Material Cost"
              hint="Job supplies & deliveries"
              value={materialCost}
              onChange={setMaterialCost}
              id="job-materials"
            />
            <CurrencyInput
              label="Equipment & Other"
              hint="Permits, rentals, fuel"
              value={otherCost}
              onChange={setOtherCost}
              id="job-other"
            />
            <PercentageInput
              label="Target Profit Margin"
              hint="Gross yield on revenue"
              value={targetMarginPct}
              onChange={setTargetMarginPct}
              max={99}
              id="job-margin"
              error={!result.isValid ? result.errorMessage : undefined}
            />
          </div>

          {/* Overhead Allocation Control (Only show detailed mode picker when not in compact preview) */}
          {!isPreview ? (
            <div className="p-4 rounded-lg bg-canvas border border-border-default space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                  Overhead Allocation Method
                </span>
                <div className="flex rounded border border-border-default bg-surface p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    aria-pressed={overheadMode === 'fixed'}
                    onClick={() => setOverheadMode('fixed')}
                    className={`px-3 py-1 rounded-sm transition-colors ${
                      overheadMode === 'fixed'
                        ? 'bg-brand-copper text-white shadow-xs'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Fixed Dollar ($)
                  </button>
                  <button
                    type="button"
                    aria-pressed={overheadMode === 'percentage'}
                    onClick={() => setOverheadMode('percentage')}
                    className={`px-3 py-1 rounded-sm transition-colors ${
                      overheadMode === 'percentage'
                        ? 'bg-brand-copper text-white shadow-xs'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Direct Cost %
                  </button>
                </div>
              </div>

              {overheadMode === 'fixed' ? (
                <CurrencyInput
                  label="Fixed Overhead Amount"
                  hint="Shop rent, vehicle, insurance allocated to job"
                  value={overheadValue}
                  onChange={setOverheadValue}
                  id="job-overhead-fixed"
                />
              ) : (
                <PercentageInput
                  label="Overhead Percentage of Direct Costs"
                  hint={`Applies to direct costs of ${formatCurrency(result.directCost)}`}
                  value={overheadValue}
                  onChange={setOverheadValue}
                  max={200}
                  id="job-overhead-pct"
                />
              )}
            </div>
          ) : null}
        </div>

        {/* Live Calculation Output Card (Right) */}
        <div className={isPreview ? 'lg:col-span-12' : 'lg:col-span-5'}>
          <div className="result-panel p-6 space-y-5">
            {!result.isValid && (
              <p role="alert" className="rounded border border-error-border bg-error-bg/20 p-3 text-sm font-medium text-error-text">
                Price unavailable: {result.errorMessage}
              </p>
            )}
            {result.isValid && <>
            {/* Direct Cost vs Margin Header */}
            <div className="flex items-center justify-between pb-3 border-b border-brand-copper-border/60 text-xs">
              <div>
                <span className="text-text-secondary block">Total Job Cost:</span>
                <span className="font-bold text-text-primary text-base tabular-nums">
                  {formatCurrency(result.totalCost)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-text-secondary block">Target Margin:</span>
                <span className="font-bold text-white text-base tabular-nums">
                  {formatPercent(result.targetMarginPct)}
                </span>
              </div>
            </div>

            {/* Hero Numerical Value */}
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-text-secondary block">
                Recommended Selling Price
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span aria-live="polite" aria-atomic="true" className="text-[36px] sm:text-[42px] md:text-[50px] leading-tight font-bold font-sans tracking-tight text-white tabular-nums">
                  {formatCurrency(result.sellingPrice)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-brand-copper-border/40 text-xs">
                <span className="text-text-secondary">Estimated Gross Profit:</span>
                <span className="font-bold text-profit-inverse tabular-nums">
                  {formatCurrency(result.profit)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1 text-xs">
                <span className="text-text-secondary">Markup on Total Cost:</span>
                <span className="font-semibold text-text-secondary tabular-nums">
                  {formatPercent(result.markupEquivalentPct)}
                </span>
              </div>
            </div>

            {/* Meter Breakdown Bar */}
            <ProfitBreakdownBar
              totalAmount={result.sellingPrice}
              items={result.breakdown}
              className="pt-2"
            />

            {/* Preview link out */}
            {isPreview && (
              <div className="pt-3 border-t border-brand-copper-border/60 flex items-center justify-between text-xs">
                <span className="text-text-secondary">
                  Includes overhead &amp; custom bidding scenarios
                </span>
                <a
                  href="/calculators/job-pricing/"
                  className="font-semibold text-brand-copper hover:text-brand-copper-hover flex items-center gap-1 transition-colors"
                >
                  <span>Open Full Workspace</span>
                  <OpenInNewIcon size={14} />
                </a>
              </div>
            )}
            </>}
          </div>
        </div>
      </div>

      {/* Side-by-Side Scenario Comparison (Available in full page mode) */}
      {!isPreview && result.isValid && (
        <div className="mt-8 pt-8 border-t border-border-default">
          <ScenarioComparisonCard
            directCost={result.directCost}
            overhead={result.allocatedOverhead}
            targetMarginPct={result.targetMarginPct}
          />
        </div>
      )}
    </div>
  );
};
