import { useStyleContext } from '@/comp-lib/styles/StyleContext';

export interface ReactInspectorOverlayBaseStyles {
  border: string;
  backgroundColor: string;
  position: string;
  pointerEvents: string;
  zIndex: string;
  transition: string;
}

export interface ReactInspectorOverlayStyles {
  styles: ReactInspectorOverlayBaseStyles;
}

function hexToRgba(hex: string, alpha: number): string {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Parse the hex color
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function useReactInspectorOverlayStyles(): ReactInspectorOverlayStyles {
  const { colors } = useStyleContext();

  const styles: ReactInspectorOverlayBaseStyles = {
    border: `2px solid ${colors.primaryAccent}`,
    backgroundColor: hexToRgba(colors.primaryAccent, 0.1),
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: '999999',
    transition: 'none',
  };

  return { styles };
}
