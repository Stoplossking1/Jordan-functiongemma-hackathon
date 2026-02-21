import React, { forwardRef, type ReactNode } from 'react';
import { Pressable, PressableProps, TextInput, type TextInputProps, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomTextField } from '../custom-text-field/CustomTextField';
import { CustomTextInputStyles } from './CustomTextInputStyles';
import { useCustomTextInput } from './CustomTextInputFunc';
import { useFakePlaceholderStyles } from './FakePlaceholderStyles';

export interface CustomTextInputProps extends TextInputProps {
  styles: CustomTextInputStyles;
  label?: string;
  errorText?: string;
  /**
   * If true, applies error style without showing error text. Use when displaying error messages separately
   */
  showErrorStyle?: boolean;
  /**
   * If true, wraps the input in a Pressable component to allow for only onPress events
   */
  pressableOnly?: boolean;
  /**
   * If true, applies focused style to the input
   */
  showFocusedStyle?: boolean;
  /**
   * Name of "Ionicon" to display on the left side of the input
   */
  leftIonIconsName?: keyof typeof Ionicons.glyphMap;
  onPressLeftIonIcons?: () => void;
  /**
   * Name of "Ionicon" to display on the right side of the input
   */
  rightIonIconsName?: keyof typeof Ionicons.glyphMap;
  onPressRightIonIcons?: () => void;
  cursivePlaceholder?: boolean;
}

export const CustomTextInput = forwardRef<TextInput, CustomTextInputProps>((props, ref): ReactNode => {
  const { isFocused, setIsFocused } = useCustomTextInput(props);
  const { label, styles, errorText, showErrorStyle, editable, multiline, placeholder, cursivePlaceholder, ...rest } =
    props; // destructure needed to get remaining content into "rest"
  const fakePlaceholderStyles = useFakePlaceholderStyles(props.styles);

  const hasError = !!errorText || showErrorStyle;

  const isEmpty = props.value == null || props.value === '';
  const showFakePlaceholder = cursivePlaceholder && isEmpty && !!placeholder;

  const pressableProps: PressableProps = {
    onPress: props.onPress,
    disabled: props.editable === false,
  };

  const InputContent = (
    <View
      style={[
        props.styles.container,
        isFocused || props.showFocusedStyle ? props.styles.focused : {},
        hasError ? props.styles.error : {},
        editable === false ? props.styles.disabled : {},
      ]}
    >
      {props.leftIonIconsName && (
        <Pressable style={props.styles.iconLeftContainer} onPress={props.onPressLeftIonIcons}>
          <Ionicons name={props.leftIonIconsName} size={props.styles.iconLeftSize} color={props.styles.iconLeftColor} />
        </Pressable>
      )}
      <View style={fakePlaceholderStyles.inputInnerContainer}>
        {showFakePlaceholder && (
          <View
            pointerEvents="none"
            style={[
              fakePlaceholderStyles.overlayBase,
              multiline ? fakePlaceholderStyles.overlayMultiline : fakePlaceholderStyles.overlaySingleline,
            ]}
          >
            <CustomTextField
              {...(multiline ? {} : { numberOfLines: 1, ellipsizeMode: 'tail' })}
              styles={fakePlaceholderStyles.input}
              title={placeholder}
            />
          </View>
        )}

        <TextInput
          ref={ref}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          allowFontScaling={false}
          style={[
            props.styles.input,
            rest.style ?? {},
            isFocused || props.showFocusedStyle ? props.styles.inputFocused : {},
          ]}
          placeholder={showFakePlaceholder ? undefined : placeholder}
          placeholderTextColor={props.styles.placeholderTextColor}
          multiline={multiline}
          editable={editable}
          {...rest}
        />
      </View>
      {props.rightIonIconsName && (
        <Pressable style={props.styles.iconRightContainer} onPress={props.onPressRightIonIcons}>
          <Ionicons
            name={props.rightIonIconsName}
            size={props.styles.iconRightSize}
            color={props.styles.iconRightColor}
          />
        </Pressable>
      )}
    </View>
  );

  return (
    <View style={props.styles.wrapper}>
      {label && <CustomTextField title={label} styles={props.styles.label}></CustomTextField>}

      {!!props.pressableOnly && !!props.onPress ? (
        <Pressable {...pressableProps}>
          <View pointerEvents="none">{InputContent}</View>
        </Pressable>
      ) : (
        InputContent
      )}

      {errorText && <CustomTextField title={errorText} styles={props.styles.errorText}></CustomTextField>}
    </View>
  );
});

CustomTextInput.displayName = 'CustomTextInput';
