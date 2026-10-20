import React from 'react';
import { formatCurrency } from '../../lib/financial/formatters';

interface CurrencyAmountProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number;
  scale?: 'hero' | 'compact';
  suffix?: string;
}

export const CurrencyAmount: React.FC<CurrencyAmountProps> = ({
  value,
  scale = 'hero',
  suffix,
  className = '',
  style,
  ...spanProps
}) => {
  const formattedAmount = formatCurrency(value);

  return (
    <span className={`currency-amount-container ${scale === 'compact' ? 'currency-amount-container--compact' : ''}`}>
      <span
        {...spanProps}
        style={{ ...style, '--currency-amount-characters': formattedAmount.length + (suffix?.length ?? 0) } as React.CSSProperties}
        className={`currency-amount-fit ${className}`}
      >
        {formattedAmount}
        {suffix && <span className="currency-amount-suffix">{suffix}</span>}
      </span>
    </span>
  );
};
