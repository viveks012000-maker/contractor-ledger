import React from 'react';
import type { CurrencyBreakdownItem } from '../../lib/financial/types';
import { formatCurrency, formatPercent } from '../../lib/financial/formatters';

interface ProfitBreakdownBarProps {
  title?: string;
  totalAmount: number;
  totalLabel?: string;
  items: CurrencyBreakdownItem[];
  className?: string;
  heightClass?: string;
}

export const ProfitBreakdownBar: React.FC<ProfitBreakdownBarProps> = ({
  title = 'Cost & Margin Allocation',
  totalAmount,
  totalLabel = 'Selling Price',
  items,
  className = '',
  heightClass = 'h-3.5',
}) => {
  const validItems = items.filter(item => item.amount > 0);
  const total = totalAmount > 0 ? totalAmount : 1;

  return (
    <div className={`flex flex-col gap-2.5 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 text-xs text-text-secondary font-medium">
        <span className="min-w-0">{title}</span>
        <span className="min-w-0 max-w-full text-right font-semibold text-text-primary tabular-nums break-words">
          {formatCurrency(totalAmount)} {totalLabel}
        </span>
      </div>

      {/* Meter Bar */}
      <div
        className={`profit-breakdown-track w-full ${heightClass} rounded flex overflow-hidden`}
        aria-hidden="true"
      >
        {validItems.length === 0 ? (
          <div className="w-full h-full bg-border-default" />
        ) : (
          validItems.map(item => {
            const pct = Math.max(0, Math.min(100, (item.amount / total) * 100));
            return (
              <div
                key={item.id}
                className="h-full"
                style={{
                  width: `${pct}%`,
                  backgroundColor: item.color || 'var(--color-chart-labor)',
                }}
                title={`${item.label}: ${formatCurrency(item.amount)} (${formatPercent(pct)})`}
              />
            );
          })
        )}
      </div>

      {/* Color Keys & Figures */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-3 pt-1 text-[13px]">
        {validItems.map(item => {
          const pct = (item.amount / total) * 100;
          return (
            <div key={item.id} className="min-w-0 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: item.color || 'var(--color-chart-labor)' }}
                aria-hidden="true"
              />
              <span className="text-text-secondary font-normal">{item.label}:</span>
              <span className="max-w-full text-text-primary font-semibold tabular-nums break-words">
                {formatCurrency(item.amount)}
              </span>
              <span className="text-text-muted tabular-nums whitespace-nowrap">
                ({formatPercent(pct)})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
