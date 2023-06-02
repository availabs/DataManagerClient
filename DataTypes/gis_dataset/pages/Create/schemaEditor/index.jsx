import React, { useEffect } from "react";

import { GisDatasetLayerDatabaseDbSchemaForm } from "./components";

export default function UpdateGisDatasetLayerDatabaseDbSchema({
  state,
  dispatch,
}) {
  const {
    damaSourceId,
    damaServerPath,
    databaseColumnNames,
    gisUploadId,
    layerName,
  } = state;

  useEffect(() => {
    // if a source id exists, get table structure
    (async () => {
      if (damaSourceId && !databaseColumnNames) {
        const url = `${damaServerPath}/metadata/datasource-latest-view-table-columns?damaSourceId=${damaSourceId}`;
        const res = await fetch(url);
        let dbColNames = await res.json();
        dbColNames = dbColNames?.filter(
          (col) => col !== "wkb_geometry" && col !== "ogc_fid"
        );
        console.log("update_dbColName", dbColNames);
        dispatch({
          type: "update",
          payload: { databaseColumnNames: dbColNames },
        });
      }
    })();
  }, [databaseColumnNames, damaSourceId, damaServerPath, dispatch]);

  useEffect(() => {
    // get the table description of the uploaded dataset
    (async () => {
      // if updating source must wait for database columns
      if (
        (damaSourceId && !databaseColumnNames) ||
        !gisUploadId ||
        !layerName
      ) {
        return;
      }

      const tblDscRes = await fetch(
        `${damaServerPath}/staged-geospatial-dataset/${gisUploadId}/${layerName}/tableDescriptor`
      );

      const tblDsc = await tblDscRes.json();

      // if updating source, match to columns to upload columns
      if (damaSourceId) {
        const dbCols = new Set(databaseColumnNames);
        for (const row of tblDsc.columnTypes) {
          if (!dbCols.has(row.col)) {
            row.col = "";
          }
        }
      }

      return dispatch({ type: "update", payload: { tableDescriptor: tblDsc } });
    })();
  }, [
    damaSourceId,
    databaseColumnNames,
    gisUploadId,
    layerName,
    damaServerPath,
    dispatch,
  ]);

  if (damaSourceId && !databaseColumnNames) {
    return "";
  }

  return (
    <GisDatasetLayerDatabaseDbSchemaForm state={state} dispatch={dispatch} />
  );
}
