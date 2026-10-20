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
      <div className="flex items-center justify-between text-xs text-text-secondary font-medium">
        <span>{title}</span>
        <span className="font-semibold text-text-primary tabular-nums">
          {formatCurrency(totalAmount)} {totalLabel}
        </span>
      </div>

      {/* Meter Bar */}
      <div
        className={`w-full ${heightClass} rounded bg-[#E2EAE6] flex overflow-hidden`}
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
                className="h-full transition-all duration-300"
                style={{
                  width: `${pct}%`,
                  backgroundColor: item.color || '#4F5B57',
                }}
                title={`${item.label}: ${formatCurrency(item.amount)} (${formatPercent(pct)})`}
              />
            );
          })
        )}
      </div>

      {/* Color Keys & Figures */}
      <div className="flex flex-wrap items-center justify-between gap-y-1.5 gap-x-4 pt-1 text-xs">
        {validItems.map(item => {
          const pct = (item.amount / total) * 100;
          return (
            <div key={item.id} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: item.color || '#4F5B57' }}
                aria-hidden="true"
              />
              <span className="text-text-secondary font-normal">{item.label}:</span>
              <span className="text-text-primary font-semibold tabular-nums">
                {formatCurrency(item.amount)}
              </span>
              <span className="text-text-muted tabular-nums">
                ({formatPercent(pct)})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
