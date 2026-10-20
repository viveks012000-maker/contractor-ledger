import React, { useState } from 'react';
import type { ScenarioComparisonResult } from '../../lib/financial/types';
import { calculatePriceScenarios } from '../../lib/financial/scenarios';
import { formatCurrency, formatPercent } from '../../lib/financial/formatters';

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
    <div className={`bg-surface rounded-lg border border-border-default p-5 shadow-subtle ${className}`}>
      {!comparison.isValid && (
        <p role="alert" className="rounded border border-error-border bg-error-bg/20 p-3 text-sm font-medium text-error-text">
          Price comparison unavailable: {comparison.errorMessage}
        </p>
      )}
      {comparison.isValid && <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-border-default gap-2">
        <div>
          <h3 className="text-base font-bold text-text-primary tracking-tight font-headline">
            Side-by-Side Price Comparison
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Evaluate bidding alternatives with identical cost basis ({formatCurrency(comparison.totalCost)})
          </p>
        </div>
        <div className="text-xs text-text-muted">
          All calculated via shared financial engine
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {comparison.scenarios.map(sc => {
          const isTarget = sc.id === 'target';
          return (
            <div
              key={sc.id}
              className={`rounded-lg p-4 transition-all border flex flex-col justify-between ${
                isTarget
                  ? 'bg-brand-green-light/40 border-brand-green ring-1 ring-brand-green/30'
                  : 'bg-canvas border-border-default'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                    {sc.label}
                  </span>
                  {isTarget && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-brand-green text-white">
                      Active Target
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted mb-3">{sc.tagline}</p>

                {/* Selling Price Display */}
                <div className="mb-3">
                  <span className="text-[11px] uppercase tracking-wider text-text-muted font-semibold block">
                    Selling Price
                  </span>
                  <span
                    className={`text-2xl font-bold font-sans tabular-nums block ${
                      isTarget ? 'text-brand-green' : 'text-text-primary'
                    }`}
                  >
                    {sc.isValid ? formatCurrency(sc.sellingPrice) : '—'}
                  </span>
                  {!sc.isValid && <span role="status" className="mt-1 block text-xs font-medium text-error-text">{sc.errorMessage}</span>}
                </div>

                {/* Profit & Markup Details */}
                <div className="space-y-1.5 pt-2 border-t border-border-default text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Gross Profit:</span>
                    <span className="font-semibold text-text-primary tabular-nums">
                      {sc.isValid ? formatCurrency(sc.profit) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Markup on Cost:</span>
                    <span className="font-medium text-text-secondary tabular-nums">
                      {sc.isValid ? formatPercent(sc.markupPct) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Total Job Cost:</span>
                    <span className="text-text-muted tabular-nums">
                      {formatCurrency(sc.totalCost)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Editable Margin Selector */}
              <div className="mt-4 pt-3 border-t border-border-default/60">
                <label htmlFor={`scenario-margin-${sc.id}`} className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block mb-1">
                  Adjust {sc.label} margin:
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
                    className="w-full accent-brand-green cursor-pointer h-11 rounded bg-border-default"
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
