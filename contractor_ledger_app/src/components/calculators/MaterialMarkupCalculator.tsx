import React, { useState } from 'react';
import { CurrencyInput } from '../ui/CurrencyInput';
import { PercentageInput } from '../ui/PercentageInput';
import { NumberInput } from '../ui/NumberInput';
import { calculateMaterialMarkup } from '../../lib/financial/materialMarkup';
import { formatCurrency, formatPercent, formatQuantity } from '../../lib/financial/formatters';
import { LayersIcon } from '../ui/Icons';

export const MaterialMarkupCalculator: React.FC = () => {
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState(100);
  const [wasteAllowancePct, setWasteAllowancePct] = useState(0);
  const [targetMarkupPct, setTargetMarkupPct] = useState(25);
  const [unitLabel, setUnitLabel] = useState('units');

  const result = calculateMaterialMarkup({
    quantity,
    unitCost,
    wasteAllowancePct,
    targetMarkupPct,
  });

  const handleReset = () => {
    setQuantity(1);
    setUnitCost(100);
    setWasteAllowancePct(0);
    setTargetMarkupPct(25);
    setUnitLabel('units');
  };

  return (
    <div className="calculator-workspace bg-surface rounded-xl border border-border-default shadow-card p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-border-default gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-copper-light flex items-center justify-center text-brand-copper shrink-0">
            <LayersIcon size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary tracking-tight font-headline">
              Material Markup &amp; Waste Calculator
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Price job supplies, raw lumber, hardware, and include waste procurement allowances
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <NumberInput
                label="Required Net Quantity"
                hint="Supports fractional units (e.g. 2.5)"
                value={quantity}
                onChange={setQuantity}
                min={0}
                step="any"
                id="mat-qty"
              />
              <div className="mt-1 flex items-center gap-1.5 text-xs text-text-muted">
                <span>Unit:</span>
                <input
                  type="text"
                  aria-label="Material unit name"
                  value={unitLabel}
                  onChange={e => setUnitLabel(e.target.value)}
                  className="px-2 py-0.5 rounded border border-border-default shadow-field text-xs font-medium w-24 bg-canvas focus:outline-none focus:border-brand-copper"
                  placeholder="e.g. sq ft"
                />
              </div>
            </div>

            <CurrencyInput
              label="Supplier Unit Cost ($)"
              hint={`Wholesale cost per ${unitLabel}`}
              value={unitCost}
              onChange={setUnitCost}
              id="mat-unit-cost"
            />

            <PercentageInput
              label="Waste / Scrap Allowance (%)"
              hint="Cut scrap, damage, pattern matching"
              value={wasteAllowancePct}
              onChange={setWasteAllowancePct}
              max={100}
              id="mat-waste"
            />

            <PercentageInput
              label="Target Material Markup (%)"
              hint="Markup added to wholesale cost"
              value={targetMarkupPct}
              onChange={setTargetMarkupPct}
              max={300}
              id="mat-markup"
            />
          </div>

          {result.isValid && <div className="p-4 rounded-lg bg-canvas border border-border-default text-xs text-text-secondary leading-relaxed space-y-2">
            <span className="font-bold text-text-primary text-sm font-headline block">
              Procurement Note on Waste Buffer
            </span>
            <p>
              When a {wasteAllowancePct}% waste allowance is configured, your effective procurement quantity increases from{' '}
              <strong className="text-text-primary">
                {formatQuantity(result.initialQuantity)} {unitLabel}
              </strong>{' '}
              to{' '}
              <strong className="text-brand-copper font-semibold">
                {formatQuantity(result.effectiveQuantity)} {unitLabel}
              </strong>
              . This protects your margins from onsite cutting losses and supplier variances.
            </p>
          </div>}
        </div>

        {/* Results Card */}
        <div className="lg:col-span-5">
          <div className="result-panel p-6 space-y-5">
            {!result.isValid && (
              <p role="alert" className="rounded border border-error-border bg-error-bg/20 p-3 text-sm font-medium text-error-text">
                Material estimate unavailable: {result.errorMessage}
              </p>
            )}
            {result.isValid && <>
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-text-secondary block">
                Billed Material Price
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span aria-live="polite" aria-atomic="true" className="text-[36px] sm:text-[42px] md:text-[50px] leading-tight font-bold font-sans tracking-tight text-white tabular-nums">
                  {formatCurrency(result.sellingPrice)}
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Yields <strong className="text-text-primary">{formatPercent(result.profitMarginPct)}</strong> profit margin on the billed invoice
              </p>
            </div>

            {/* Procurement Quantity Card */}
            <div className="p-4 rounded-lg bg-surface border border-brand-copper-border space-y-1">
              <span className="text-xs text-text-secondary font-medium block">
                Procurement Quantity to Order:
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-text-primary tabular-nums">
                  {formatQuantity(result.effectiveQuantity)}
                </span>
                <span className="text-xs text-text-secondary font-medium">{unitLabel}</span>
              </div>
              {result.wasteAllowancePct > 0 && (
                <span className="text-xs text-brand-copper font-medium block">
                  Includes {result.wasteAllowancePct}% waste buffer (+
                  {formatQuantity(result.effectiveQuantity - result.initialQuantity)} {unitLabel})
                </span>
              )}
            </div>

            {/* Financial Details */}
            <div className="space-y-2 text-xs border-t border-brand-copper-border/60 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Base Material Cost (Net):</span>
                <span className="font-semibold text-text-primary tabular-nums">
                  {formatCurrency(result.baseMaterialCost)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Adjusted Procurement Cost:</span>
                <span className="font-semibold text-text-primary tabular-nums">
                  {formatCurrency(result.adjustedMaterialCost)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">
                  Material Markup ({result.markupPct}%):
                </span>
                <span className="font-semibold text-profit-inverse tabular-nums">
                  +{formatCurrency(result.markupAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border-default font-semibold text-text-primary">
                <span>Resulting Profit Margin:</span>
                <span className="text-profit-inverse tabular-nums">
                  {formatPercent(result.profitMarginPct)}
                </span>
              </div>
            </div>
            </>}
          </div>
        </div>
      </div>
    </div>
  );
};
