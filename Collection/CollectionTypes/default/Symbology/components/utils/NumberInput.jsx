import React from "react"

import { format as d3format } from "d3-format"

import {
  Input,
  useTheme,
  strictNaN
} from "~/modules/avl-map-2/src";

const integerFormat = d3format(",d");
const floatFormat = d3format(",.2f");

const isInteger = num => num === Math.trunc(num);

export const NumberInput = React.forwardRef(({ value, onChange, ...props }, ref) => {
  const doOnChange = React.useCallback(v => {
    const temp = v.replace(/[,]/g, "");
    if (!strictNaN(+temp)) {
      onChange(temp.trim());
    }
  }, [onChange]);

  const valueFormat = React.useMemo(() => {
    const asNum = +value.replace(",", "");
    return isInteger(asNum) ? integerFormat : floatFormat;
  }, [value]);

  return (
    <Input { ...props } ref={ ref }
      value={ valueFormat(value) }
      onChange={ doOnChange }/>
  )
})
