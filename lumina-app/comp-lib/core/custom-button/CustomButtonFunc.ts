import { useState } from 'react';
import { type GestureResponderEvent, type LayoutChangeEvent, TextStyle, ViewStyle } from 'react-native';

import { type CustomButtonIconProps } from '@/comp-lib/core/custom-button/CustomButtonStyles';
import { type CustomButtonProps } from './CustomButton';

export interface CustomButtonFuncStyles {
  container: ViewStyle[];
  text: TextStyle[];
  icon: CustomButtonIconProps;
}

export interface CustomButtonFunc {
  onLayout: (event: LayoutChangeEvent) => void;
  onPress: (gestureEvent: GestureResponderEvent) => void;
  hovered: boolean;
  setHovered: (hovered: boolean) => void;
  getButtonStyles: (pressed: boolean) => CustomButtonFuncStyles;
}

export function useCustomButton(props: CustomButtonProps): CustomButtonFunc {
  const { title, leftIcon, rightIcon, isLoading } = props;
  const [hovered, setHovered] = useState(false);
  const [buttonWidth, setButtonWidth] = useState<number>();

  // Note: empty string ('') counts as a title, so icon styling won't be applied
  const showIconStyle = title == null && (leftIcon ?? rightIcon);

  function getButtonStyles(pressed: boolean): CustomButtonFuncStyles {
    const containerStyles: ViewStyle[] = [props.styles.container];
    const textStyles: TextStyle[] = [props.styles.text];
    const iconStyles: CustomButtonIconProps[] = [props.styles.icon];

    if (pressed) {
      containerStyles.push(props.styles.pressedContainer);
      textStyles.push(props.styles.pressedText);
      iconStyles.push(props.styles.pressedIcon);
    }
    if (props.disabled) {
      containerStyles.push(props.styles.disabledContainer);
      textStyles.push(props.styles.disabledText);
      iconStyles.push(props.styles.disabledIcon);
    }
    if (hovered) {
      containerStyles.push(props.styles.hoveredContainer);
      textStyles.push(props.styles.hoveredText);
      iconStyles.push(props.styles.hoveredIcon);
    }

    if (showIconStyle) {
      containerStyles.push(props.styles.iconOnlyContainer);
      // adding default width for edge case when iconOnlyContainer doesn't set width
      if (!props.styles.iconOnlyContainer.width) {
        containerStyles.push({
          width: props.styles.container.width ?? props.styles.container.height ?? props.styles.container.minHeight,
        });
      }
      // remove minHeight if height is set to avoid UI issues
      if (props.styles.iconOnlyContainer.height) {
        containerStyles.push({ minHeight: 0 });
      }
    }

    // when loading, lock width to measured value
    if (isLoading && buttonWidth) {
      containerStyles.push({ width: buttonWidth });
    }
    return {
      container: containerStyles,
      text: textStyles,
      icon: Object.assign({}, ...iconStyles),
    };
  }

  function onPress(gestureEvent: GestureResponderEvent) {
    if (props.onPressWithEventParams) {
      props.onPressWithEventParams(gestureEvent);
    } else {
      props.onPress();
    }
  }

  function onLayout(e: LayoutChangeEvent) {
    if (!isLoading) {
      setButtonWidth(e.nativeEvent.layout.width);
    }
  }

  return { onLayout, onPress, hovered, setHovered, getButtonStyles };
}
