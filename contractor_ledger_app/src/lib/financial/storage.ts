import type { ContractorSharedSettings } from './types';
import { MAX_SAFE_CURRENCY } from './formatters';

export const DEFAULT_SHARED_SETTINGS: ContractorSharedSettings = {
  version: 1,
  defaultLaborRate: 65, // Editable starter assumption; not a verified market rate
  defaultBurdenPercent: 22, // Editable starter assumption; not a statutory tax rate
  defaultOverheadPercent: 15, // Editable starter assumption
  defaultTargetMarginPercent: 25, // Editable starter assumption
  preferredUnit: 'hrs',
  updatedAt: new Date().toISOString(),
};

const STORAGE_KEY = 'contractor_ledger_user_defaults_v1';

function readNonNegativeNumber(value: unknown, fallback: number, max = MAX_SAFE_CURRENCY): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return fallback;
  return Math.min(value, max);
}

export function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const testKey = '__test_storage__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function loadSharedSettings(): ContractorSharedSettings {
  if (!isStorageAvailable()) {
    return { ...DEFAULT_SHARED_SETTINGS };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SHARED_SETTINGS };

    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.version === 1) {
      return {
        version: 1,
        defaultLaborRate: readNonNegativeNumber(
          parsed.defaultLaborRate,
          DEFAULT_SHARED_SETTINGS.defaultLaborRate,
        ),
        defaultBurdenPercent: readNonNegativeNumber(
          parsed.defaultBurdenPercent,
          DEFAULT_SHARED_SETTINGS.defaultBurdenPercent,
          100,
        ),
        defaultOverheadPercent: readNonNegativeNumber(
          parsed.defaultOverheadPercent,
          DEFAULT_SHARED_SETTINGS.defaultOverheadPercent,
          100,
        ),
        defaultTargetMarginPercent: readNonNegativeNumber(
          parsed.defaultTargetMarginPercent,
          DEFAULT_SHARED_SETTINGS.defaultTargetMarginPercent,
          99,
        ),
        preferredUnit: typeof parsed.preferredUnit === 'string' ? parsed.preferredUnit : DEFAULT_SHARED_SETTINGS.preferredUnit,
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
      };
    }
    return { ...DEFAULT_SHARED_SETTINGS };
  } catch (err) {
    console.warn('Could not read Contractor Ledger settings from localStorage, falling back to defaults.', err);
    return { ...DEFAULT_SHARED_SETTINGS };
  }
}

export function saveSharedSettings(settings: Partial<ContractorSharedSettings>): boolean {
  if (!isStorageAvailable()) return false;

  try {
    const current = loadSharedSettings();
    const candidate = { ...current, ...settings };
    if (
      !Number.isFinite(candidate.defaultLaborRate) ||
      candidate.defaultLaborRate < 0 || candidate.defaultLaborRate > MAX_SAFE_CURRENCY ||
      !Number.isFinite(candidate.defaultBurdenPercent) ||
      candidate.defaultBurdenPercent < 0 || candidate.defaultBurdenPercent > 100 ||
      !Number.isFinite(candidate.defaultOverheadPercent) ||
      candidate.defaultOverheadPercent < 0 || candidate.defaultOverheadPercent > 100 ||
      !Number.isFinite(candidate.defaultTargetMarginPercent) ||
      candidate.defaultTargetMarginPercent < 0 || candidate.defaultTargetMarginPercent > 99
    ) {
      return false;
    }

    const updated: ContractorSharedSettings = {
      ...candidate,
      version: 1,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (err) {
    console.warn('Could not save Contractor Ledger settings to localStorage.', err);
    return false;
  }
}

export function resetSharedSettings(): ContractorSharedSettings {
  if (isStorageAvailable()) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn('Could not reset localStorage.', err);
    }
  }
  return { ...DEFAULT_SHARED_SETTINGS };
}
