import { type ReactNode } from 'react';
import { StyleProp, Text, TextStyle, type TextProps } from 'react-native';

export interface CustomTextFieldProps extends TextProps {
  styles: StyleProp<TextStyle>;
  title: string;
}

export function CustomTextField(props: CustomTextFieldProps): ReactNode {
  const { title, styles, ...rest } = props; // destructure needed to get remaining content into "rest"
  return (
    <Text style={styles} allowFontScaling={false} {...rest}>
      {title}
    </Text>
  );
}
