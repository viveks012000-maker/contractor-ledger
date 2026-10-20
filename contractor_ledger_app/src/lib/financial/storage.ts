import type { ContractorSharedSettings } from './types';

export const DEFAULT_SHARED_SETTINGS: ContractorSharedSettings = {
  version: 1,
  defaultLaborRate: 65, // Standard US journeyman/trade average rate
  defaultBurdenPercent: 22, // Standard FICA, FUTA, SUTA, workers comp baseline
  defaultOverheadPercent: 15, // Standard small trade contractor overhead allocation
  defaultTargetMarginPercent: 25, // Standard commercial/residential gross margin target
  preferredUnit: 'hrs',
  updatedAt: new Date().toISOString(),
};

const STORAGE_KEY = 'contractor_ledger_user_defaults_v1';

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
        defaultLaborRate: Math.max(0, Number(parsed.defaultLaborRate) || DEFAULT_SHARED_SETTINGS.defaultLaborRate),
        defaultBurdenPercent: Math.max(0, Number(parsed.defaultBurdenPercent) || DEFAULT_SHARED_SETTINGS.defaultBurdenPercent),
        defaultOverheadPercent: Math.max(0, Number(parsed.defaultOverheadPercent) || DEFAULT_SHARED_SETTINGS.defaultOverheadPercent),
        defaultTargetMarginPercent: Math.min(
          99,
          Math.max(0, Number(parsed.defaultTargetMarginPercent) || DEFAULT_SHARED_SETTINGS.defaultTargetMarginPercent)
        ),
        preferredUnit: typeof parsed.preferredUnit === 'string' ? parsed.preferredUnit : DEFAULT_SHARED_SETTINGS.preferredUnit,
        updatedAt: parsed.updatedAt || new Date().toISOString(),
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
    const updated: ContractorSharedSettings = {
      ...current,
      ...settings,
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
