import { range as d3range } from "d3-array"

export const myrange = (min, max, step = 1) => {
  const mult = 1000.0;
  const m1 = Math.trunc(min * mult);
  const m2 = Math.trunc(max * mult);
  const s = Math.trunc(step * mult);
  return d3range(m1, m2 + s, s).map(v => v / mult);
}
