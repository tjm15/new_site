import React, { useState } from 'react';

interface CollapsibleProps {
  children: React.ReactNode;
  previewLines?: number;
  className?: string;
}

export const Collapsible: React.FC<CollapsibleProps> = ({ children, previewLines = 6, className = '' }) => {
  const [open, setOpen] = useState(false);
  const content = typeof children === 'string' ? children : undefined;
  const needsCollapse = content ? content.split('\n').length > previewLines : false;
  return (
    <div className={className}>
      {needsCollapse && !open && content ? (
        <pre className="whitespace-pre-wrap text-[color:var(--muted)] mb-3">{content.split('\n').slice(0, previewLines).join('\n')}\n…</pre>
      ) : (
        <div>{children}</div>
      )}
      {needsCollapse && (
        <button
          onClick={() => setOpen(o => !o)}
          className="mt-1 text-xs text-[color:var(--accent)] hover:underline"
        >
          {open ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
};
