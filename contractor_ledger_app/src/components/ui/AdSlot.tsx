import React from 'react';

interface AdSlotProps {
  slotId?: string;
  format?: 'horizontal-leaderboard' | 'rectangle-rail' | 'in-content';
  className?: string;
  enabled?: boolean;
}

/**
 * AdSlot Component - AdSense Compliant Placeholder Container
 *
 * NOTE: As required by Google AdSense policies and architectural specifications:
 * - No fake publisher ID is injected.
 * - Advertisements are disabled by default until official Google AdSense approval.
 * - Inactive ad slots collapse to zero height (hidden) to prevent large useless blank spaces.
 * - When enabled after approval, this container maintains exact dimensions to prevent CLS.
 * - Placed safely away from calculator inputs and interactive controls.
 */
export const AdSlot: React.FC<AdSlotProps> = ({
  slotId = 'standard-slot',
  format = 'horizontal-leaderboard',
  className = '',
  enabled = false,
}) => {
  if (!enabled) {
    return (
      <div
        data-ad-container={slotId}
        data-ad-status="pending-approval"
        aria-hidden="true"
        className="hidden"
      />
    );
  }

  const minHeight = format === 'rectangle-rail' ? 'min-h-[250px]' : 'min-h-[90px]';

  return (
    <div
      className={`w-full my-6 flex flex-col items-center justify-center ${className}`}
      data-ad-container={slotId}
      data-ad-status="active"
      aria-label="Advertisement Placement"
    >
      <div
        className={`w-full max-w-4xl ${minHeight} rounded border border-border-default bg-canvas flex items-center justify-center`}
      >
        {/* Approved Google AdSense <ins class="adsbygoogle" ...> will be placed here */}
      </div>
    </div>
  );
};
