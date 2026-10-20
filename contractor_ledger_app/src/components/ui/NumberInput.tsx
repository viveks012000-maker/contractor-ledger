import React, { useId } from 'react';

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  hint?: string;
  unitLabel?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number | string;
  error?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  label,
  value,
  onChange,
  hint,
  unitLabel,
  placeholder = '0',
  min = 0,
  max,
  step = 'any',
  error,
  disabled = false,
  id: customId,
  className = '',
}) => {
  const generatedId = useId();
  const inputId = customId || generatedId;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(0);
      return;
    }
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="text-sm font-semibold text-text-primary">
          {label}
        </label>
        {hint && <span className="text-xs text-text-secondary">{hint}</span>}
      </div>

      <div
        className={`h-11 rounded bg-surface border transition-colors flex items-center px-3 focus-within:ring-2 focus-within:ring-brand-green focus-within:border-brand-green ${
          error ? 'border-error-text bg-error-bg/10' : 'border-border-default'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-canvas' : ''}`}
      >
        <input
          id={inputId}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value === 0 && !placeholder ? '' : value}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className="w-full bg-transparent font-medium text-text-primary text-base focus:outline-none tabular-nums"
        />
        {unitLabel && (
          <span className="text-sm font-medium text-text-secondary select-none ml-2 pl-2 border-l border-border-default whitespace-nowrap">
            {unitLabel}
          </span>
        )}
      </div>

      {error && (
        <span id={`${inputId}-error`} className="text-xs text-error-text font-medium mt-0.5">
          {error}
        </span>
      )}
    </div>
  );
};
