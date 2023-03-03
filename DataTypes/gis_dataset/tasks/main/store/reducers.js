// https://github.com/alexnm/re-ducks#reducers

import PublishStatus from "../../../constants/PublishStatus";

import * as uploadGisDatasetSelectors from "../../uploadGisDataset/store/selectors";

export const initialState = {
  damaSourceId: null,
  damaSourceName: null,
  damaSourceDisplayName: null,

  etlContextId: null,
  maxSeenEventId: null,

  // SubSlices
  uploadGisDatasetState: null,
  gisDatasetLayerState: null,
  gisDatasetLayerDatabaseSchemaState: null,

  publishStatus: PublishStatus.AWAITING,
  publishErrMsg: null,
};

export function init(source) {
  const state = {
    ...initialState,
    damaSourceId: source.source_id || null,
    damaSourceName: source.name || null,
    damaSourceDisplayName: source.display_name || null,
  };

  return state;
}

export default function reducer(state, action) {
  // console.log("==> createGisDatasource reducer:", { state, action });

  const { type, payload } = action;

  switch (type) {
    case "damaSourceName/UPDATE":
      return { ...state, damaSourceName: payload };

    case "damaSourceDisplayName/UPDATE":
      return { ...state, damaSourceDisplayName: payload };

    case "damaSourceId/UPDATE":
      return { ...state, damaSourceId: payload };

    case "etlContextId/UPDATE":
      return { ...state, etlContextId: payload };

    case "maxSeenEventId/UPDATE":
      return { ...state, maxSeenEventId: payload };

    case "uploadGisDataset:STATE_UPDATE": {
      const newState = { ...state, uploadGisDatasetState: payload };

      const uploadMaxSeenEventId =
        uploadGisDatasetSelectors.selectMaxSeenId(payload);

      newState.maxSeenEventId = Math.max(
        state.maxSeenEventId,
        uploadMaxSeenEventId
      );

      return newState;
    }

    case "selectGisDatasetLayer:STATE_UPDATE": {
      if (state.gisDatasetLayerState === payload) {
        return state;
      }

      return { ...state, gisDatasetLayerState: payload };
    }

    case "updateGisDatasetLayerDatabaseSchema:STATE_UPDATE": {
      if (state.gisDatasetLayerDatabaseSchemaState === payload) {
        return state;
      }

      return { ...state, gisDatasetLayerDatabaseSchemaState: payload };
    }

    case "publishStatus/UPDATE":
      return { ...state, publishStatus: payload };
    case "publishErrMsg/UPDATE":
      return { ...state, publishErrMsg: payload };

    default:
      return state;
  }
}
