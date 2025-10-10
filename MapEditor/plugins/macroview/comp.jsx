import React, {useState, useMemo, useEffect} from "react";
import get from "lodash/get";
import set from "lodash/set";
import { filters, getMeasure } from "./updateFilters";
import { DAMA_HOST } from '~/config'
import { measure_info } from "./measures";
import { Button } from "~/modules/avl-components/src";
import { DamaContext } from "../../../store";
import { CMSContext } from "~/modules/dms/src";
import { PM3_LAYER_KEY } from "./constants";
import { MultiLevelSelect } from "~/modules/avl-map-2/src"
import {CheckCircleIcon, XCircleIcon} from "@heroicons/react/20/solid/index.js";
const INITIAL_MODAL_STATE = {
    open: false,
    loading: false,
    columns: [],
    uniqueFileNameBase: '',
    fileType:"GPKG",
    downloadContextId: ''
}
const INITIAL_DELETE_MODAL_STATE = {
  open: false,
  loading: false,
}
const metaColumnNames = [
  "ogc_fid",
  "tmc",
  "urban_code",
  "region_code",
  "county",
  "ua_name",
  "mpo_code",
  "mpo_name",
  "wkb_geometry",
  "year",
];
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
  const [polling, setPolling ] = React.useState(false);
  const [pollingInterval, setPollingInterval] = React.useState(false);
  const [downloadFileName, setDownloadFileName] = React.useState("");
  const [view, setView] = React.useState({});

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

  const viewDownloads = useMemo(() => {
    return get(view, ['metadata',  'download'])
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

    nameBase += modalState.fileType;
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
                  fileTypes:[modalState.fileType]
              };

              setModalState({...modalState, loading: true});
              const res = await fetch(
                `${DAMA_HOST}/dama-admin/${pgEnv}/gis-dataset/create-download`,
                {
                  method: "POST",
                  body: JSON.stringify(createData),
                  headers: {
                    "Content-Type": "application/json",
                  },
                }
              );

              await res.json();

              setDownloadFileName(modalState.uniqueFileNameBase);
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
    return Array.isArray(sourceColumns) ? sourceColumns.filter(d => d.name !== "ogc_fid") : []
    // return []
  }, [falcorCache, viewId]);
  /**
   * END MODAL STUFF
   */


  /**
   * polling stuff for requested download
   */
  useEffect(() => {
    if ((downloadFileName) && !viewDownloads[downloadFileName]) {
      setPolling(true);
    } else if ((downloadFileName) && viewDownloads[downloadFileName]){
      const downloadFile = (url, filename) => {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      const splitFilePath = viewDownloads[downloadFileName].split("/");
      const fileName = splitFilePath[splitFilePath.length-1];

      const downloadUrl = viewDownloads[downloadFileName].replace(
        "$HOST",
        `${DAMA_HOST}`
      );

      downloadFile(downloadUrl, fileName);
      setPolling(false);
      setDownloadFileName("")
    } else {
      setPolling(false);
      setDownloadFileName("")
    }
  }, [downloadFileName, viewDownloads]);
  const fetchViewPath = [
    "dama",
    pgEnv,
    "views",
    "byId",
    viewId,
    "attributes",
    ["metadata", "version"],
  ];

  //Gets the view so we can determine if our file is ready for download
  const doPolling = async () => {
    falcor.invalidate(["dama", pgEnv, "views", "byId"]);
    falcor.invalidate(fetchViewPath);
    falcor.get(fetchViewPath).then(resp => {
      let out = get(
          resp,
          [
            "json",
            "dama", pgEnv, "views","byId", viewId, "attributes"
          ],
          {}
        );
      setView(out)
    });
  };

  //Gets the view for normal use cases (on load, map view changes, etc.)
  useEffect(() => {
    falcor.get(fetchViewPath).then((resp) => {
      let out = get(
        resp,
        [
          "json",
          "dama",
          pgEnv,
          "views",
          "byId",
          viewId,
          "attributes",
        ],
        {}
      );
      setView(out);
    });
  }, [pgEnv, viewId]);


  useEffect(() => {
    // -- start polling
    if (polling && !pollingInterval) {
      let id = setInterval(doPolling, 10000);
      setPollingInterval(id);
    }
    // -- stop polling
    else if (pollingInterval && !polling) {
      clearInterval(pollingInterval);
      // run polling one last time in case it never finished
      doPolling();
      setPolling(false);
      setPollingInterval(null);
    }
  }, [polling, pollingInterval]); 
  /**
   * end polling
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

  const modalStyle = {
    display: "none",
    position: "fixed",
    top: "0",
    left: "-55vw",
    width:"50vw",
    height:"60vh",
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "5px",
    boxShadow: "0 0 10px rgba(0, 0, 0, 0.3)",
    zIndex: 1001,
    opacity: ".9"
  };

  if(modalState.open) {
    modalStyle.display="block"
  }

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
            disabled={(downloadFileName && !viewDownloads[downloadFileName])}
            themeOptions={{ color: "transparent" }}
            //className='bg-white hover:bg-cool-gray-700 font-sans text-sm text-npmrds-100 font-medium'
            onClick={(e) => {
              setModalState({...modalState, open: true, columns:['tmc', measure]})
            }}
            style={{ width: "100%", marginTop: "10px" }}
          >
            {(downloadFileName && !viewDownloads[downloadFileName]) ? ( <span >
                  <i
                    className={"fa-solid fa-spin fa-spinner mr-2"}
                    aria-hidden="true"
                  ></i>
                  Creating Download
                </span>
              ) : "Open Data Downloader"
            }
            
          </Button>
          

        </div>
        <CreateDownloadModal 
          view={view}
          viewId={viewId}
          geography={geography}
          modalState={modalState}
          modalStyle={modalStyle}
          sourceDataColumns={sourceDataColumns}
          downloadAlreadyExists={downloadAlreadyExists}
          viewDownloads={viewDownloads}
          createDownload={createDownload}
          setModalState={setModalState}
          setColumns={setColumns}
          setModalOpen={setModalOpen}
        />
      </div>
    )
  );
};

const CreateDownloadModal = ({
  view,
  viewId,
  geography,
  modalState,
  modalStyle,
  setModalState,
  setColumns,
  setModalOpen,
  sourceDataColumns,
  downloadAlreadyExists,
  createDownload,
  viewDownloads
}) => {
  return (
    <div style={modalStyle}>
      <div className="flex flex-col h-[100%]">
        <div className="flex items-center m-1">
          <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
            <i
              className="fad fa-layer-group text-blue-600"
              aria-hidden="true"
            />
          </div>
          <div className="mt-3 text-center sm:ml-2 sm:mt-0 sm:text-left w-full">
            <div className="text-lg align-center font-semibold leading-6 text-gray-900">
              Create Data Download
            </div>
          </div>
        </div>
        <div className="flex gap-4 h-[100%]">
          <div className="flex flex-col gap-4 w-[25%]">
            <div>
              <div className=" border-b-2 text-lg font-bold">Year:</div>
              {view?.version ?? viewId}
            </div>
            {geography && geography.length ? (
              <div className="capitalize">
                <div className=" border-b-2 text-lg font-bold">Geography:</div>
                {geography.map((geo) => geo.name).join(", ")}
              </div>
            ) : (
              <></>
            )}
            <div className="flex flex-col">
              <div className=" border-b-2 text-lg font-bold">File Type:</div>
              <div className="flex">
                <input
                  type="radio"
                  value="CSV"
                  id="CSV"
                  name="CSV"
                  checked={modalState.fileType === "CSV"}
                  onChange={(e) =>
                    setModalState({ ...modalState, fileType: e.target.value })
                  }
                />

                <label htmlFor={"CSV"} className="text-sm text-gray-900 mx-1">
                  CSV
                </label>
                <input
                  type="radio"
                  value="GPKG"
                  id="GPKG"
                  name="GPKG"
                  checked={modalState.fileType === "GPKG"}
                  onChange={(e) =>
                    setModalState({ ...modalState, fileType: e.target.value })
                  }
                />
                <label htmlFor={"GPKG"} className="text-sm text-gray-900 mx-1">
                  GPKG
                </label>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 w-[37%]">
            <div className="flex flex-col h-[50%]">
              <div className=" border-b-2 border-black text-xl font-bold">Metadata</div>
              <DownloadColumnList
                columns={modalState.columns.filter((opt) =>
                  metaColumnNames.includes(opt)
                ).map(opt => sourceDataColumns.find(col => col.name === opt))}
                setColumns={setColumns}
              />
            </div>
            <div className="flex flex-col h-[100%]">
              <div className=" border-b-2 border-black text-xl font-bold">
                Performance Measures
              </div>
              <DownloadColumnList
                columns={modalState.columns.filter(
                  (opt) => !metaColumnNames.includes(opt)
                ).map(opt => sourceDataColumns.find(col => col.name === opt))}
                setColumns={setColumns}
                maxHeight="50%"
              />
            </div>
          </div>
          <div className="flex flex-col gap-4 w-[36%]">
            <div className="h-[32.75%]">
              <div className=" border-b-2 text-lg font-bold">Add Metadata</div>
              <MultiLevelSelect
                searchable={true}
                placeholder={"Select a metadata..."}
                displayAccessor={ t => t.display_name || t.name }
                valueAccessor={ t => t.name }
                options={sourceDataColumns
                  .filter((opt) => metaColumnNames.includes(opt.name))
                  .filter((opt) => !modalState.columns.includes(opt.name))}
                value={""}
                onChange={(e) => setColumns(e)}
              />
            </div>
            <div>
              <div className=" border-b-2 text-lg font-bold">Add Measures</div>
              <MultiLevelSelect
                searchable={true}
                placeholder={"Select a measure..."}
                displayAccessor={ t => t.display_name || t.name }
                valueAccessor={ t => t.name }
                options={sourceDataColumns
                  .filter((opt) => !metaColumnNames.includes(opt.name))
                  .filter((opt) => !modalState.columns.includes(opt.name))}
                value={""}
                onChange={(e) => setColumns(e)}
              />
            </div>
          </div>
        </div>
        <div className="absolute" style={{ bottom: "20px", right: "20px" }}>
          <div className="flex mt-2 text-sm items-center flex-row-reverse">
            One or more columns must be selected
            {modalState.columns.length > 0 ? (
              <CheckCircleIcon className="mr-2 text-green-700 h-4 w-4" />
            ) : (
              <XCircleIcon className="mr-2 text-red-700 h-4 w-4" />
            )}
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              disabled={
                modalState.loading ||
                modalState.columns.length === 0 ||
                modalState.columns.some((colName) => colName.includes(" "))
              }
              className="disabled:bg-slate-300 disabled:cursor-warning inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
              onClick={downloadAlreadyExists ? () => {} : createDownload}
            >
              {downloadAlreadyExists ? (
                <a
                  href={viewDownloads[modalState.uniqueFileNameBase].replace(
                    "$HOST",
                    `${DAMA_HOST}`
                  )}
                >
                  Download data
                </a>
              ) : modalState.loading ? (
                "Sending request..."
              ) : (
                "Start download creation"
              )}
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DownloadColumnList = ({ columns, setColumns, maxHeight }) => {
  return (
    <div 
      style={{ maxHeight, overflowY: 'auto', minHeight:"20%" }}
      className="w-full"
    >
      {columns.map((col) => {
        return (
          <div
            className="flex justify-between px-1 border-2 border-transparent hover:border-black font-semibold "
            key={`selected_col_${col.name}`}
          >
            <div>{col.display_name || col.name}</div>
            <div
              className="font-bold cursor-pointer"
              onClick={() => setColumns(col.name)}
            >
              X
            </div>
          </div>
        );
      })}
    </div>
  );
};

export { Comp };
