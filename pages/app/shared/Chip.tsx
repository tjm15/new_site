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
          ? 'bg-[color:var(--accent)] text-white shadow-sm' 
          : 'bg-[color:var(--panel)] text-[color:var(--muted)] border border-[color:var(--edge)] hover:border-[color:var(--accent)]'
        }
      `}
    >
      {label}
    </button>
  );
}
