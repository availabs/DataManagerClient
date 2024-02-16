import get from "lodash/get"

import { strictNaN } from "~/modules/avl-map-2/src"

import ckmeans from "~/pages/DataManager/utils/ckmeans"

const ordinalSort = (a, b) => {
  return String(a).localeCompare(String(b));
}
export const calcDomain = (variable, scale, data) => {
  if (!variable || !scale) return [];
  const { variableId: vid } = variable;
  const { type, range = [] } = scale;
  const values = data.map(d => strictNaN(d[vid]) ? d[vid] : +d[vid])
    .filter(v => (v !== "") && (v !== null) && (v !== "null"));
  if (!values.length) return [];
  switch (type) {
    case "threshold": {
      return ckmeans(values, range.length || 7).slice(1);
    }
    case "ordinal":
      return [...new Set(values)].sort(ordinalSort);
    default:
      return values;
  }
}
