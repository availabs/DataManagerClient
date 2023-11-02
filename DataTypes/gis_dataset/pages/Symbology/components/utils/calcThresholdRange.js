import get from "lodash/get"
import { extent as d3extent } from "d3-array"

import { getColorRange } from "~/modules/avl-map-2/src"

import { myrange } from "./myrange"

export const calcThresholdRange = props => {
  const domainLength = get(props, ["domain", "length"], 0);
  if (!domainLength) return [];
  const { range, color, reverse } = props;

  if (color === "custom") {
    return range;
  }
  else if (color) {
    return {
      range: getColorRange(domainLength + 1, color, reverse)
    }
  }

  const [min, max] = d3extent(range);
  const step = Math.round(((max - min) / domainLength) * 100000) / 100000;

  return {
    range: myrange(min, max, step),
    step
  }
}
