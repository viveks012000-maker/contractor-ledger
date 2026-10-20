import React, { useState, useEffect } from 'react';
import type { ContractorSharedSettings } from '../../lib/financial/types';
import {
  loadSharedSettings,
  saveSharedSettings,
  resetSharedSettings,
  DEFAULT_SHARED_SETTINGS,
  isStorageAvailable,
} from '../../lib/financial/storage';
import { CloseIcon, SettingsIcon, CheckIcon } from './Icons';

export const CostSettingsModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<ContractorSharedSettings>(DEFAULT_SHARED_SETTINGS);
  const [savedNotice, setSavedNotice] = useState(false);
  const [storageSupported, setStorageSupported] = useState(true);

  useEffect(() => {
    setStorageSupported(isStorageAvailable());
    setSettings(loadSharedSettings());

    const handleOpen = () => {
      setSettings(loadSharedSettings());
      setIsOpen(true);
    };

    window.addEventListener('open-cost-settings', handleOpen);
    return () => window.removeEventListener('open-cost-settings', handleOpen);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const success = saveSharedSettings(settings);
    if (success) {
      setSavedNotice(true);
      window.dispatchEvent(new CustomEvent('contractor-settings-updated', { detail: settings }));
      setTimeout(() => {
        setSavedNotice(false);
        setIsOpen(false);
      }, 700);
    }
  };

  const handleReset = () => {
    const res = resetSharedSettings();
    setSettings(res);
    window.dispatchEvent(new CustomEvent('contractor-settings-updated', { detail: res }));
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 1200);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div
        className="bg-surface rounded-xl border border-border-default shadow-card max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-border-default">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-brand-green-light flex items-center justify-center text-brand-green">
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
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 py-4">
          {!storageSupported && (
            <div className="p-3 rounded bg-amber-50 border border-amber-200 text-xs text-amber-800">
              Note: LocalStorage is disabled or unavailable in this browser. Calculations will continue to work, but settings cannot be persisted across sessions.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-text-primary uppercase tracking-wider block mb-1">
                Default Labor Rate ($/hr)
              </label>
              <div className="h-10 rounded bg-canvas border border-border-default flex items-center px-3 focus-within:border-brand-green">
                <span className="text-sm text-text-muted mr-1.5">$</span>
                <input
                  type="number"
                  min="0"
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
              <label className="text-xs font-semibold text-text-primary uppercase tracking-wider block mb-1">
                Employer Burden (%)
              </label>
              <div className="h-10 rounded bg-canvas border border-border-default flex items-center px-3 focus-within:border-brand-green">
                <input
                  type="number"
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
              <label className="text-xs font-semibold text-text-primary uppercase tracking-wider block mb-1">
                Default Overhead (%)
              </label>
              <div className="h-10 rounded bg-canvas border border-border-default flex items-center px-3 focus-within:border-brand-green">
                <input
                  type="number"
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
              <label className="text-xs font-semibold text-text-primary uppercase tracking-wider block mb-1">
                Target Gross Margin (%)
              </label>
              <div className="h-10 rounded bg-canvas border border-border-default flex items-center px-3 focus-within:border-brand-green">
                <input
                  type="number"
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

          <div className="p-3 rounded bg-canvas border border-border-default text-xs text-text-secondary leading-relaxed">
            <strong>Device Storage:</strong> Settings are stored strictly on this device via browser LocalStorage. No accounts, no servers, and no tracking.
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border-default">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors py-2 px-3 rounded hover:bg-canvas"
            >
              Reset to Standard Defaults
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs font-semibold text-text-secondary hover:text-text-primary px-4 py-2 rounded border border-border-default hover:bg-canvas transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="text-xs font-semibold text-white bg-brand-green hover:bg-brand-green-hover px-5 py-2 rounded transition-colors flex items-center gap-1.5 shadow-xs"
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
