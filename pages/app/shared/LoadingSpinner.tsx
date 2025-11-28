import React from 'react';

export function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-8">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-4 border-[var(--color-edge)] rounded-full"></div>
        <div className="absolute inset-0 border-4 border-transparent border-t-[var(--color-accent)] rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
