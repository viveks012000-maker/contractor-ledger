import React, { useState, useEffect, useRef } from 'react';
import type { ContractorSharedSettings } from '../../lib/financial/types';
import {
  loadSharedSettings,
  saveSharedSettings,
  resetSharedSettings,
  DEFAULT_SHARED_SETTINGS,
  isStorageAvailable,
} from '../../lib/financial/storage';
import { CloseIcon, SettingsIcon, CheckIcon } from './Icons';
import { MAX_SAFE_CURRENCY } from '../../lib/financial/formatters';

export const CostSettingsModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<ContractorSharedSettings>(DEFAULT_SHARED_SETTINGS);
  const [savedNotice, setSavedNotice] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [storageSupported, setStorageSupported] = useState(true);
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setStorageSupported(isStorageAvailable());
    setSettings(loadSharedSettings());

    const handleOpen = () => {
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setSettings(loadSharedSettings());
      setSavedNotice(false);
      setSaveError(null);
      setIsOpen(true);
    };

    window.addEventListener('open-cost-settings', handleOpen);
    return () => window.removeEventListener('open-cost-settings', handleOpen);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      returnFocusRef.current?.focus();
      returnFocusRef.current = null;
      return;
    }

    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const getFocusableElements = () => Array.from(dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    ));
    const initialFocus = getFocusableElements()[0] ?? dialog;
    initialFocus.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = getFocusableElements();
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!dialog.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const success = saveSharedSettings(settings);
    if (success) {
      setSaveError(null);
      setSavedNotice(true);
      window.dispatchEvent(new CustomEvent('contractor-settings-updated', { detail: settings }));
      setTimeout(() => {
        setSavedNotice(false);
        setIsOpen(false);
      }, 700);
    } else {
      setSavedNotice(false);
      setSaveError('Settings could not be saved. Check the supported value ranges and your browser storage settings.');
    }
  };

  const handleReset = () => {
    const res = resetSharedSettings();
    setSettings(res);
    setSaveError(null);
    window.dispatchEvent(new CustomEvent('contractor-settings-updated', { detail: res }));
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 1200);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto p-2 sm:p-4 bg-black/60"
      onClick={event => {
        if (event.target === event.currentTarget) setIsOpen(false);
      }}
    >
      <div
        ref={dialogRef}
        className="settings-dialog bg-surface rounded-xl border border-border-default shadow-card max-w-lg w-full max-h-[calc(100dvh-1rem)] overflow-hidden p-4 sm:p-6 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        tabIndex={-1}
      >
        <div className="shrink-0 flex items-center justify-between pb-4 border-b border-border-default">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-brand-copper-light flex items-center justify-center text-brand-copper">
              <SettingsIcon size={18} />
            </div>
            <div>
              <h2 id="settings-modal-title" className="text-lg font-bold text-text-primary font-headline">
                Contractor Cost Settings
              </h2>
              <p className="text-xs text-text-secondary">Reusable defaults for your local device</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-text-muted hover:text-text-primary p-1.5 rounded hover:bg-canvas transition-colors"
            aria-label="Close settings"
            id="settings-close"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="min-h-0 flex flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto space-y-4 py-4">
          {!storageSupported && (
            <div className="p-3 rounded bg-amber-50 border border-amber-200 text-xs text-amber-800">
              Note: LocalStorage is disabled or unavailable in this browser. Calculations will continue to work, but settings cannot be persisted across sessions.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="settings-labor-rate" className="text-sm font-semibold text-text-primary uppercase tracking-wider block mb-1">
                Default Labor Rate ($/hr)
              </label>
              <div className="h-10 rounded bg-canvas border border-border-default shadow-field flex items-center px-3 focus-within:border-brand-copper">
                <span className="text-sm text-text-muted mr-1.5">$</span>
                <input
                  id="settings-labor-rate"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max={MAX_SAFE_CURRENCY}
                  step="any"
                  value={settings.defaultLaborRate}
                  onChange={e =>
                    setSettings({ ...settings, defaultLaborRate: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-transparent text-sm font-semibold tabular-nums focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="settings-burden" className="text-sm font-semibold text-text-primary uppercase tracking-wider block mb-1">
                Employer Burden (%)
              </label>
              <div className="h-10 rounded bg-canvas border border-border-default shadow-field flex items-center px-3 focus-within:border-brand-copper">
                <input
                  id="settings-burden"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="100"
                  step="any"
                  value={settings.defaultBurdenPercent}
                  onChange={e =>
                    setSettings({ ...settings, defaultBurdenPercent: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-transparent text-sm font-semibold tabular-nums focus:outline-none"
                />
                <span className="text-sm text-text-muted ml-1.5">%</span>
              </div>
            </div>

            <div>
              <label htmlFor="settings-overhead" className="text-sm font-semibold text-text-primary uppercase tracking-wider block mb-1">
                Default Overhead (%)
              </label>
              <div className="h-10 rounded bg-canvas border border-border-default shadow-field flex items-center px-3 focus-within:border-brand-copper">
                <input
                  id="settings-overhead"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="100"
                  step="any"
                  value={settings.defaultOverheadPercent}
                  onChange={e =>
                    setSettings({ ...settings, defaultOverheadPercent: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-transparent text-sm font-semibold tabular-nums focus:outline-none"
                />
                <span className="text-sm text-text-muted ml-1.5">%</span>
              </div>
            </div>

            <div>
              <label htmlFor="settings-margin" className="text-sm font-semibold text-text-primary uppercase tracking-wider block mb-1">
                Target Gross Margin (%)
              </label>
              <div className="h-10 rounded bg-canvas border border-border-default shadow-field flex items-center px-3 focus-within:border-brand-copper">
                <input
                  id="settings-margin"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="99"
                  step="any"
                  value={settings.defaultTargetMarginPercent}
                  onChange={e =>
                    setSettings({ ...settings, defaultTargetMarginPercent: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-transparent text-sm font-semibold tabular-nums focus:outline-none"
                />
                <span className="text-sm text-text-muted ml-1.5">%</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded bg-canvas border border-border-default text-xs text-text-secondary leading-relaxed space-y-1">
            <p><strong>Device Storage:</strong> These reusable defaults are saved in this browser's local storage and are not linked to an account.</p>
            <p>Starter values are editable assumptions, not verified local wage, tax, or overhead rates.</p>
          </div>

          {saveError && <p role="alert" className="text-xs font-medium text-error-text">{saveError}</p>}

          </div>

          <div className="shrink-0 border-t border-border-default bg-surface pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="min-h-11 self-start text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors px-3 rounded hover:bg-canvas"
            >
              Reset to Starter Defaults
            </button>

            <div className="flex items-center gap-2 self-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="min-h-11 text-xs font-semibold text-text-secondary hover:text-text-primary px-4 rounded border border-border-default hover:bg-canvas transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-11 text-xs font-semibold text-white bg-brand-copper hover:bg-brand-copper-hover px-5 rounded transition-colors flex items-center gap-1.5 shadow-xs"
                aria-live="polite"
                aria-atomic="true"
              >
                {savedNotice ? (
                  <>
                    <CheckIcon size={14} />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Defaults</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
