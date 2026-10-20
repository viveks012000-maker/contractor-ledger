import type { MaterialMarkupInput, MaterialMarkupResult } from './types';
import { MAX_SAFE_CURRENCY, roundCurrency, roundPrecision, safeDivide } from './formatters';

function invalidMaterialMarkupResult(errorMessage: string): MaterialMarkupResult {
  return {
    initialQuantity: 0,
    wasteAllowancePct: 0,
    effectiveQuantity: 0,
    unitCost: 0,
    baseMaterialCost: 0,
    adjustedMaterialCost: 0,
    markupPct: 0,
    markupAmount: 0,
    sellingPrice: 0,
    profit: 0,
    profitMarginPct: 0,
    isValid: false,
    errorMessage,
  };
}

export function calculateMaterialMarkup(input: MaterialMarkupInput): MaterialMarkupResult {
  if (
    !Number.isFinite(input.quantity) || Math.abs(input.quantity) > Number.MAX_SAFE_INTEGER ||
    !Number.isFinite(input.unitCost) || Math.abs(input.unitCost) > MAX_SAFE_CURRENCY ||
    !Number.isFinite(input.wasteAllowancePct) || Math.abs(input.wasteAllowancePct) > Number.MAX_SAFE_INTEGER ||
    !Number.isFinite(input.targetMarkupPct) || Math.abs(input.targetMarkupPct) > Number.MAX_SAFE_INTEGER
  ) {
    return invalidMaterialMarkupResult('One or more values exceed the safe calculation range.');
  }

  const initialQuantity = Math.max(0, input.quantity || 0);
  const unitCost = roundCurrency(Math.max(0, input.unitCost || 0));
  const wasteAllowancePct = Math.max(0, input.wasteAllowancePct || 0);
  const targetMarkupPct = Math.max(0, input.targetMarkupPct || 0);

  // Effective quantity preserves up to 4 decimal places for fractional procurement
  const rawEffectiveQuantity = initialQuantity * (1 + wasteAllowancePct / 100);
  if (!Number.isFinite(rawEffectiveQuantity) || rawEffectiveQuantity > Number.MAX_SAFE_INTEGER) {
    return invalidMaterialMarkupResult('Effective procurement quantity exceeds the safe calculation range.');
  }
  const effectiveQuantity = roundPrecision(rawEffectiveQuantity, 4);
  const rawBaseMaterialCost = initialQuantity * unitCost;
  const rawAdjustedMaterialCost = effectiveQuantity * unitCost;
  if (
    !Number.isFinite(rawBaseMaterialCost) || rawBaseMaterialCost > MAX_SAFE_CURRENCY ||
    !Number.isFinite(rawAdjustedMaterialCost) || rawAdjustedMaterialCost > MAX_SAFE_CURRENCY
  ) {
    return invalidMaterialMarkupResult('Material costs exceed the safe currency range.');
  }
  const baseMaterialCost = roundCurrency(rawBaseMaterialCost);
  const adjustedMaterialCost = roundCurrency(rawAdjustedMaterialCost);

  const rawMarkupAmount = adjustedMaterialCost * (targetMarkupPct / 100);
  const rawSellingPrice = adjustedMaterialCost + rawMarkupAmount;
  if (
    !Number.isFinite(rawMarkupAmount) || rawMarkupAmount > MAX_SAFE_CURRENCY ||
    !Number.isFinite(rawSellingPrice) || rawSellingPrice > MAX_SAFE_CURRENCY
  ) {
    return invalidMaterialMarkupResult('Markup or selling price exceeds the safe currency range.');
  }
  const markupAmount = roundCurrency(rawMarkupAmount);
  const sellingPrice = roundCurrency(rawSellingPrice);
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
