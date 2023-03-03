import deepFreeze from "deep-freeze-strict";

import { assign, cloneDeep } from "lodash";

export const initialState = deepFreeze({
  layerNames: null,
  layerName: null,
  lyrAnlysErrMsg: null,
  layerAnalysis: null,
});

export function init(config) {
  const clone = cloneDeep(initialState);

  const state = assign(clone, config);

  return state;
}

export default function reducer(state, action) {
  const { type, payload } = action;

  switch (type) {
    case "layerNames/UPDATE":
      return { ...state, layerNames: payload };
    case "layerName/UPDATE":
      return { ...state, layerName: payload };
    case "layerAnalysis/UPDATE":
      return { ...state, layerAnalysis: payload };
    case "lyrAnlysErrMsg/UPDATE":
      return { ...state, lyrAnlysErrMsg: payload };

    default:
      return state;
  }
}
