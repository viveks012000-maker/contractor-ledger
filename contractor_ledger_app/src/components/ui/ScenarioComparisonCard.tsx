import React, { useState } from 'react';
import type { ScenarioComparisonResult } from '../../lib/financial/types';
import { calculatePriceScenarios } from '../../lib/financial/scenarios';
import { formatCurrency, formatPercent } from '../../lib/financial/formatters';
import { CurrencyAmount } from './CurrencyAmount';

interface ScenarioComparisonCardProps {
  directCost: number;
  overhead: number;
  targetMarginPct: number;
  className?: string;
}

export const ScenarioComparisonCard: React.FC<ScenarioComparisonCardProps> = ({
  directCost,
  overhead,
  targetMarginPct,
  className = '',
}) => {
  const [customMargins, setCustomMargins] = useState<{
    lower?: number;
    target?: number;
    higher?: number;
  }>({});

  const comparison: ScenarioComparisonResult = calculatePriceScenarios(
    directCost,
    overhead,
    targetMarginPct,
    customMargins
  );

  const handleMarginChange = (scenarioId: 'lower' | 'target' | 'higher', val: number) => {
    setCustomMargins(prev => ({
      ...prev,
      [scenarioId]: Math.min(Math.max(val, 0), 99),
    }));
  };

  return (
    <div className={`scenario-comparison-card bg-surface rounded-lg border border-border-default p-5 sm:p-6 shadow-subtle ${className}`}>
      {!comparison.isValid && (
        <p role="alert" className="rounded border border-error-border bg-error-bg/20 p-3 text-sm font-medium text-error-text">
          Price comparison unavailable: {comparison.errorMessage}
        </p>
      )}
      {comparison.isValid && <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-5 border-b border-border-default gap-2">
        <div>
          <h3 className="text-base font-bold text-text-primary tracking-tight font-headline">
            Side-by-Side Price Comparison
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Same total job cost for all three bids: {formatCurrency(comparison.totalCost)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {comparison.scenarios.map(sc => {
          const isTarget = sc.id === 'target';
          return (
            <div
              key={sc.id}
              className={`rounded-lg p-4 sm:p-5 transition-colors border flex flex-col justify-between ${
                isTarget
                  ? 'bg-brand-copper-light/40 border-brand-copper ring-1 ring-brand-copper/30'
                  : 'bg-canvas border-border-default'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                    {sc.label}
                  </span>
                  {isTarget && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-copper text-white">
                      Active Target
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-muted mb-4">{sc.tagline}</p>

                {/* Selling Price Display */}
                <div className="mb-3">
                  <span className="text-xs uppercase tracking-wider text-text-muted font-semibold block">
                    Selling Price
                  </span>
                  {sc.isValid ? <CurrencyAmount
                    value={sc.sellingPrice}
                    scale="compact"
                    className={`font-bold font-sans tabular-nums ${
                      isTarget ? 'text-brand-copper' : 'text-text-primary'
                    }`}
                  /> : <span className="text-2xl font-bold font-sans tabular-nums block">—</span>}
                  {!sc.isValid && <span role="status" className="mt-1 block text-xs font-medium text-error-text">{sc.errorMessage}</span>}
                </div>

                {/* Profit & Markup Details */}
                <div className="space-y-2 pt-3 border-t border-border-default text-xs">
                  <div className="flex flex-wrap justify-between items-start gap-x-2 gap-y-0.5">
                    <span className="min-w-0 text-text-secondary">Gross Profit:</span>
                    <span className="max-w-full text-right font-semibold text-profit-positive tabular-nums break-words">
                      {sc.isValid ? formatCurrency(sc.profit) : '—'}
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-between items-start gap-x-2 gap-y-0.5">
                    <span className="text-text-secondary">Markup on Cost:</span>
                    <span className="font-medium text-text-secondary tabular-nums">
                      {sc.isValid ? formatPercent(sc.markupPct) : '—'}
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-between items-start gap-x-2 gap-y-0.5">
                    <span className="min-w-0 text-text-secondary">Total Job Cost:</span>
                    <span className="max-w-full text-right text-text-muted tabular-nums break-words">
                      {formatCurrency(sc.totalCost)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Editable Margin Selector */}
              <div className="mt-5 pt-4 border-t border-border-default/60">
                <label htmlFor={`scenario-margin-${sc.id}`} className="text-xs font-semibold text-text-secondary block mb-1.5">
                  {sc.id === 'target'
                    ? 'Adjust target margin:'
                    : `Adjust ${sc.id === 'lower' ? 'lower bid' : 'higher bid'} margin:`}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id={`scenario-margin-${sc.id}`}
                    type="range"
                    min="0"
                    max="99"
                    step="1"
                    value={sc.marginPct}
                    onChange={e =>
                      handleMarginChange(
                        sc.id as 'lower' | 'target' | 'higher',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full accent-brand-copper cursor-pointer h-11 rounded bg-border-default"
                  />
                  <span className="text-xs font-semibold text-text-primary tabular-nums w-12 text-right">
                    {formatPercent(sc.marginPct)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      </>}
    </div>
  );
};
