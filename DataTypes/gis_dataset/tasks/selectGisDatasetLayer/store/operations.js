// FIXME: These functions should probably get all their props from the ctx.
//        However, if an operation is used in an useEffect hook,
//          then the hook's dependencies array must contain the operation's deps.
//        Not sure how to resolve this at the moment.

import { checkApiResponse } from "../../../utils/api";

export const getLayerNames = async (ctx, gisUploadId) => {
  const {
    actions: { updateLayerNames, updateLyrAnlysErrMsg },
    dispatch,
    meta: { rtPfx },
  } = ctx;

  try {
    const url = `${rtPfx}/staged-geospatial-dataset/${gisUploadId}/layerNames`;
    const layerNamesRes = await fetch(url);

    await checkApiResponse(layerNamesRes);

    const layerNames = await layerNamesRes.json();

    dispatch(updateLayerNames(layerNames));
  } catch (err) {
    console.error(err);
    dispatch(updateLyrAnlysErrMsg(err.message));
  }
};

export const selectLayer = async (ctx, layerName) => {
  const {
    actions: { updateLayerName },
    dispatch,
  } = ctx;

  dispatch(updateLayerName(layerName));
};

export const getLayerAnalysis = async (ctx, gisUploadId, layerName) => {
  const {
    actions: { updateLayerAnalysis, updateLyrAnlysErrMsg },
    dispatch,
    meta: { rtPfx },
  } = ctx;

  if (gisUploadId && layerName) {
    try {
      const lyrAnlysRes = await fetch(
        `${rtPfx}/staged-geospatial-dataset/${gisUploadId}/${layerName}/layerAnalysis`
      );

      await checkApiResponse(lyrAnlysRes);
      const lyrAnlys = await lyrAnlysRes.json();

      dispatch(updateLayerAnalysis(lyrAnlys));
    } catch (err) {
      console.error(err);
      dispatch(updateLyrAnlysErrMsg(err.message));
    }
  }
};
