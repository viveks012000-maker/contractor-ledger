import React, { useState } from 'react';
import type { EstimateCategory, EstimateLineItem, OverheadMode } from '../../lib/financial/types';
import { calculateProjectEstimate } from '../../lib/financial/projectEstimate';
import { formatCurrency, formatPercent } from '../../lib/financial/formatters';
import { ProfitBreakdownBar } from '../ui/ProfitBreakdownBar';
import { ScenarioComparisonCard } from '../ui/ScenarioComparisonCard';
import { ReceiptIcon, PlusIcon, TrashIcon } from '../ui/Icons';

const INITIAL_ITEMS: EstimateLineItem[] = [
  {
    id: 'item-1',
    category: 'labor',
    description: 'Framing & structural rough-in carpentry',
    quantity: 44,
    unit: 'hrs',
    unitCost: 70,
  },
  {
    id: 'item-2',
    category: 'materials',
    description: 'Structural framing lumber, engineered beams & hardware',
    quantity: 1,
    unit: 'lump',
    unitCost: 2111,
  },
  {
    id: 'item-3',
    category: 'subcontractors',
    description: 'Licensed electrical rough-in contractor',
    quantity: 1,
    unit: 'lump',
    unitCost: 1650,
  },
];

const CATEGORIES: { id: EstimateCategory; label: string }[] = [
  { id: 'labor', label: 'Direct Labor' },
  { id: 'materials', label: 'Materials' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'subcontractors', label: 'Subcontractors' },
  { id: 'other', label: 'Other Direct' },
];

