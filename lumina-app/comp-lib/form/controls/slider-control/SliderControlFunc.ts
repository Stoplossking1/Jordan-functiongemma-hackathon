import { FormControlProps } from '../../FormControl';
import { formatValueByStep } from '../../utils';

export interface SliderControlFunc {
  handleSliderChange: (val: number) => void;
}

export function useSliderControl(props: FormControlProps): SliderControlFunc {
  function handleSliderChange(val: number) {
    const value = formatValueByStep(val, props.dataType, props.steps);
    props.onValueChange(value);
  }

  return {
    handleSliderChange,
  };
}
