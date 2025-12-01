import React from 'react';

export function LoadingSpinner({ size = 48 }: { size?: number }) {
  return (
    <div className="flex justify-center items-center py-8">
      <div className="relative" style={{ width: size, height: size }}>
        <div className="absolute inset-0 border-4 border-[var(--color-edge)] rounded-full"></div>
        <div className="absolute inset-0 border-4 border-transparent border-t-[var(--color-accent)] rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
