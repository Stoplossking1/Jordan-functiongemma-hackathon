import React, { type ReactNode } from 'react';
import { View } from 'react-native';

import { CustomTextField } from '@/comp-lib/core/custom-text-field/CustomTextField';

import { UsageProgressBar } from './UsageProgressBar';
import { UsageMetricCardStyles, useUsageMetricCardStyles } from './UsageMetricCardStyles';
import { type UsageProgressBarBaseStyles } from './UsageProgressBarStyles';
import { CustomButton } from '../core/custom-button/CustomButton';
import { CustomButtonIconProps } from '../core/custom-button/CustomButtonStyles';

export interface UsageMetricCardProps {
  title: string;
  description?: string;
  percent: number;
  barColor?: string;
  backgroundColor?: string;
  styles?: UsageMetricCardStyles;
  barStyles?: UsageProgressBarBaseStyles;
  actionItem?: ReactNode;
  actionItemOnPress?: () => void;
  actionItemTitle?: string;
  actionItemIcon?: (props: CustomButtonIconProps) => ReactNode;
}

export function UsageMetricCard(props: UsageMetricCardProps): ReactNode {
  const defaultStyles = useUsageMetricCardStyles();
  const styles = props.styles ?? defaultStyles;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <CustomTextField title={props.title} styles={styles.title} />
        {props.actionItem ??
          (props.actionItemOnPress && (
            <CustomButton
              title={props.actionItemTitle}
              styles={styles.actionItem}
              onPress={props.actionItemOnPress}
              leftIcon={props.actionItemIcon}
            />
          ))}
      </View>

      {props.description && <CustomTextField title={props.description} styles={styles.description} />}
      <UsageProgressBar
        percent={props.percent}
        barColor={props.barColor}
        backgroundColor={props.backgroundColor}
        style={styles.progressBar}
        barStyles={props.barStyles}
      />
    </View>
  );
}
