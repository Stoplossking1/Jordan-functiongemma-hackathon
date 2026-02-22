import { type ReactNode } from 'react';
import { type GestureResponderEvent, type PressableProps, ActivityIndicator, Pressable } from 'react-native';

import type { CustomButtonIconProps, CustomButtonStyles } from '@/comp-lib/core/custom-button/CustomButtonStyles';
import { CustomTextField } from '../custom-text-field/CustomTextField';
import { useCustomButton } from './CustomButtonFunc';

/**
 * A customizable button component that supports internationalization.
 * This button renders a pressable element with optional title and icon and supports custom styling.
 * The CustomButton does not support children, but instead uses a title prop for text content.
 * Do not pass children to this component, as it will not render them.
 * The button can be disabled, which will apply disabled styles to both the button and its text.
 */
export interface CustomButtonProps extends PressableProps {
  onPress: () => void;
  onPressWithEventParams?: (gestureEvent: GestureResponderEvent) => void; // Optional function to handle press with parameters
  title?: string;
  /** render-prop for icon: gets passed { size, color } from `styles` to match presets styling */
  leftIcon?: (props: CustomButtonIconProps) => ReactNode;
  rightIcon?: (props: CustomButtonIconProps) => ReactNode;
  isLoading?: boolean;
  styles: CustomButtonStyles;
}

export function CustomButton(props: CustomButtonProps): ReactNode {
  // destructure needed to get remaining content into "rest"
  const { onPress: _onPress, title, leftIcon, rightIcon, isLoading, styles: _styles, ...rest } = props;
  const { onLayout, onPress, setHovered, getButtonStyles } = useCustomButton(props);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      disabled={props.disabled}
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel ?? title}
      style={({ pressed }) => getButtonStyles(pressed).container}
      onLayout={onLayout}
      {...rest}
    >
      {({ pressed }) => {
        const currentStyles = getButtonStyles(pressed);

        const leftIconElement = leftIcon?.(currentStyles.icon) ?? null;
        const rightIconElement = rightIcon?.(currentStyles.icon) ?? null;
        const titleElement = title && (
          <CustomTextField title={title} allowFontScaling={false} styles={currentStyles.text} />
        );

        return props.isLoading ? (
          <>
            <ActivityIndicator size={currentStyles.icon.size} color={currentStyles.icon.color} />
          </>
        ) : (
          <>
            {leftIconElement}
            {titleElement}
            {rightIconElement}
          </>
        );
      }}
    </Pressable>
  );
}
