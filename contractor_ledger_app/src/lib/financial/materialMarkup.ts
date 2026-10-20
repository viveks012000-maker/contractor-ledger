import type { MaterialMarkupInput, MaterialMarkupResult } from './types';
import { roundCurrency, roundPrecision, safeDivide } from './formatters';

export function calculateMaterialMarkup(input: MaterialMarkupInput): MaterialMarkupResult {
  const initialQuantity = Math.max(0, input.quantity || 0);
  const unitCost = roundCurrency(Math.max(0, input.unitCost || 0));
  const wasteAllowancePct = Math.max(0, input.wasteAllowancePct || 0);
  const targetMarkupPct = Math.max(0, input.targetMarkupPct || 0);

  // Effective quantity preserves up to 4 decimal places for fractional procurement
  const effectiveQuantity = roundPrecision(initialQuantity * (1 + wasteAllowancePct / 100), 4);
  const baseMaterialCost = roundCurrency(initialQuantity * unitCost);
  const adjustedMaterialCost = roundCurrency(effectiveQuantity * unitCost);

  const markupAmount = roundCurrency(adjustedMaterialCost * (targetMarkupPct / 100));
  const sellingPrice = roundCurrency(adjustedMaterialCost + markupAmount);
  const profit = roundCurrency(sellingPrice - adjustedMaterialCost);
  const profitMarginPct = sellingPrice > 0 
    ? roundCurrency(safeDivide(profit, sellingPrice, 0) * 100) 
    : 0;

  return {
    initialQuantity,
    wasteAllowancePct,
    effectiveQuantity,
    unitCost,
    baseMaterialCost,
    adjustedMaterialCost,
    markupPct: targetMarkupPct,
    markupAmount,
    sellingPrice,
    profit,
    profitMarginPct,
    isValid: true,
  };
}
