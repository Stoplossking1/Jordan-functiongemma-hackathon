/**
 * Business logic for the LaTeX Renderer component
 * Parses text content and extracts LaTeX expressions
 */

import { useMemo } from 'react';

export type SegmentType = 'text' | 'latex-inline' | 'latex-block';

export interface ParsedSegment {
  type: SegmentType;
  content: string;
}

interface LatexRendererFuncProps {
  content: string;
}

export interface LatexRendererFunc {
  segments: ParsedSegment[];
}

/**
 * Parses content string and extracts LaTeX expressions
 * Supports:
 * - Block math: $$...$$ or \[...\]
 * - Inline math: $...$ or \(...\)
 * - Code blocks with latex language: ```latex ... ```
 */
function parseLatexContent(content: string): ParsedSegment[] {
  if (!content || content.trim().length === 0) {
    return [];
  }

  const segments: ParsedSegment[] = [];
  let remainingContent = content;

  // Pattern for code blocks with latex language identifier
  const codeBlockLatexPattern = /```latex\s*([\s\S]*?)```/;
  // Pattern for display math $$...$$ (non-greedy)
  const displayMathDoubleDollarPattern = /\$\$([\s\S]*?)\$\$/;
  // Pattern for display math \[...\]
  const displayMathBracketPattern = /\\\[([\s\S]*?)\\\]/;
  // Pattern for inline math $...$ (single line, non-greedy, not preceded/followed by $)
  const inlineMathDollarPattern = /(?<!\$)\$(?!\$)([^\$\n]+?)\$(?!\$)/;
  // Pattern for inline math \(...\)
  const inlineMathParenPattern = /\\\(([^\)]+?)\\\)/;

  while (remainingContent.length > 0) {
    // Find the earliest match among all patterns
    const matches: Array<{ index: number; length: number; content: string; type: SegmentType }> = [];

    const codeBlockMatch = codeBlockLatexPattern.exec(remainingContent);
    if (codeBlockMatch) {
      matches.push({
        index: codeBlockMatch.index,
        length: codeBlockMatch[0].length,
        content: codeBlockMatch[1].trim(),
        type: 'latex-block',
      });
    }

    const displayDoubleDollarMatch = displayMathDoubleDollarPattern.exec(remainingContent);
    if (displayDoubleDollarMatch) {
      matches.push({
        index: displayDoubleDollarMatch.index,
        length: displayDoubleDollarMatch[0].length,
        content: displayDoubleDollarMatch[1].trim(),
        type: 'latex-block',
      });
    }

    const displayBracketMatch = displayMathBracketPattern.exec(remainingContent);
    if (displayBracketMatch) {
      matches.push({
        index: displayBracketMatch.index,
        length: displayBracketMatch[0].length,
        content: displayBracketMatch[1].trim(),
        type: 'latex-block',
      });
    }

    const inlineDollarMatch = inlineMathDollarPattern.exec(remainingContent);
    if (inlineDollarMatch) {
      matches.push({
        index: inlineDollarMatch.index,
        length: inlineDollarMatch[0].length,
        content: inlineDollarMatch[1].trim(),
        type: 'latex-inline',
      });
    }

    const inlineParenMatch = inlineMathParenPattern.exec(remainingContent);
    if (inlineParenMatch) {
      matches.push({
        index: inlineParenMatch.index,
        length: inlineParenMatch[0].length,
        content: inlineParenMatch[1].trim(),
        type: 'latex-inline',
      });
    }

    if (matches.length === 0) {
      // No more LaTeX patterns found, add remaining as text
      if (remainingContent.length > 0) {
        segments.push({ type: 'text', content: remainingContent });
      }
      break;
    }

    // Sort by index to find the earliest match
    matches.sort((a, b) => a.index - b.index);
    const earliestMatch = matches[0];

    // Add text before the match
    if (earliestMatch.index > 0) {
      const textBefore = remainingContent.substring(0, earliestMatch.index);
      if (textBefore.length > 0) {
        segments.push({ type: 'text', content: textBefore });
      }
    }

    // Add the LaTeX segment
    if (earliestMatch.content.length > 0) {
      segments.push({ type: earliestMatch.type, content: earliestMatch.content });
    }

    // Move past this match
    remainingContent = remainingContent.substring(earliestMatch.index + earliestMatch.length);
  }

  return segments;
}

/**
 * Custom hook that provides business logic for the LatexRenderer component
 */
export function useLatexRenderer(props: LatexRendererFuncProps): LatexRendererFunc {
  const segments = useMemo(() => parseLatexContent(props.content), [props.content]);

  return {
    segments,
  };
}

