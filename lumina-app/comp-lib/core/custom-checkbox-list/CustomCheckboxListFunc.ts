import { type CustomCheckboxListProps } from './CustomCheckboxList';

export interface CustomCheckboxListFunc<T extends string | number> {
  toggleValue: (value: T) => void;
}

export function useCustomCheckboxList<T extends string | number>(
  props: CustomCheckboxListProps<T>,
): CustomCheckboxListFunc<T> {
  function toggleValue(value: T) {
    if (!props.onChange) return;
    const newSelected = props.selectedValues?.includes(value)
      ? props.selectedValues.filter((v) => v !== value)
      : [...(props.selectedValues ?? []), value];
    props.onChange(newSelected);
  }

  return { toggleValue };
}
