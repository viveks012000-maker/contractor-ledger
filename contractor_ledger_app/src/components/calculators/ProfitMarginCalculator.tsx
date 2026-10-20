import React, { useState } from 'react';
import { CurrencyInput } from '../ui/CurrencyInput';
import { PercentageInput } from '../ui/PercentageInput';
import { analyzeProfitMargin, calculateRequiredPrice } from '../../lib/financial/profitMargin';
import { formatCurrency, formatPercent } from '../../lib/financial/formatters';
import { PercentIcon } from '../ui/Icons';

type Mode = 'analyze' | 'required';

export const ProfitMarginCalculator: React.FC = () => {
  const [activeMode, setActiveMode] = useState<Mode>('analyze');

  // Mode A Inputs
  const [costA, setCostA] = useState(100);
  const [priceA, setPriceA] = useState(125);

  // Mode B Inputs
  const [costB, setCostB] = useState(1200);
  const [marginB, setMarginB] = useState(25);

  const resultA = analyzeProfitMargin({ totalCost: costA, sellingPrice: priceA });
  const resultB = calculateRequiredPrice({ totalCost: costB, targetMarginPct: marginB });

  return (
    <div className="bg-surface rounded-xl border border-border-default shadow-card p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-border-default gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-green-light flex items-center justify-center text-brand-green shrink-0">
            <PercentIcon size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary tracking-tight font-headline">
              Profit Margin vs. Markup Calculator
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Distinguish margin (percentage of revenue) from markup (percentage on cost)
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex rounded-lg border border-border-default bg-canvas p-1 text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            aria-pressed={activeMode === 'analyze'}
            onClick={() => setActiveMode('analyze')}
            className={`px-3 py-1.5 rounded transition-all ${
              activeMode === 'analyze'
                ? 'bg-surface text-brand-green shadow-xs border border-border-default'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Mode A: Analyze Existing Price
          </button>
          <button
            type="button"
            aria-pressed={activeMode === 'required'}
            onClick={() => setActiveMode('required')}
            className={`px-3 py-1.5 rounded transition-all ${
              activeMode === 'required'
                ? 'bg-surface text-brand-green shadow-xs border border-border-default'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Mode B: Calculate Required Price
          </button>
        </div>
      </div>

      {activeMode === 'analyze' ? (
        /* MODE A: ANALYZE PRICE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-5">
            <div className="p-4 rounded-lg bg-canvas border border-border-default">
              <span className="text-xs font-bold uppercase tracking-wider text-text-primary block mb-3">
                Mode A: Enter Known Project Values
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CurrencyInput
                  label="Total Project Cost ($)"
                  hint="All direct & overhead expenses"
                  value={costA}
                  onChange={setCostA}
                  id="mode-a-cost"
                />
                <CurrencyInput
                  label="Selling Price Billed ($)"
                  hint="Final price charged to client"
                  value={priceA}
                  onChange={setPriceA}
                  id="mode-a-price"
                />
              </div>
            </div>

            <div className="space-y-3 text-xs text-text-secondary leading-relaxed bg-surface rounded-lg border border-border-default p-4">
              <h3 className="font-bold text-text-primary text-sm font-headline">
                The Margin vs. Markup Mathematical Law
              </h3>
              <p>
                <strong>Gross Profit Margin:</strong> The percentage of the <em>selling price</em> that is profit:{' '}
                <code className="text-text-primary font-semibold">Profit ÷ Selling Price</code>.
              </p>
              <p>
                <strong>Cost Markup:</strong> The percentage added to the <em>job cost</em>:{' '}
                <code className="text-text-primary font-semibold">Profit ÷ Total Cost</code>.
              </p>
              <p className="text-text-muted">
                * A 25% markup on a $100 job yields a 20% profit margin on a $125 selling price. They are never interchangeable.
              </p>
            </div>
          </div>

          {/* Mode A Results */}
          <div className="lg:col-span-5">
            <div
              className={`rounded-xl border p-6 shadow-subtle space-y-5 ${
                resultA.isLoss
                  ? 'bg-error-bg/20 border-error-border'
                  : 'bg-brand-green-light/40 border-brand-green-border/80'
              }`}
            >
              {!resultA.isValid && (
                <p role="alert" className="rounded border border-error-border bg-error-bg/20 p-3 text-sm font-medium text-error-text">
                  Margin analysis unavailable: {resultA.errorMessage}
                </p>
              )}
              {resultA.isValid && <>
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-text-secondary block">
                  Net Profit Generated
                </span>
                <span
                  aria-live="polite"
                  aria-atomic="true"
                  className={`text-4xl md:text-5xl font-bold font-sans tracking-tight tabular-nums block mt-1 ${
                    resultA.isLoss ? 'text-error-text' : 'text-brand-green'
                  }`}
                >
                  {formatCurrency(resultA.profit)}
                </span>
                {resultA.isLoss && (
                  <span className="text-xs text-error-text font-bold block mt-1">
                    Warning: Selling price is below cost basis (operating at a loss).
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-lg bg-surface border border-border-default">
                  <span className="text-xs text-text-secondary font-medium block">
                    Gross Profit Margin:
                  </span>
                  <span
                    className={`text-2xl font-bold tabular-nums block mt-1 ${
                      resultA.isLoss ? 'text-error-text' : 'text-brand-green'
                    }`}
                  >
                    {formatPercent(resultA.marginPct)}
                  </span>
                  <span className="text-[11px] text-text-muted mt-1 block">Yield on Revenue</span>
                </div>

                <div className="p-4 rounded-lg bg-surface border border-border-default">
                  <span className="text-xs text-text-secondary font-medium block">
                    Applied Markup:
                  </span>
                  <span
                    className={`text-2xl font-bold tabular-nums block mt-1 ${
                      resultA.isLoss ? 'text-error-text' : 'text-text-primary'
                    }`}
                  >
                    {formatPercent(resultA.markupPct)}
                  </span>
                  <span className="text-[11px] text-text-muted mt-1 block">Markup on Cost</span>
                </div>
              </div>

              <div className="text-xs text-text-secondary space-y-1.5 pt-3 border-t border-border-default">
                <div className="flex justify-between">
                  <span>Job Cost Basis:</span>
                  <span className="font-semibold text-text-primary tabular-nums">
                    {formatCurrency(resultA.totalCost)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Billed Selling Price:</span>
                  <span className="font-semibold text-text-primary tabular-nums">
                    {formatCurrency(resultA.sellingPrice)}
                  </span>
                </div>
              </div>
              </>}
            </div>
          </div>
        </div>
      ) : (
        /* MODE B: CALCULATE REQUIRED PRICE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-5">
            <div className="p-4 rounded-lg bg-canvas border border-border-default">
              <span className="text-xs font-bold uppercase tracking-wider text-text-primary block mb-3">
                Mode B: Price from Target Margin
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CurrencyInput
                  label="Total Project Cost ($)"
                  hint="Known cost to deliver the project"
                  value={costB}
                  onChange={setCostB}
                  id="mode-b-cost"
                />
                <PercentageInput
                  label="Target Gross Margin (%)"
                  hint="Desired yield on invoice total"
                  value={marginB}
                  onChange={setMarginB}
                  max={99}
                  id="mode-b-margin"
                  error={!resultB.isValid ? resultB.errorMessage : undefined}
                />
              </div>
            </div>

            <div className="p-4 rounded-lg bg-surface border border-border-default text-xs text-text-secondary space-y-2">
              <span className="font-bold text-text-primary text-sm font-headline block">
                Arithmetic Requirement
              </span>
              <p>
                To yield a true <strong className="text-text-primary">{formatPercent(marginB)}</strong> margin, you must divide your cost by <code className="font-semibold text-text-primary">(1 − {formatPercent(marginB, 2).replace('%', '')} ÷ 100)</code>.
              </p>
              <p className="text-text-muted">
                Common error: Merely multiplying cost by 1.{marginB} only adds markup and produces a lower margin than intended.
              </p>
            </div>
          </div>

          {/* Mode B Results */}
          <div className="lg:col-span-5">
            <div className="rounded-xl bg-brand-green-light/40 border border-brand-green-border/80 p-6 shadow-subtle space-y-5">
              {!resultB.isValid && (
                <p role="alert" className="rounded border border-error-border bg-error-bg/20 p-3 text-sm font-medium text-error-text">
                  Required price unavailable: {resultB.errorMessage}
                </p>
              )}
              {resultB.isValid && <>
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-text-secondary block">
                  Required Selling Price
                </span>
                <span aria-live="polite" aria-atomic="true" className="text-4xl md:text-5xl font-bold font-sans tracking-tight text-brand-green tabular-nums block mt-1">
                  {formatCurrency(resultB.sellingPrice)}
                </span>
                <span className="text-xs text-text-secondary block mt-1">
                  Target margin is {formatPercent(resultB.targetMarginPct)} of the invoice total; currency is rounded to cents.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-lg bg-surface border border-border-default">
                  <span className="text-xs text-text-secondary font-medium block">
                    Estimated Profit:
                  </span>
                  <span className="text-xl font-bold text-brand-green tabular-nums block mt-1">
                    {formatCurrency(resultB.profit)}
                  </span>
                </div>
                <div className="p-3.5 rounded-lg bg-surface border border-border-default">
                  <span className="text-xs text-text-secondary font-medium block">
                    Markup Equivalent:
                  </span>
                  <span className="text-xl font-bold text-text-primary tabular-nums block mt-1">
                    {formatPercent(resultB.markupPct)}
                  </span>
                </div>
              </div>

              <div className="text-xs text-text-secondary space-y-1.5 pt-3 border-t border-brand-green-border/60">
                <div className="flex justify-between">
                  <span>Base Job Cost:</span>
                  <span className="font-semibold text-text-primary tabular-nums">
                    {formatCurrency(resultB.totalCost)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Gross Profit Added:</span>
                  <span className="font-semibold text-brand-green tabular-nums">
                    +{formatCurrency(resultB.profit)}
                  </span>
                </div>
              </div>
              </>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
