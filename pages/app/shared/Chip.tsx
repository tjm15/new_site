import React from 'react';

interface ChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function Chip({ label, active = false, onClick }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 rounded-full text-sm font-medium transition-all
        ${active 
          ? 'bg-[var(--color-accent)] text-white shadow-sm' 
          : 'bg-[var(--color-panel)] text-[var(--color-muted)] border border-[var(--color-edge)] hover:border-[var(--color-accent)]'
        }
      `}
    >
      {label}
    </button>
  );
}
