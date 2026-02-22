import { useStyleContext } from '@/comp-lib/styles/StyleContext';

export interface CustomSwitchStyles {
  switchTrackColor: { false: string; true: string };
  switchThumbColor: string;
  switchIosBackgroundColor: string;
}

export function useCustomSwitchStyles(): CustomSwitchStyles {
  const { colors } = useStyleContext();

  const styles = {
    switchTrackColor: {
      false: colors.tertiaryBackground,
      true: colors.primaryAccent,
    },
    switchThumbColor: colors.primaryBackground,
    switchIosBackgroundColor: colors.secondaryBackground,
  };

  return styles;
}
