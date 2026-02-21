import React, { JSX, type ReactNode } from 'react';
import { Switch, SwitchProps } from 'react-native';
import { CustomSwitchStyles, useCustomSwitchStyles } from './CustomSwitchStyles';

interface CustomSwitchProps extends SwitchProps {
  styles?: CustomSwitchStyles;
}

export function CustomSwitch(props: CustomSwitchProps): JSX.Element {
  const { thumbColor, trackColor, ios_backgroundColor, ...rest } = props;
  const defaultStyles = useCustomSwitchStyles();
  const styles = props.styles ?? defaultStyles;

  return (
    <Switch
      thumbColor={styles.switchThumbColor}
      trackColor={styles.switchTrackColor}
      ios_backgroundColor={styles.switchIosBackgroundColor}
      {...rest}
    />
  );
}
