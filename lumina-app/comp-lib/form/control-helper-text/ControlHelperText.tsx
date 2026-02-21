import { type ReactNode } from 'react';
import { useControlHelperTextStyles } from './ControlHelperTextStyles';
import { CustomTextField } from '@/comp-lib/core/custom-text-field/CustomTextField';

export interface ControlHelperTextProps {
  title: string;
}

export function ControlHelperText(props: ControlHelperTextProps): ReactNode {
  const styles = useControlHelperTextStyles();

  return <CustomTextField styles={styles.title} title={props.title} />;
}
