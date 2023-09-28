import get from "lodash/get"
import { extent as d3extent } from "d3-array"

import { getColorRange } from "~/modules/avl-map-2/src"

import ckmeans from "~/pages/DataManager/utils/ckmeans";

const strictNaN = v => (v === null) || isNaN(v);
const ordinalSort = (a, b) => {
  return String(a).localeCompare(String(b));
}

const calcDomain = (type, data, length) => {
  const values = data.map(d => strictNaN(d.value) ? d.value : +d.value);
  switch (type) {
    case "threshold": {
      return ckmeans(values, length || 7).slice(1);
    }
    case "ordinal":
      return [...new Set(values)].sort(ordinalSort);
    default:
      return values;
  }
}
const calcRange = (type, length, color, reverse) => {
  switch (type) {
    case "threshold":
      return getColorRange(length ? length + 1 : 7, color, reverse);
    case "ordinal":
      return getColorRange(Math.min(12, length), color, reverse);
    default:
      return getColorRange(7, color, reverse);
  }
}

const createLegend = (variable, data = []) => {
  if (!data.length) {
    return null;
  }

  const {
    type: vt,
    displayName,
    scale = {}
  } = variable;

  const {
    range = [],
    format = ".2s",
    type = vt === "data-variable" ? "quantile" : "ordinal",
    color = vt === "data-variable" ? "BrBG" : "Set3",
    reverse = false
  } = scale;

  const legend = {
    range,
    format,
    type,
    color,
    reverse,
    name: displayName
  };

  legend.domain = calcDomain(type, data, range.length);

  if (!legend.range.length) {
    legend.range = calcRange(type, legend.domain.length, color, reverse);
  }

  return legend;
}
export default createLegend;
