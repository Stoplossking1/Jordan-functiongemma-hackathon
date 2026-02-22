import { TextStyle, ViewStyle } from 'react-native';
import { CustomTextInputStyles } from './CustomTextInputStyles';
import { getItalicFontFamily } from '../../styles/getItalicFontFamily';

interface FakePlaceholderStyles {
  container: TextStyle;
  inputInnerContainer: ViewStyle;
  overlayBase: ViewStyle;
  overlaySingleline: ViewStyle;
  overlayMultiline: ViewStyle;
  input: TextStyle;
}

export function useFakePlaceholderStyles(styles: CustomTextInputStyles): FakePlaceholderStyles {
  return {
    container: {
      flex: 0,
      paddingVertical: 0,
    },
    inputInnerContainer: {
      position: 'relative',
      flex: 1,
    },
    overlayBase: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
    overlaySingleline: {
      justifyContent: 'center',
    },
    overlayMultiline: {
      justifyContent: 'flex-start',
    },
    input: {
      ...(styles.input ?? {}),
      color: styles.placeholderTextColor,
      flex: 0,
      paddingTop: styles.input?.paddingTop ?? styles.input?.paddingVertical ?? 0,
      paddingBottom: styles.input?.paddingBottom ?? styles.input?.paddingVertical ?? 0,
      fontFamily: getItalicFontFamily(styles.input?.fontFamily),
    },
  };
}
