import React, { useId, useState } from 'react';

interface PercentageInputProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  hint?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number | string;
  error?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export const PercentageInput: React.FC<PercentageInputProps> = ({
  label,
  value,
  onChange,
  hint,
  placeholder = '0',
  min = 0,
  max = 99.99,
  step = 'any',
  error,
  disabled = false,
  id: customId,
  className = '',
}) => {
  const generatedId = useId();
  const inputId = customId || generatedId;
  const [inputError, setInputError] = useState<string>();
  const effectiveMax = max ?? 99.99;
  const displayedError = inputError ?? error;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      if (e.currentTarget.validity.badInput) {
        setInputError('Enter a finite value within the supported range.');
        return;
      }
      setInputError(undefined);
      onChange(0);
      return;
    }
    const parsed = e.currentTarget.valueAsNumber;
    if (!Number.isFinite(parsed) || parsed < min || parsed > effectiveMax) {
      setInputError('Enter a finite value within the supported range.');
      return;
    }
    setInputError(undefined);
    onChange(parsed);
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex flex-col gap-0.5">
        <label htmlFor={inputId} className="text-sm font-semibold leading-snug text-text-primary">
          {label}
        </label>
        {hint && <span className="text-xs leading-snug text-text-secondary">{hint}</span>}
      </div>

      <div
        className={`h-11 rounded bg-surface border shadow-field transition-colors flex items-center px-3 focus-within:ring-2 focus-within:ring-brand-copper focus-within:border-brand-copper ${
          displayedError ? 'border-error-text bg-error-bg/10' : 'border-border-default'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-canvas' : ''}`}
      >
        <input
          id={inputId}
          type="number"
          min={min}
          max={effectiveMax}
          step={step}
          value={value === 0 && !placeholder ? '' : value}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={!!displayedError}
          aria-describedby={displayedError ? `${inputId}-error` : undefined}
          className="w-full bg-transparent font-medium text-text-primary text-base focus:outline-none tabular-nums"
        />
        <span className="text-sm font-medium text-text-secondary select-none ml-2 pl-2 border-l border-border-default">
          %
        </span>
      </div>

      {displayedError && (
        <span id={`${inputId}-error`} className="text-xs text-error-text font-medium mt-0.5">
          {displayedError}
        </span>
      )}
    </div>
  );
};
