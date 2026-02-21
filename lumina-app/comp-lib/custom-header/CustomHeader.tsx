import React, { type ReactNode } from 'react';
import { View } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { CustomHeaderStyles, useCustomHeaderStyles } from './CustomHeaderStyles';
import { CustomButton } from '../core/custom-button/CustomButton';
import { CustomTextField } from '../core/custom-text-field/CustomTextField';

export interface CustomHeaderProps {
  showBackButton?: boolean;
  /** required props when showBackButton is true */
  onGoBack?: () => void;
  title?: string;
  /**replaces back button when provided */
  LeftComponent?: ReactNode;
  RightComponent?: ReactNode;
  ProgressBarComponent?: ReactNode;
  SubtitleComponent?: ReactNode;
  customHeaderStyles?: CustomHeaderStyles;
}

export function CustomHeader(props: CustomHeaderProps): ReactNode {
  const customHeaderStyles = useCustomHeaderStyles();
  const styles = props.customHeaderStyles ?? customHeaderStyles;

  return (
    <View style={styles.container}>
      <View style={styles.mainContainer}>
        <View style={styles.headerLeft}>
          {props.showBackButton && props.onGoBack && !props.LeftComponent && (
            <CustomButton
              onPress={props.onGoBack}
              styles={styles.backCustomButtonStyles}
              leftIcon={({ size, color }) => <AntDesign name="left" size={size} color={color} />}
            />
          )}
          {/* LeftComponent is for optional elements aligned to the left side of the header, such as custom back buttons, action buttons, icons, or menu triggers. */}
          {props.LeftComponent}
        </View>

        {/* SubtitleComponent is used to display additional content below or next to the title, such as subtitles, step indicators, or taglines. */}
        <View style={styles.headerCenter}>
          {props.title && <CustomTextField title={props.title} styles={styles.title} />}
          {props.SubtitleComponent}
        </View>

        {/* RightComponent is for optional elements on the right side of the header, such as action buttons, icons, or menu triggers. */}
        <View style={styles.headerRight}>{props.RightComponent}</View>
      </View>
      {/* ProgressBarComponent is used to render elements that are visually and functionally part of the header layout, such as progress bars, indicators, or tabs. These should be injected here instead of being placed separately below the header. */}
      {props.ProgressBarComponent}
    </View>
  );
}
