import { useState } from 'react';

import { CustomTextInputProps } from './CustomTextInput';

interface CustomTextInputFunc {
  isFocused: boolean;
  setIsFocused: (isFocused: boolean) => void;
}

export function useCustomTextInput(props: CustomTextInputProps): CustomTextInputFunc {
  const [isFocused, setIsFocused] = useState<boolean>(false);

  return {
    isFocused,
    setIsFocused,
  };
}
