import React, {useState, useMemo, useEffect} from "react";
import get from "lodash/get";
import set from "lodash/set";
import { filters, updateSubMeasures, getMeasure } from "./updateFilters";
import { DAMA_HOST } from '~/config'
import { measure_info } from "./measures";
import { Button, Modal } from "~/modules/avl-components/src";
import { DamaContext } from "../../../store";
import { CMSContext } from "~/modules/dms/src";
import { PM3_LAYER_KEY } from "./constants";
import {CheckCircleIcon, XCircleIcon} from "@heroicons/react/20/solid/index.js";
const INITIAL_MODAL_STATE = {
    open: false,
    loading: false,
    columns: [],
    uniqueFileNameBase: ''
}
const INITIAL_DELETE_MODAL_STATE = {
  open: false,
  loading: false,
}

//creates a unique identifier regardless of how many columns the user selects
async function hashString(inputString) {
  // 1. Encode the string to a Uint8Array
  const encoder = new TextEncoder();
  const data = encoder.encode(inputString);

  // 2. Hash the data with SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // 3. Convert the ArrayBuffer to a 64-character hexadecimal string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return hashHex;
}

const Comp = ({ state, setState }) => {
  /**
   * START MODAL STUFF
   */
  const dctx = React.useContext(DamaContext);
  const cctx = React.useContext(CMSContext);
  const ctx = dctx?.falcor ? dctx : cctx;
  let { falcor, falcorCache, pgEnv, baseUrl, user } = ctx;
  if (!falcorCache) {
    falcorCache = falcor.getCache();
  }
  const [modalState, setModalState] = useState(INITIAL_MODAL_STATE);

  let symbologyLayerPath = "";
  let symbPath = "";
  if (state.symbologies) {
    const symbName = Object.keys(state.symbologies)[0];
    const pathBase = `symbologies['${symbName}']`;
    symbologyLayerPath = `${pathBase}.symbology.layers`;

    symbPath = `${pathBase}.symbology`;
  } else {
    symbologyLayerPath = `symbology.layers`;
    symbPath = `symbology`;
  }

  const pluginDataPath = `${symbPath}['pluginData']['macroview']`;

  const {viewId, sourceId, geography } = useMemo(() => {
    const pm3LayerId = get(state, `${pluginDataPath}['active-layers']['${PM3_LAYER_KEY}']`, null);

    return {
      viewId: get(state, `${pluginDataPath}['viewId']`, null),
      sourceId: get(state, `${symbologyLayerPath}['${pm3LayerId}']['source_id']`, null),
      geography: get(state, `${pluginDataPath}['geography']`, null),
    }
  }, [state])


  const setColumns = (columnName) => {
      let newColumns;
      if(Array.isArray(columnName)){
          newColumns = columnName;
      }
      else if(modalState.columns.includes(columnName)){
          newColumns = modalState.columns.filter(colName => colName !== columnName)
      }
      else{
          newColumns = [...modalState.columns];
          newColumns.push(columnName);
      }

      setModalState({...modalState, columns: newColumns})
  }
  const setModalOpen = (newModalOpenVal) => setModalState({...modalState, open: newModalOpenVal});

  const view = useMemo(() => {
    return get(
      falcorCache,
      [
        "dama",
        pgEnv,
        "views",
        "byId",
        viewId,
        "attributes",
      ],
      []
    );
  }, [falcorCache, viewId]);
  const viewDownloads = useMemo(() => {
    return get(view, ['metadata', 'value', 'download'])
  }, [view]);

  const fileNameBase = useMemo(() => {
    let nameBase = "";
    if(modalState.columns.length > 0) {
      const joinedCols = modalState.columns.sort().join("_");
      nameBase = `${view?.version ?? viewId}_${joinedCols}`;
    }

    if (geography) {
      geography.forEach((geoFilt) => {
        nameBase += `_${geoFilt.type}_${geoFilt.value}`;
      });
    }
    return nameBase;
  }, [modalState.columns, geography, view, viewId]) 
  useEffect(() => {
    const getUniqueFileNameBase = async () => {
      const uniqueFileNameBase = await hashString(fileNameBase);
      setModalState(({...modalState, uniqueFileNameBase}))
    }

    getUniqueFileNameBase()
  }, [fileNameBase])

  const downloadAlreadyExists = useMemo(() => {
    return Object.keys(viewDownloads || {}).includes(modalState.uniqueFileNameBase);
  }, [viewDownloads, modalState.uniqueFileNameBase])

  const createDownload = () => {
      const runCreate = async () => {
      if(!downloadAlreadyExists) {
          try {
            //IF WE HAVE GEOMETRY SELECTED, PASS IT HERE
              const createData = {
                  source_id: sourceId,
                  view_id: viewId,
                  columns: modalState.columns,
                  user_id: user.id,
                  email: user.email,
                  downloadProps:{
                    geographyFilter: geography,
                    measure,
                  },
                  fileTypes:['CSV']
              };

              setModalState({...modalState, loading: true});
              const res = await fetch(`${DAMA_HOST}/dama-admin/${pgEnv}/gis-dataset/create-download`,
                  {
                      method: "POST",
                      body: JSON.stringify(createData),
                      headers: {
                          "Content-Type": "application/json",
                      },
                  });

              await res.json();
              setModalState(INITIAL_MODAL_STATE);
          } catch (err) {
              console.log(err)
              setModalState({...modalState, loading: false, open: true});
          }
        }
      }

      runCreate();
  }

  useEffect(() => {
    falcor.get([
      "dama",
      pgEnv,
      "sources",
      "byId",
      sourceId,
      "attributes",
      "metadata",
    ]);
  }, [sourceId]);

  useEffect(() => {
    falcor.get([
      "dama",
      pgEnv,
      "views",
      "byId",
      viewId,
      "attributes",
      ["metadata", "version"],
    ]);
  }, [viewId]);

  const sourceDataColumns = useMemo(() => {
      let sourceColumns = get(falcorCache, [
          "dama",
          pgEnv,
          "sources",
          "byId",
          sourceId,
          "attributes",
          "metadata",
          "value",
      ],[]);
      // console.log('source columnns', sourceColumns, view.source_id, falcorCache)
      sourceColumns = sourceColumns?.columns ? sourceColumns.columns : sourceColumns;
      return Array.isArray(sourceColumns) ? sourceColumns.map(d => d.name) : []
      // return []
  }, [falcorCache, viewId]);
  /**
   * END MODAL STUFF
   */


  let layerPluginDataPath = "";
  if (!state.symbologies) {
    layerPluginDataPath = `symbology.pluginData['macroview']`;
  } else {
    const symbName = Object.keys(state.symbologies)[0];
    layerPluginDataPath = `symbologies['${symbName}'].symbology.pluginData['macroview']`;
  }

  const measureFilters = get(
    state,
    `${layerPluginDataPath}['measureFilters']`,
    filters
  );

  const measure = getMeasure(measureFilters);

  let measureDefintion = "",
    measureEquation = "";
  if (measure.includes("lottr")) {
    //definition needs period
    const { definition: definitionFunction, equation: equationFunction } =
      measure_info["lottr"];
    const curPeriod = measureFilters["peakSelector"].value;
    measureDefintion = definitionFunction({ period: curPeriod });
    measureEquation = equationFunction();
  } else if (measure.includes("tttr")) {
    const { definition: definitionFunction, equation: equationFunction } =
      measure_info["tttr"];
    //equation needs period
    const curPeriod = measureFilters["peakSelector"].value;
    measureDefintion = definitionFunction();
    measureEquation = equationFunction({ period: curPeriod });
  } else if (measure.includes("phed") || measure.includes("ted")) {
    const { definition: definitionFunction, equation: equationFunction } =
      measure_info["phed"];
    //definition needs freeflow and trafficType
    const curFreeflow = measureFilters["freeflow"].value
      ? "the freeflow speed"
      : "the posted speed limit";
    const curTrafficType = measureFilters["trafficType"].value;
    measureDefintion = definitionFunction({
      freeflow: curFreeflow,
      trafficType: curTrafficType,
    });
    measureEquation = equationFunction();
  } else if (measure.includes("speed")) {
    const { definition: definitionFunction, equation: equationFunction } =
      measure_info["speed"];
    //definition needs period
    // const curPeriod = measureFilters['peakSelector'].value;
    const curPercentile = measureFilters["percentiles"]?.value;
    measureDefintion = definitionFunction({ percentile: curPercentile });
    measureEquation = equationFunction();
  }

  const displayInfo = measureDefintion.length > 0 || measureEquation.length;


  return (
    displayInfo && (
      <div
        className="flex flex-col pointer-events-auto drop-shadow-lg p-4 bg-white/75"
        style={{
          position: "absolute",
          top: "94px",
          right: "-168px",
          color: "black",
          width: "318px",
          maxHeight: "325px",
        }}
      >
        <div className="flex flex-col border-b-2 border-black">
          {measureDefintion.length > 0 && (
            <div className="m-2  pb-2 px-1">
              <div className="font-semibold text-lg">Measure Definition</div>
              <div className="font-semibold text-sm">{measureDefintion}</div>
            </div>
          )}
          {measureEquation.length > 0 && (
            <div className="m-2  pb-2 px-1">
              <div className="font-semibold text-lg">Equation</div>
              <div className="font-semibold text-sm">{measureEquation}</div>
            </div>
          )}
        </div>
        <div>
          <Button
            themeOptions={{ color: "transparent" }}
            //className='bg-white hover:bg-cool-gray-700 font-sans text-sm text-npmrds-100 font-medium'
            onClick={(e) => {
              setModalState({...modalState, open: true, columns:['tmc', measure]})
            }}
            style={{ width: "100%", marginTop: "10px" }}
          >
            Open Data Downloader
          </Button>
        </div>
        <Modal
          open={modalState.open}
          setOpen={setModalOpen}
          themeOptions={{ overlay: 'none', size: "xlarge" }}
        >
          <div className="flex items-center m-1 pt-[600px] w-[110%]">
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
              <i
                className="fad fa-layer-group text-blue-600"
                aria-hidden="true"
              />
            </div>
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
              <div className="text-lg align-center font-semibold leading-6 text-gray-900">
                Create Data Download
              </div>
            </div>
          </div>
          <div>
            <DownloadModalCheckboxGroup
              title={"Columns"}
              options={sourceDataColumns}
              modalState={modalState.columns}
              onChange={setColumns}
            />
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              disabled={
                modalState.loading ||
                modalState.columns.length === 0 ||
                modalState.columns.some((colName) => colName.includes(" "))
              }
              className="disabled:bg-slate-300 disabled:cursor-warning inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto m-1"
              onClick={downloadAlreadyExists ?() => {} : createDownload}
            >
              {downloadAlreadyExists ? <a
                      href={viewDownloads[modalState.uniqueFileNameBase].replace('$HOST', `${DAMA_HOST}`)}
                  >
                      Download data
                  </a> : modalState.loading
                ? "Sending request..."
                : "Start download creation"}
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto m-1"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
          </div>
        </Modal>
      </div>
    )
  );
};

