import React, { useContext, useEffect, useReducer, useRef } from "react";

import EtlContext, {
  EtlContextReact,
  useEtlContext,
} from "../../../../utils/EtlContext";
import reducer, * as store from "./store";

import {
  GisDatasetUploadErrorMessage,
  GisDatasetUploadButton,
  GisDatasetFileMeta,
} from "./components";

const {
  operations: { uploadGisDataset },
} = store;

export const taskName = "uploadGisDataset";

export default function UploadGisDataset() {
  const parentCtx = useContext(EtlContextReact);

  const [state, dispatch] = useReducer(
    reducer,
    // Fixme: maxSeenEventId belongs on damaEtlAdmin
    { maxSeenEventId: parentCtx.getState().maxSeenEventId || -1 },
    store.init
  );

  const { current: ctx } = useRef(
    new EtlContext({
      name: taskName,
      ...store,
      dispatch,
      parentCtx,
    })
  );

  ctx.setState(state);

  useEffect(() => {
    parentCtx.dispatch({
      type: `${taskName}:STATE_UPDATE`,
      payload: state,
    });
  }, [parentCtx, state]);

  const { etlContextId, fileUploadStatus, uploadedFile, uploadErrMsg } =
    useEtlContext(ctx);

  if (!etlContextId) {
    return "";
  }

  if (uploadErrMsg) {
    <GisDatasetUploadErrorMessage
      etlContextId={etlContextId}
      uploadErrMsg={uploadErrMsg}
    />;
  }

  if (!uploadedFile) {
    return (
      <GisDatasetUploadButton
        uploadGisDataset={uploadGisDataset.bind(null, ctx)}
      />
    );
  }

  return (
    <GisDatasetFileMeta
      uploadedFile={uploadedFile}
      fileUploadStatus={fileUploadStatus}
    />
  );
}
