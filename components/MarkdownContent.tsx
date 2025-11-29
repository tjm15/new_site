import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { normalizeLLMText } from '../utils/markdown';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, className = '' }) => {
  const cleaned = normalizeLLMText(content || '');
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        skipHtml={false}
        components={{
        h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-[var(--color-ink)] mb-4" {...props} />,
        h2: ({node, ...props}) => <h2 className="text-xl font-bold text-[var(--color-ink)] mb-3" {...props} />,
        h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-2" {...props} />,
        h4: ({node, ...props}) => <h4 className="text-base font-semibold text-[var(--color-ink)] mb-2" {...props} />,
        p: ({node, ...props}) => <p className="text-[var(--color-muted)] mb-3 leading-relaxed" {...props} />,
        ul: ({node, ...props}) => <ul className="list-disc list-inside mb-3 text-[var(--color-muted)] space-y-1" {...props} />,
        ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-3 text-[var(--color-muted)] space-y-1" {...props} />,
        li: ({node, ...props}) => <li className="mb-1" {...props} />,
        strong: ({node, ...props}) => <strong className="font-semibold text-[var(--color-ink)]" {...props} />,
        em: ({node, ...props}) => <em className="italic" {...props} />,
        code: ({node, inline, className, children, ...props}: any) => 
          inline 
            ? <code className="bg-[var(--color-surface)] px-1.5 py-0.5 rounded text-sm font-mono text-[var(--color-accent)]" {...props}>{children}</code>
            : <code className="block bg-[var(--color-surface)] p-4 rounded-lg text-sm font-mono overflow-x-auto mb-3 border border-[var(--color-edge)]" {...props}>{children}</code>,
        blockquote: ({node, ...props}) => (
          <blockquote className="border-l-4 border-[var(--color-accent)] pl-4 italic text-[var(--color-muted)] mb-3" {...props} />
        ),
        a: ({node, ...props}) => (
          <a className="text-[var(--color-accent)] hover:underline" {...props} />
        ),
        table: ({node, ...props}) => (
          <div className="overflow-x-auto mb-3">
            <table className="min-w-full border-collapse border border-[var(--color-edge)]" {...props} />
          </div>
        ),
        th: ({node, ...props}) => (
          <th className="border border-[var(--color-edge)] px-4 py-2 bg-[var(--color-surface)] font-semibold text-[var(--color-ink)]" {...props} />
        ),
        td: ({node, ...props}) => (
          <td className="border border-[var(--color-edge)] px-4 py-2 text-[var(--color-muted)]" {...props} />
        ),
      }}
      >
        {cleaned}
      </ReactMarkdown>
    </div>
  );
};
