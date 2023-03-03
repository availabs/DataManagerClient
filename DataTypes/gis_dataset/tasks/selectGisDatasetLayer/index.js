import React, { useContext, useEffect, useReducer, useRef } from "react";

import EtlContext, {
  useEtlContext,
  EtlContextReact,
} from "../../../../utils/EtlContext";

import reducer, * as store from "./store";

import { LayerSelector, LayerAnalysisSection } from "./components";

const {
  operations: { getLayerNames, getLayerAnalysis },
} = store;

export default function SelectGisDatasetLayer() {
  const parentCtx = useContext(EtlContextReact);

  const [state, dispatch] = useReducer(reducer, null, store.init);

  const { current: ctx } = useRef(
    new EtlContext({
      name: "SelectGisDatasetLayer",
      ...store,
      dispatch,
      parentCtx,
    })
  );

  ctx.setState(state);

  useEffect(() => {
    parentCtx.dispatch({
      type: "selectGisDatasetLayer:STATE_UPDATE",
      payload: state,
    });
  }, [parentCtx, state]);

  const { gisUploadId, uploadedFile, layerNames, layerName } =
    useEtlContext(ctx);

  useEffect(() => {
    if (gisUploadId && uploadedFile) {
      getLayerNames(ctx, gisUploadId);
    }
  }, [ctx, gisUploadId, uploadedFile]);

  useEffect(() => {
    if (gisUploadId && layerName) {
      getLayerAnalysis(ctx, gisUploadId, layerName);
    }
  }, [ctx, gisUploadId, layerName]);

  if (!layerNames) {
    return "";
  }

  return (
    <EtlContextReact.Provider value={ctx}>
      <LayerSelector />
      <LayerAnalysisSection />
    </EtlContextReact.Provider>
  );
}
