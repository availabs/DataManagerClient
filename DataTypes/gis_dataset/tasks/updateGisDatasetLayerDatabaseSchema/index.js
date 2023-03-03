import React, {
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";

import EtlContext, {
  useEtlContext,
  EtlContextReact,
} from "../../../../utils/EtlContext";

import { checkApiResponse } from "../../utils/api";

import reducer, * as store from "./store";

import { GisDatasetLayerDatabaseDbSchemaForm } from "./components";

const {
  actions: { updateTableDescriptor, updateDatabaseColumnNames },
} = store;

export const taskName = "updateGisDatasetLayerDatabaseSchema";

export default function UpdateGisDatasetLayerDatabaseDbSchema() {
  const parentCtx = useContext(EtlContextReact);

  // FIXME: Could a useEtlContext hook take the store as it's only parameter
  //          * and internally call useReducer to create the state
  //          * and wrap
  //                      * useRef,
  //                      * setState,
  //                      * parentCtx.dispatch STATE_UPDATE
  //                      * useEtlContext
  //        Could the useEtlContext hook call useContext ?
  const [state, dispatch] = useReducer(reducer, null, store.init);

  const { current: ctx } = useRef(
    new EtlContext({
      name: taskName,
      ...store,
      dispatch,
      parentCtx,
    })
  );

  ctx.setState(state);

  const {
    meta: { rtPfx },
  } = parentCtx;

  // FIXME: Could/Should this go in the ctx.setState method?
  useEffect(() => {
    parentCtx.dispatch({
      type: `${taskName}:STATE_UPDATE`,
      payload: state,
    });
  }, [parentCtx, state]);

  const { damaSourceId, databaseColumnNames, gisUploadId, layerName } =
    useEtlContext(ctx);

  // FIXME: isCreatingNew should be set using root EtlContext's reducer's init function.
  const [isCreatingNew] = useState(!damaSourceId);

  const gisDatasetUploadedAndAnalyzed = gisUploadId && layerName;

  const mustAwaitDbColNames = !(
    isCreatingNew || Array.isArray(databaseColumnNames)
  );

  const ready = !mustAwaitDbColNames && gisDatasetUploadedAndAnalyzed;

  useEffect(() => {
    (async () => {
      if (mustAwaitDbColNames) {
        const url = new URL(
          `${rtPfx}/metadata/datasource-latest-view-table-columns`
        );
        url.searchParams.append("damaSourceId", damaSourceId);

        const res = await fetch(url);

        await checkApiResponse(res);

        let dbColNames = await res.json();

        dbColNames = dbColNames.filter(
          (col) => col !== "wkb_geometry" && col !== "ogc_fid"
        );

        dispatch(updateDatabaseColumnNames(dbColNames));
      }
    })();
  }, [rtPfx, mustAwaitDbColNames, damaSourceId]);

  useEffect(() => {
    (async () => {
      dispatch(updateTableDescriptor(null));

      if (!ready) {
        return;
      }

      const tblDscRes = await fetch(
        `${rtPfx}/staged-geospatial-dataset/${gisUploadId}/${layerName}/tableDescriptor`
      );

      await checkApiResponse(tblDscRes);

      const tblDsc = await tblDscRes.json();

      if (!isCreatingNew) {
        const dbCols = new Set(databaseColumnNames);

        for (const row of tblDsc.columnTypes) {
          if (!dbCols.has(row.col)) {
            row.col = "";
          }
        }
      }

      return dispatch(updateTableDescriptor(tblDsc));
    })();
  }, [
    rtPfx,
    ready,
    isCreatingNew,
    databaseColumnNames,
    gisUploadId,
    layerName,
  ]);

  if (!ready) {
    return "";
  }

  return (
    <EtlContextReact.Provider value={ctx}>
      <GisDatasetLayerDatabaseDbSchemaForm />
    </EtlContextReact.Provider>
  );
}
