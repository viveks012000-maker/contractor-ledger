/**
 * Pure Financial Types for Contractor Ledger
 */

export interface CurrencyBreakdownItem {
  id: string;
  label: string;
  amount: number;
  percentageOfTotal: number;
  color?: string;
}

export type OverheadMode = 'fixed' | 'percentage';

// 1. Job Pricing Types
export interface JobPricingInput {
  laborCost: number;
  materialCost: number;
  otherCost: number;
  overheadMode: OverheadMode;
  overheadValue: number; // dollars if 'fixed', percentage (0-100) if 'percentage'
  targetMarginPct: number; // percentage (0-99.99)
}

export interface JobPricingResult {
  directCost: number;
  allocatedOverhead: number;
  totalCost: number;
  targetMarginPct: number;
  sellingPrice: number;
  profit: number;
  actualMarginPct: number;
  markupEquivalentPct: number;
  isValid: boolean;
  errorMessage?: string;
  breakdown: CurrencyBreakdownItem[];
}

// 2. Labor Cost Types
export interface LaborCostInput {
  workersCount: number;
  regularHoursPerWorker: number;
  hourlyWage: number;
  overtimeHoursPerWorker: number;
  overtimeMultiplier: number;
  burdenPercentage: number; // percentage (0-100+)
  additionalExpenses: number;
}

export interface LaborCostResult {
  totalWorkers: number;
  regularHoursTotal: number;
  overtimeHoursTotal: number;
  totalHours: number;
  regularWages: number;
  overtimeWages: number;
  grossWages: number;
  employerBurden: number;
  additionalExpenses: number;
  totalLaborCost: number;
  loadedHourlyCost: number;
  isValid: boolean;
  errorMessage?: string;
  breakdown: CurrencyBreakdownItem[];
}

// 3. Profit Margin Types
export interface AnalyzeMarginInput {
  totalCost: number;
  sellingPrice: number;
}

export interface AnalyzeMarginResult {
  totalCost: number;
  sellingPrice: number;
  profit: number;
  marginPct: number;
  markupPct: number;
  isLoss: boolean;
  isValid: boolean;
  errorMessage?: string;
}

export interface RequiredPriceInput {
  totalCost: number;
  targetMarginPct: number; // percentage (0-99.99)
}

export interface RequiredPriceResult {
  totalCost: number;
  targetMarginPct: number;
  sellingPrice: number;
  profit: number;
  markupPct: number;
  isValid: boolean;
  errorMessage?: string;
}

// 4. Break-Even Types
export interface BreakEvenInput {
  fixedMonthlyCosts: number;
  variableCostPerHour: number;
  expectedMonthlyBillableHours: number;
}

export interface BreakEvenResult {
  fixedMonthlyCosts: number;
  variableCostPerHour: number;
  expectedMonthlyBillableHours: number;
  fixedOverheadPerHour: number;
  breakEvenHourlyRate: number;
  monthlyRevenueRequired: number;
  variableCostContribution: number;
  isValid: boolean;
  errorMessage?: string;
}

// 5. Material Markup Types
export interface MaterialMarkupInput {
  quantity: number;
  unitCost: number;
  wasteAllowancePct: number; // percentage (e.g. 10%)
  targetMarkupPct: number; // percentage (e.g. 25%)
}

export interface MaterialMarkupResult {
  initialQuantity: number;
  wasteAllowancePct: number;
  effectiveQuantity: number;
  unitCost: number;
  baseMaterialCost: number;
  adjustedMaterialCost: number;
  markupPct: number;
  markupAmount: number;
  sellingPrice: number;
  profit: number;
  profitMarginPct: number;
  isValid: boolean;
  errorMessage?: string;
}

// 6. Project Estimate Types
export type EstimateCategory = 'labor' | 'materials' | 'equipment' | 'subcontractors' | 'other';

export interface EstimateLineItem {
  id: string;
  category: EstimateCategory;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
}

export interface ProjectEstimateInput {
  items: EstimateLineItem[];
  overheadMode: OverheadMode;
  overheadValue: number;
  targetMarginPct: number;
}

export interface CategorySummary {
  category: EstimateCategory;
  label: string;
  itemCount: number;
  subtotal: number;
  pctOfDirect: number;
}

export interface ProjectEstimateResult {
  categorySummaries: Record<EstimateCategory, CategorySummary>;
  directCosts: number;
  allocatedOverhead: number;
  totalCost: number;
  targetMarginPct: number;
  sellingPrice: number;
  profit: number;
  actualMarginPct: number;
  markupEquivalentPct: number;
  isValid: boolean;
  errorMessage?: string;
  breakdown: CurrencyBreakdownItem[];
}

// Shared Settings Schema
export interface ContractorSharedSettings {
  version: number;
  defaultLaborRate: number;
  defaultBurdenPercent: number;
  defaultOverheadPercent: number;
  defaultTargetMarginPercent: number;
  preferredUnit: string;
  updatedAt: string;
}

// Scenario Comparison Types
export interface PriceScenario {
  id: string;
  label: string;
  tagline: string;
  marginPct: number;
  sellingPrice: number;
  totalCost: number;
  profit: number;
  markupPct: number;
  isValid: boolean;
  errorMessage?: string;
  isActive?: boolean;
}

export interface ScenarioComparisonResult {
  directCost: number;
  allocatedOverhead: number;
  totalCost: number;
  isValid: boolean;
  errorMessage?: string;
  scenarios: PriceScenario[];
}
