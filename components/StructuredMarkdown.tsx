import React from 'react';
import { MarkdownContent } from './MarkdownContent';
import { Collapsible } from './Collapsible';
import { normalizeLLMText } from '../utils/markdown';

interface Section { title?: string; body: string; }

function parseSections(content: string): Section[] {
  const lines = content.split('\n');
  const sections: Section[] = [];
  let current: Section = { body: '' };
  const headingRegex = /^(#{2,3}|\d+\.|\*\*.+\*\*)\s*/;
  lines.forEach(line => {
    if (headingRegex.test(line.trim())) {
      if (current.body.trim()) sections.push(current);
      const clean = line.replace(/^(#{2,3}|\d+\.|)\s*/, '').replace(/\*\*/g, '').trim();
      current = { title: clean, body: '' };
    } else {
      current.body += line + '\n';
    }
  });
  if (current.body.trim()) sections.push(current);
  // If only one section without title, return as single
  return sections.length ? sections : [{ body: content }];
}

interface StructuredMarkdownProps {
  content: string;
  collapseLines?: number;
  className?: string;
}

export const StructuredMarkdown: React.FC<StructuredMarkdownProps> = ({ content, collapseLines = 18, className = '' }) => {
  const cleaned = normalizeLLMText(content || '');
  const sections = parseSections(cleaned);
  return (
    <div className={className}>
      {sections.map((s, idx) => {
        const bodyLineCount = s.body.split('\n').filter(l=>l.trim()).length;
        const needsCollapse = bodyLineCount > collapseLines;
        return (
          <div key={idx} className={idx>0? 'mt-4': ''}>
            {s.title && <h4 className="text-sm font-semibold text-[var(--color-ink)] mb-2">{s.title}</h4>}
            {needsCollapse ? (
              <Collapsible previewLines={collapseLines}>
                <MarkdownContent content={s.body.trim()} />
              </Collapsible>
            ) : (
              <MarkdownContent content={s.body.trim()} />
            )}
          </div>
        );
      })}
    </div>
  );
};
