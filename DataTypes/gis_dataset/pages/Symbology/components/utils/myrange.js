import { range as d3range } from "d3-array"

const mult = 1000000.0;

export const myrange = (min, max, step = 1) => {
  const m1 = Math.trunc(min * mult);
  const m2 = Math.trunc(max * mult);
  const s = Math.trunc(step * mult);

  const range = [];
  let value = m1;
  while (value <= m2) {
    range.push(value);
    value += s;
  }
  range.splice(range.length - 1, 1, m2);

  return range.map(v => Math.trunc(v) / mult);
}
