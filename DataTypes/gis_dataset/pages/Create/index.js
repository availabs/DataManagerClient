import React, { useReducer, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectPgEnv } from "pages/DataManager/store";
import { useHistory } from "react-router-dom";
import { useFalcor, Input } from "modules/avl-components/src";

// import {  useParams } from "react-router-dom";

import get from "lodash/get";

import { DAMA_HOST } from "config";

import { reducer } from "./components/reducer";

import UploadFileComp from "./uploadFile";
import SelectLayerComp from "./selectLayer";
import SchemaEditorComp from "./schemaEditor";
import PublishComp from "./publish";

const BlankComponent = ({ state, dispatch }) => {
  let {
    customViewAttributes: { years },
  } = state || {};

  const setOnChange = (value, index) => {
    const updatedYears = [...years];
    updatedYears[index] = value;
    years = updatedYears;
    dispatch({ type: "update", payload: { customViewAttributes: { years } } });
  };

  const setAddNewColumn = () => {
    years = [...years, 2000];
    dispatch({ type: "update", payload: { customViewAttributes: { years } } });
  };

  const setDeleteColumn = (ind) => {
    years?.splice(ind, 1);
    dispatch({ type: "update", payload: { customViewAttributes: { years } } });
  };

  return (
    <>
      <button
        onClick={() => setAddNewColumn()}
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
      >
        Add a new year{" "}
        <span className="my-2 mx-2 cursor-pointer">
          <i class="fa fa-plus" />
        </span>
      </button>

      <div className="grid grid-cols-3 gap-4 my-3">
        {years &&
          (years || []).map((year, i) => (
            <>
              <div key={i} className="pt-3 pr-8">
                <Input
                  type="number"
                  className="p-2 flex-1 px-2 shadow bg-grey-50 focus:bg-blue-100  border-gray-300 "
                  value={year}
                  onChange={(val) => setOnChange(val, i)}
                />
                <>
                  <button
                    onClick={() => setDeleteColumn(i)}
                    class="mx-3 my-3 text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-300 font-medium rounded-full text-sm px-5 py-2.5 text-center mr-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
                  >
                    <span className=" cursor-pointer">
                      <i class="fa fa-trash" />
                    </span>
                  </button>
                </>
              </div>
            </>
          ))}
      </div>
    </>
  );
};

export default function UploadGisDataset({
  source = {},
  user = {},
  CustomAttributes = BlankComponent,
  databaseColumnNames = null,
}) {
  const { name: damaSourceName, source_id: sourceId } = source;
  const userId = get(user, `id`, null);
  const pgEnv = useSelector(selectPgEnv);
  const history = useHistory();
  const { falcor } = useFalcor();

  const [state, dispatch] = useReducer(reducer, {
    damaSourceId: sourceId,
    damaSourceName: damaSourceName,
    userId: 7,
    etlContextId: null,
    customViewAttributes: { years: [] },
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
  });

  useEffect(() => {
    dispatch({ type: "update", payload: { damaSourceName } });
  }, [damaSourceName]);

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

  if (state?.customViewAttributes?.years?.length < 7) {
    return (
      <>
        Please enter minimum 7 values <br />
        <CustomAttributes state={state} dispatch={dispatch} />
      </>
    );
  }

  return (
    <div>
      <div>
        <CustomAttributes state={state} dispatch={dispatch} />
        <UploadFileComp state={state} dispatch={dispatch} />
        <SelectLayerComp state={state} dispatch={dispatch} />
        <SchemaEditorComp state={state} dispatch={dispatch} />
        <PublishComp state={state} dispatch={dispatch} />
      </div>
      {/*<div>
        <pre>
            {JSON.stringify({state},null,3)}
        </pre>
      </div>*/}
    </div>
  );
}
