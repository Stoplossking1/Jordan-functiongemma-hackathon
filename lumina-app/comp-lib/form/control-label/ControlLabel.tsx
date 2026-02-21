import { type ReactNode } from 'react';
import { useControlLabelStyles } from './ControlLabelStyles';
import { CustomTextField } from '@/comp-lib/core/custom-text-field/CustomTextField';

export interface ControlLabelProps {
  title: string;
}

export function ControlLabel(props: ControlLabelProps): ReactNode {
  const styles = useControlLabelStyles();

  return <CustomTextField styles={styles.title} title={props.title} />;
}
