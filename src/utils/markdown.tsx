import React from 'react';

/**
 * A lightweight utility to parse simple markdown to React elements safely.
 * Handles:
 * - # Headings
 * - **Bold text**
 * - - Bullet lists
 * - Paragraphs
 */
export function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  const lines = text.split('\n');
  return (
    <div className="space-y-3 text-slate-700 leading-relaxed text-sm">
      {lines.map((line, index) => {
        const trimmed = line.trim();

        // Empty lines
        if (trimmed === '') {
          return <div key={index} className="h-2" />;
        }

        // Headings: # Subject or ## Key Points
        if (trimmed.startsWith('#')) {
          const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
          if (match) {
            const level = match[1].length;
            const content = parseInline(match[2]);
            if (level === 1) {
              return <h1 key={index} className="text-xl font-bold text-slate-900 mt-4 mb-2 tracking-tight">{content}</h1>;
            } else if (level === 2) {
              return <h2 key={index} className="text-lg font-semibold text-slate-900 mt-4 mb-2 tracking-tight">{content}</h2>;
            } else {
              return <h3 key={index} className="text-base font-semibold text-slate-800 mt-3 mb-1">{content}</h3>;
            }
          }
        }

        // Bullet lists: - task
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const content = parseInline(trimmed.substring(2));
          return (
            <ul key={index} className="list-disc pl-5 space-y-1 my-1">
              <li className="text-slate-700">{content}</li>
            </ul>
          );
        }

        // Numbered lists: 1. task
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          const content = parseInline(numMatch[2]);
          return (
            <ol key={index} className="list-decimal pl-5 space-y-1 my-1">
              <li className="text-slate-700">{content}</li>
            </ol>
          );
        }

        // Standard paragraph
        return <p key={index} className="text-slate-700">{parseInline(line)}</p>;
      })}
    </div>
  );
}

// Simple parser for inline elements like **bold**
function parseInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/);
  return (
    <>
      {parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={idx} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
        }
        return part;
      })}
    </>
  );
}
