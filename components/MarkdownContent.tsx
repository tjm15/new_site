import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, className = '' }) => {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-[color:var(--ink)] mb-4" {...props} />,
        h2: ({node, ...props}) => <h2 className="text-xl font-bold text-[color:var(--ink)] mb-3" {...props} />,
        h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-[color:var(--ink)] mb-2" {...props} />,
        h4: ({node, ...props}) => <h4 className="text-base font-semibold text-[color:var(--ink)] mb-2" {...props} />,
        p: ({node, ...props}) => <p className="text-[color:var(--muted)] mb-3 leading-relaxed" {...props} />,
        ul: ({node, ...props}) => <ul className="list-disc list-inside mb-3 text-[color:var(--muted)] space-y-1" {...props} />,
        ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-3 text-[color:var(--muted)] space-y-1" {...props} />,
        li: ({node, ...props}) => <li className="mb-1" {...props} />,
        strong: ({node, ...props}) => <strong className="font-semibold text-[color:var(--ink)]" {...props} />,
        em: ({node, ...props}) => <em className="italic" {...props} />,
        code: ({node, inline, className, children, ...props}: any) => 
          inline 
            ? <code className="bg-[color:var(--surface)] px-1.5 py-0.5 rounded text-sm font-mono text-[color:var(--accent)]" {...props}>{children}</code>
            : <code className="block bg-[color:var(--surface)] p-4 rounded-lg text-sm font-mono overflow-x-auto mb-3 border border-[color:var(--edge)]" {...props}>{children}</code>,
        blockquote: ({node, ...props}) => (
          <blockquote className="border-l-4 border-[color:var(--accent)] pl-4 italic text-[color:var(--muted)] mb-3" {...props} />
        ),
        a: ({node, ...props}) => (
          <a className="text-[color:var(--accent)] hover:underline" {...props} />
        ),
        table: ({node, ...props}) => (
          <div className="overflow-x-auto mb-3">
            <table className="min-w-full border-collapse border border-[color:var(--edge)]" {...props} />
          </div>
        ),
        th: ({node, ...props}) => (
          <th className="border border-[color:var(--edge)] px-4 py-2 bg-[color:var(--surface)] font-semibold text-[color:var(--ink)]" {...props} />
        ),
        td: ({node, ...props}) => (
          <td className="border border-[color:var(--edge)] px-4 py-2 text-[color:var(--muted)]" {...props} />
        ),
      }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
