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

  const isAlreadyExist = (index, years) => {
    const selectedElement = years[index];
    for (let i = 0; i < years.length; i++) {
      if (i !== index && Number(years[i]) === Number(selectedElement)) {
        return true;
      }
    }
    return false;
  };

  const setAddNewColumn = () => {
    const newYear = Math.max(Math.max(...years), 1995);
    years = [...years, `${newYear + 5}`];
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

      <div className="grid grid-cols-3 gap-4 my-2">
        {years &&
          (years || []).map((year, i) => (
            <>
              <div key={i} className="pt-2 pr-8">
                <Input
                  type="number"
                  className="p-2 flex-1 px-2 shadow bg-grey-50 focus:bg-blue-100 border-gray-300 "
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
                <br />
                {isAlreadyExist(i, years) ? (
                  <span className="text-rose-800">
                    Year is already available
                  </span>
                ) : null}
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
  customRules = null,
}) {
  console.log("====================================");
  console.log("source", source);
  console.log("====================================");
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
