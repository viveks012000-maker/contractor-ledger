import React from 'react';

interface AdSlotProps {
  slotId?: string;
  format?: 'horizontal-leaderboard' | 'rectangle-rail' | 'in-content';
  className?: string;
}

/**
 * AdSlot Component - AdSense Compliant Placeholder Container
 *
 * NOTE: As required by Google AdSense policies and architectural specifications:
 * - No fake publisher ID is injected.
 * - Advertisements are disabled by default until official Google AdSense approval.
 * - This container maintains exact dimensions to prevent Cumulative Layout Shift (CLS).
 * - Placed away from vital financial interactive elements (buttons, inputs, results).
 * - When approved, replace the placeholder markup inside the data-ad-container with
 *   your official <ins class="adsbygoogle" ...></ins> tag.
 */
export const AdSlot: React.FC<AdSlotProps> = ({
  slotId = 'standard-slot',
  format = 'horizontal-leaderboard',
  className = '',
}) => {
  // Height rules to prevent layout shift
  const minHeight = format === 'rectangle-rail' ? 'min-h-[250px]' : 'min-h-[90px]';

  return (
    <div
      className={`w-full my-6 flex flex-col items-center justify-center ${className}`}
      data-ad-container={slotId}
      aria-label="Advertisement Placement Area"
    >
      <div
        className={`w-full max-w-4xl ${minHeight} rounded border border-dashed border-border-default bg-canvas/60 flex flex-col items-center justify-center p-3 text-center`}
      >
        <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted mb-1">
          Advertisement Placement
        </span>
        <span className="text-xs text-text-secondary max-w-sm">
          Clean, non-intrusive ad slot reserved for approved Google AdSense network. Zero layout shift.
        </span>
      </div>
    </div>
  );
};
