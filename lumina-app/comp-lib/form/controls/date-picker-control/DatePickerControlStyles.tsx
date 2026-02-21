import type { DateTimePickerProps } from 'react-native-modal-datetime-picker';
import type { IOSNativeProps } from '@react-native-community/datetimepicker';

type IOSStyleProps = Pick<IOSNativeProps, 'accentColor' | 'textColor' | 'themeVariant'>;

type ModalStyleProps = Pick<
  DateTimePickerProps,
  | 'backdropStyleIOS'
  | 'buttonTextColorIOS'
  | 'modalStyleIOS'
  | 'pickerComponentStyleIOS'
  | 'pickerContainerStyleIOS'
  | 'pickerStyleIOS'
>;

export type DatePickerControlStyles = Partial<IOSStyleProps & ModalStyleProps>;