export const ProjectEstimateCalculator: React.FC = () => {
  const [items, setItems] = useState<EstimateLineItem[]>(INITIAL_ITEMS);
  const [overheadMode, setOverheadMode] = useState<OverheadMode>('percentage');
  const [overheadValue, setOverheadValue] = useState(12);
  const [targetMarginPct, setTargetMarginPct] = useState(22);

  // New item draft state
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<EstimateCategory>('materials');
  const [newQty, setNewQty] = useState(1);
  const [newUnit, setNewUnit] = useState('ea');
  const [newCost, setNewCost] = useState(100);

  const result = calculateProjectEstimate({
    items,
    overheadMode,
    overheadValue,
    targetMarginPct,
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) return;

    const newItem: EstimateLineItem = {
      id: `item-${Date.now()}`,
      category: newCategory,
      description: newDesc.trim(),
      quantity: Math.max(0, newQty),
      unit: newUnit.trim() || 'ea',
      unitCost: Math.max(0, newCost),
    };

    setItems([...items, newItem]);
    setNewDesc('');
    setNewQty(1);
    setNewCost(100);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleUpdateItem = (
    id: string,
    field: keyof EstimateLineItem,
    value: string | number
  ) => {
    setItems(
      items.map(item => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleResetToSample = () => {
    setItems(INITIAL_ITEMS);
    setOverheadMode('percentage');
    setOverheadValue(12);
    setTargetMarginPct(22);
  };

  return (
    <div className="bg-surface rounded-xl border border-border-default shadow-card p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border-default gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-green-light flex items-center justify-center text-brand-green shrink-0">
            <ReceiptIcon size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary tracking-tight font-headline">
              Project Estimate &amp; Itemized Bid Ledger
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Build a multi-category cost sheet across labor, supplies, subs, and markup
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetToSample}
          className="text-xs font-medium text-text-muted hover:text-text-primary px-2.5 py-1.5 rounded hover:bg-canvas transition-colors self-start sm:self-auto"
        >
          Reset Prompt Baseline ($9,822.97)
        </button>
      </div>

      {/* Main Grid: Ledger & Add Form on Left, Output Rail on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Itemized Line Items & Categories */}
        <div className="lg:col-span-8 space-y-6">
          {/* Add Line Item Form */}
          <form
            onSubmit={handleAddItem}
            className="p-4 rounded-lg bg-canvas border border-border-default space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                Add Line Item
              </span>
              <span className="text-xs text-text-muted">Real-time subtotal updates</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-3">
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as EstimateCategory)}
                  className="w-full h-10 px-2 rounded bg-surface border border-border-default text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-green"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-5">
                <input
                  type="text"
                  placeholder="Item description (e.g., Drywall hang & tape)"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full h-10 px-3 rounded bg-surface border border-border-default text-xs font-medium text-text-primary focus:outline-none focus:border-brand-green"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <div className="flex h-10 rounded bg-surface border border-border-default overflow-hidden">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Qty"
                    value={newQty}
                    onChange={e => setNewQty(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 text-xs font-semibold tabular-nums focus:outline-none text-right"
                  />
                  <input
                    type="text"
                    placeholder="unit"
                    value={newUnit}
                    onChange={e => setNewUnit(e.target.value)}
                    className="w-12 px-1 text-[11px] font-medium text-text-muted bg-canvas border-l border-border-default text-center focus:outline-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-2 flex items-center gap-1.5">
                <div className="flex h-10 w-full rounded bg-surface border border-border-default items-center px-2">
                  <span className="text-xs text-text-muted mr-1">$</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Cost"
                    value={newCost}
                    onChange={e => setNewCost(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-semibold tabular-nums focus:outline-none text-right"
                  />
                </div>
                <button
                  type="submit"
                  className="h-10 px-3 rounded bg-brand-green text-white hover:bg-brand-green-hover transition-colors flex items-center justify-center shrink-0"
                  title="Add Line Item"
                >
                  <PlusIcon size={16} />
                </button>
              </div>
            </div>
          </form>

          {/* Desktop Table / Mobile Stacked Item List */}
          <div className="rounded-lg border border-border-default overflow-hidden">
            <div className="bg-canvas px-4 py-2.5 border-b border-border-default flex items-center justify-between text-xs font-bold text-text-secondary uppercase tracking-wider">
              <span>Itemized Scope of Work</span>
              <span>{items.length} Line Items</span>
            </div>

            {items.length === 0 ? (
              <div className="p-8 text-center text-sm text-text-muted bg-surface">
                No line items added yet. Use the form above to add your first scope item.
              </div>
            ) : (
              <div className="divide-y divide-border-default bg-surface">
                {items.map(item => {
                  const rowTotal = item.quantity * item.unitCost;
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-canvas/40 transition-colors"
                    >
                      <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-canvas border border-border-default text-text-secondary shrink-0">
                          {item.category}
                        </span>
                        <input
                          type="text"
                          value={item.description}
                          onChange={e => handleUpdateItem(item.id, 'description', e.target.value)}
                          className="w-full text-xs font-medium text-text-primary bg-transparent border-b border-transparent hover:border-border-default focus:border-brand-green focus:outline-none py-0.5"
                        />
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <div className="flex items-center gap-1.5 text-xs">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.quantity}
                            onChange={e =>
                              handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)
                            }
                            className="w-14 text-right px-1.5 py-0.5 rounded border border-border-default text-xs font-semibold tabular-nums focus:outline-none focus:border-brand-green"
                          />
                          <span className="text-text-muted w-8">{item.unit}</span>
                          <span className="text-text-muted">@</span>
                          <div className="flex items-center rounded border border-border-default px-1.5 py-0.5 w-20">
                            <span className="text-text-muted text-[11px] mr-1">$</span>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.unitCost}
                              onChange={e =>
                                handleUpdateItem(item.id, 'unitCost', parseFloat(e.target.value) || 0)
                              }
                              className="w-full text-right text-xs font-semibold tabular-nums focus:outline-none"
                            />
                          </div>
                        </div>

                        <span className="font-bold text-text-primary tabular-nums text-xs sm:w-20 text-right">
                          {formatCurrency(rowTotal)}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-text-muted hover:text-error-text p-1 transition-colors"
                          title="Remove item"
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Category Subtotals Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            {CATEGORIES.map(c => {
              const sub = result.categorySummaries[c.id];
              return (
                <div
                  key={c.id}
                  className="p-3 rounded-lg bg-canvas border border-border-default text-center"
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted block">
                    {c.label}
                  </span>
                  <span className="text-sm font-bold text-text-primary tabular-nums block mt-1">
                    {formatCurrency(sub.subtotal)}
                  </span>
                  <span className="text-[10px] text-text-secondary block mt-0.5">
                    {sub.itemCount} item{sub.itemCount === 1 ? '' : 's'} ({formatPercent(sub.pctOfDirect, 0)})
                  </span>
                </div>
              );
            })}
          </div>

          {/* Overhead & Profit Margin Controls */}
          <div className="p-4 rounded-lg bg-surface border border-border-default grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-text-primary">
                  Overhead Allocation
                </label>
                <div className="flex text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setOverheadMode('percentage')}
                    className={`px-2 py-0.5 rounded-l text-[11px] ${
                      overheadMode === 'percentage'
                        ? 'bg-brand-green text-white'
                        : 'bg-canvas text-text-secondary border border-border-default'
                    }`}
                  >
                    Direct %
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverheadMode('fixed')}
                    className={`px-2 py-0.5 rounded-r text-[11px] ${
                      overheadMode === 'fixed'
                        ? 'bg-brand-green text-white'
                        : 'bg-canvas text-text-secondary border border-border-default'
                    }`}
                  >
                    Fixed $
                  </button>
                </div>
              </div>

              {overheadMode === 'percentage' ? (
                <div className="h-10 rounded bg-canvas border border-border-default flex items-center px-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={overheadValue}
                    onChange={e => setOverheadValue(parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent text-sm font-semibold tabular-nums focus:outline-none"
                  />
                  <span className="text-xs text-text-muted ml-1">%</span>
                </div>
              ) : (
                <div className="h-10 rounded bg-canvas border border-border-default flex items-center px-3">
                  <span className="text-xs text-text-muted mr-1">$</span>
                  <input
                    type="number"
                    min="0"
                    value={overheadValue}
                    onChange={e => setOverheadValue(parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent text-sm font-semibold tabular-nums focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-text-primary block mb-1.5">
                Target Gross Profit Margin (%)
              </label>
              <div className="h-10 rounded bg-canvas border border-border-default flex items-center px-3">
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={targetMarginPct}
                  onChange={e => setTargetMarginPct(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent text-sm font-semibold tabular-nums focus:outline-none"
                />
                <span className="text-xs text-text-muted ml-1">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Final Estimate Rail */}
        <div className="lg:col-span-4">
          <div className="rounded-xl bg-brand-green-light/40 border border-brand-green-border/80 p-6 shadow-subtle space-y-5 sticky top-24">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-text-secondary block">
                Estimated Client Bid
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-3xl sm:text-4xl font-bold font-sans tracking-tight text-brand-green tabular-nums">
                  {formatCurrency(result.sellingPrice)}
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Calculated for an exact <strong className="text-text-primary">{formatPercent(result.actualMarginPct)}</strong> gross margin
              </p>
            </div>

            {/* Subtotal Ledgers */}
            <div className="space-y-2 text-xs border-t border-brand-green-border/60 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Direct Project Costs:</span>
                <span className="font-semibold text-text-primary tabular-nums">
                  {formatCurrency(result.directCosts)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">
                  Allocated Overhead ({overheadMode === 'percentage' ? `${overheadValue}%` : 'Fixed'}):
                </span>
                <span className="font-semibold text-text-primary tabular-nums">
                  +{formatCurrency(result.allocatedOverhead)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-brand-green-border/40 font-bold text-text-primary">
                <span>Total Estimated Cost:</span>
                <span className="tabular-nums">{formatCurrency(result.totalCost)}</span>
              </div>
              <div className="flex justify-between items-center text-brand-green font-bold pt-1">
                <span>Estimated Gross Profit:</span>
                <span className="tabular-nums">+{formatCurrency(result.profit)}</span>
              </div>
              <div className="flex justify-between items-center text-text-muted">
                <span>Markup Equivalent on Cost:</span>
                <span className="tabular-nums">{formatPercent(result.markupEquivalentPct)}</span>
              </div>
            </div>

            {/* Visual Breakdown Bar */}
            <ProfitBreakdownBar
              totalAmount={result.sellingPrice}
              items={result.breakdown}
              className="pt-2"
            />
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison for Estimate */}
      <div className="pt-6 border-t border-border-default">
        <ScenarioComparisonCard
          directCost={result.directCosts}
          overhead={result.allocatedOverhead}
          targetMarginPct={result.targetMarginPct}
        />
      </div>
    </div>
  );
};
