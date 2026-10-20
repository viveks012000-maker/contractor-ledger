import React from 'react';

interface AdSlotProps {
  slotId: string;
}

/** Inactive marker retained for future approved placements; it never reserves space or loads ad code. */
export const AdSlot: React.FC<AdSlotProps> = ({ slotId }) => (
  <div
    data-ad-container={slotId}
    data-ad-status="pending-approval"
    aria-hidden="true"
    className="hidden"
  />
);