export { Comp };

const DownloadModalCheckboxGroup = ({
  options,
  modalState,
  onChange,
  title,
}) => {
  const hasCalcColumn =
    options.some((opt) => opt.includes(" ")) && title === "Columns";
  return (
    <div className="mt-3 text-center sm:ml-2 sm:mt-0 sm:text-left max-h-[700px] overflow-y-auto">
      <div className="flex w-full justify-between items-center w-1/2 text-md leading-6 text-gray-900">
        <div className="text-center h-fit">{title}:</div>
        <div>
          <Button
            themeOptions={{ size: "sm" }}
            onClick={() => {
              if (modalState.length === options.length) {
                onChange([]);
              } else {
                onChange([...options]);
              }
            }}
          >
            Toggle All
          </Button>
        </div>
      </div>
      <div className="flex mt-2 text-sm items-center">
        One or more must be selected
        {modalState.length > 0 ? (
          <CheckCircleIcon className="ml-2 text-green-700 h-4 w-4" />
        ) : (
          <XCircleIcon className="ml-2 text-red-700 h-4 w-4" />
        )}
      </div>
      {hasCalcColumn ? (
        <div className="flex mt-1 text-xs items-center">
          (cannot include "Calculated Columns")
        </div>
      ) : (
        ""
      )}
      {options?.map((option) => (
        <DownloadModalCheckbox
          key={`${option}_checkbox`}
          inputName={option}
          checked={modalState.includes(option)}
          onChange={onChange}
          disabled={hasCalcColumn && option.includes(" ")}
        />
      ))}
    </div>
  );
};

const DownloadModalCheckbox = ({
  inputName,
  checked,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="mt-2 flex items-center text-sm">
      <input
        id={inputName}
        disabled={disabled}
        name={inputName}
        type="checkbox"
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        checked={checked}
        onChange={() => onChange(inputName)}
      />
      <label htmlFor={inputName} className="ml-2 text-xs text-gray-900">
        {inputName}
      </label>
    </div>
  );
};
