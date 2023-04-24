import React, { useReducer, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectPgEnv } from "pages/DataManager/store";
import { useHistory } from "react-router-dom";
import { useFalcor, Input } from "modules/avl-components/src";

import { DAMA_HOST } from "config";

import { reducer } from "./components/reducer";

import UploadFileComp from "./uploadFile";
import SelectLayerComp from "./selectLayer";
import SchemaEditorComp from "./schemaEditor";
import PublishComp from "./publish";

const BlankComponent = () => <></>;

export default function UploadGisDataset({
  source = {},
  user = {},
  dataType = "gis_dataset",
  CustomAttributes = BlankComponent,
  customRules = { check: () => false, message: () => "" },
  databaseColumnNames = null,
}) {
  const { name: damaSourceName, source_id: sourceId, type } = source;
  const pgEnv = useSelector(selectPgEnv);
  const history = useHistory();
  const { falcor } = useFalcor();

  const [state, dispatch] = useReducer(reducer, {
    damaSourceId: sourceId,
    damaSourceName: damaSourceName,
    userId: 7,
    etlContextId: null,
    customViewAttributes: { years: [] },
    dataType: dataType,
    // maxSeenEventId: null,
    damaServerPath: `${DAMA_HOST}/dama-admin/${pgEnv}`,

    // uploadFile state
    gisUploadId: null,
    fileUploadStatus: null,
    uploadedFile: null,
    uploadErrMsg: null,
    polling: false,
    pollingInterval: null,

    // selectLayer state
    layerNames: null,
    layerName: null,
    lyrAnlysErrMsg: null,
    layerAnalysis: null,

    // schemaEditor state
    databaseColumnNames: databaseColumnNames,
    tableDescriptor: null,

    // publish state
    publishStatus: "AWAITING",
    publishErrMsg: null,

    // source
    sourceType: type,
  });

  useEffect(() => {
    dispatch({ type: "update", payload: { damaSourceName } });
  }, [damaSourceName]);

  useEffect(() => {
    dispatch({ type: "update", payload: { sourceType: type } });
  }, [type]);

  useEffect(() => {
    if (state.publishStatus === "PUBLISHED") {
      if (state.damaSourceId) {
        falcor.invalidate([
          "dama",
          pgEnv,
          "sources",
          "byId",
          state.damaSourceId,
          "views",
          "length",
        ]);
      } else {
        falcor.invalidate(["dama", pgEnv, "sources", "length"]);
      }
      history.push(`/source/${state.damaSourceId}/versions`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.publishStatus, state.damaSourceId, pgEnv, history]);

  useEffect(() => {
    // on page load get etl context
    // TODO :: probably want to move this to on file upload
    // currently it runs every refresh leaving orphaned contextIds
    (async () => {
      const newEtlCtxRes = await fetch(
        `${state.damaServerPath}/etl/new-context-id`
      );
      const newEtlCtxId = +(await newEtlCtxRes.text());
      dispatch({ type: "update", payload: { etlContextId: newEtlCtxId } });
    })();
  }, [pgEnv, state.damaServerPath]);

  if (!sourceId && !damaSourceName) {
    return <div> Please enter a datasource name.</div>;
  }

  // && !customRules?.isYearsValidate(state)
  if (!customRules?.isAllowToUpload(state) && type === "tig_sed") {
    return (
      <>
        <div className="bg-red-500 mt-2 p-3">
          <span> Please enter minimum 7 values </span>
        </div>
        <br />
        <CustomAttributes state={state} dispatch={dispatch} />
      </>
    );
  }
  if (customRules.check(state)) {
    return customRules.message(state);
  }

  return (
    <div>
      {customRules?.isAllowToUpload(state) && type === "tig_sed" ? (
        <CustomAttributes state={state} dispatch={dispatch} />
      ) : null}
      {customRules?.isYearsValidate(state) ? (
        <UploadFileComp state={state} dispatch={dispatch} />
      ) : null}

      <SelectLayerComp state={state} dispatch={dispatch} />
      <SchemaEditorComp state={state} dispatch={dispatch} />
      <PublishComp state={state} dispatch={dispatch} />
    </div>
  );
}
