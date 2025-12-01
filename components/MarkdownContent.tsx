import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import { normalizeLLMText } from '../utils/markdown';

interface MarkdownContentProps {
  content?: string;
  markdown?: string;
  className?: string;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, markdown, className = '' }) => {
  const source = typeof markdown === 'string' ? markdown : content || '';
  const cleaned = normalizeLLMText(source || '');
  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        skipHtml={false}
      >
        {cleaned}
      </ReactMarkdown>
    </div>
  );
};
