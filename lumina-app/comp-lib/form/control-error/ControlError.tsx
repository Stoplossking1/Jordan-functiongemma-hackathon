import { type ReactNode } from 'react';
import { useControlErrorStyles } from './ControlErrorStyles';
import { CustomTextField } from '@/comp-lib/core/custom-text-field/CustomTextField';
import { View } from 'react-native';

export interface ControlErrorProps {
  title?: string;
}

export function ControlError(props: ControlErrorProps): ReactNode {
  const styles = useControlErrorStyles();

  return (
    <View style={styles.container}>
      <CustomTextField styles={styles.title} title={props.title ?? ''} />
    </View>
  );
}
