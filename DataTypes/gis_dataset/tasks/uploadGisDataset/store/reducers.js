import deepFreeze from "deep-freeze-strict";

import cloneDeep from "lodash.clonedeep";
import assign from "lodash.assign";

export const initialState = deepFreeze({
  gisUploadId: null,
  fileUploadStatus: null,
  maxSeenEventId: null,
  uploadedFile: null,
  uploadErrMsg: null,
});

export function init(config) {
  const clone = cloneDeep(initialState);

  const state = assign(clone, config);

  return state;
}

export default function reducer(state, action) {
  const { type, payload } = action;

  switch (type) {
    case "gisUploadId/UPDATE":
      return { ...state, gisUploadId: payload };

    case "fileUploadStatus/UPDATE":
      const { type: damaEventType } = payload;
      const status = /FINISH_GIS_FILE_UPLOAD$/.test(damaEventType)
        ? "FINAL"
        : "IN_PROGRESS";

      return { ...state, status, fileUploadStatus: payload };

    case "maxSeenEventId/UPDATE":
      return { ...state, maxSeenEventId: payload };

    case "uploadedFile/UPDATE": {
      return { ...state, uploadedFile: payload };
    }

    case "uploadErrMsg/UPDATE":
      return { ...state, status: "FINAL", uploadErrMsg: payload };

    default:
      return state;
  }
}
