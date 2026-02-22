import { Feather } from '@expo/vector-icons';
import React, { type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { CustomTextField } from '@/comp-lib/core/custom-text-field/CustomTextField';
import type { AllActionKeys } from '@shared/schema-types';
import { useNavigationAction } from './NavigationActionFunc';
import { useNavigationActionStyles } from './NavigationActionStyles';

export interface NavigationActionProps {
  actionType: AllActionKeys;
  description: string;
  onPress?: () => void;
}

export function NavigationAction(props: NavigationActionProps): ReactNode {
  const { styles } = useNavigationActionStyles();
  const { actionTitle, iconName } = useNavigationAction({ actionType: props.actionType });

  return (
    <Pressable style={styles.pressable} onPress={props.onPress}>
      <View style={styles.container}>
        {iconName && (
          <View style={styles.iconContainer}>
            <Feather name={iconName} size={14} color={styles.icon.backgroundColor} />
          </View>
        )}
        <View style={styles.content}>
          <CustomTextField title={actionTitle} styles={styles.titleText} />
          <CustomTextField title={props.description} styles={styles.descriptionText} />
        </View>
      </View>
    </Pressable>
  );
}
