/**
 * LaTeX Renderer Component
 * Renders text with embedded LaTeX math expressions using MathJax
 */

import React, { type ReactNode } from 'react';
import { View, Text } from 'react-native';
import { MathJaxSvg } from 'react-native-mathjax-html-to-svg';
import { useLatexRendererStyles, type LatexRendererStyles } from './LatexRendererStyles';
import { useLatexRenderer, type ParsedSegment } from './LatexRendererFunc';

interface LatexRendererProps {
  content: string;
  textColor?: string;
  fontSize?: number;
  styles?: LatexRendererStyles;
}

export function LatexRenderer(props: LatexRendererProps): ReactNode {
  const defaultStyles = useLatexRendererStyles();
  const styles = props.styles ?? defaultStyles;
  const { segments } = useLatexRenderer({ content: props.content });

  const textColor = props.textColor ?? (styles.text.color as string) ?? '#000000';
  const fontSize = props.fontSize ?? (styles.text.fontSize as number) ?? 16;

  function renderSegment(segment: ParsedSegment, index: number): ReactNode {
    if (segment.type === 'text') {
      return (
        <Text key={`text-${index}`} style={[styles.text, { color: textColor, fontSize }]} allowFontScaling={false}>
          {segment.content}
        </Text>
      );
    }

    if (segment.type === 'latex-inline') {
      return (
        <View key={`latex-inline-${index}`} style={styles.inlineLatexContainer}>
          <MathJaxSvg fontSize={fontSize} color={textColor} style={styles.latexContent}>
            {`$${segment.content}$`}
          </MathJaxSvg>
        </View>
      );
    }

    if (segment.type === 'latex-block') {
      return (
        <View key={`latex-block-${index}`} style={styles.blockLatexContainer}>
          <MathJaxSvg fontSize={fontSize * 1.2} color={textColor} style={styles.latexContent}>
            {`$$${segment.content}$$`}
          </MathJaxSvg>
        </View>
      );
    }

    return null;
  }

  return (
    <View style={styles.container}>
      {segments.map((segment, index) => renderSegment(segment, index))}
    </View>
  );
}

