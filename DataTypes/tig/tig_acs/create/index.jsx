import React, { useContext, useState, useMemo, useEffect } from "react";
import { get, uniq, uniqBy, isEqual, flattenDeep } from "lodash";
import { useFalcor } from "~/modules/avl-components/src";

import { DamaContext } from "~/pages/DataManager/store";

import MultiSelect from "./multiSelect";
import { Select } from "./singleSelect";
import PublishAcs from "./publish";

import { DAMA_HOST } from "~/config";

import {
  ViewAttributes,
  getAttributes,
  SourceAttributes,
} from "../../../../components/attributes";

import { AcsCustomAttribute } from "./../customAttributes";

const censusVariables = [
  { censusKeys: ["B02001_001E"], name: "Total Population" },
  {
    censusKeys: ["B02001_004E"],
    name: "American Indian and Alaska Native alone",
  },
  { censusKeys: ["B02001_005E"], name: "Asian alone" },
  { censusKeys: ["B02001_003E"], name: "Black or African American alone" },
  {
    censusKeys: ["B02001_006E"],
    name: "Native Hawaiian and Other Pacific Islander alone",
  },
  { censusKeys: ["B02001_007E"], name: "Some other race alone" },
  { censusKeys: ["B02001_008E"], name: "Two or more races" },
  { censusKeys: ["B02001_002E"], name: "White alone" },
];

const Create = (props) => {
  const { falcor, falcorCache } = useFalcor();
  const { pgEnv } = useContext(DamaContext);

  const [selectedView, setSelecteView] = useState(null);
  const [customAcsSelection, setcustomAcsSelection] = useState(null);
  const [selectedTableViews, setSelecteTableOptions] = useState(null);
  const [selectedVariables, setSelecteVariableOptions] = useState(null);
  const [newEtlCtxId, setNewEtlCtxId] = useState(null);

  const damaServerPath = `${DAMA_HOST}/dama-admin/${pgEnv}`;

  useEffect(() => {
    (async () => {
      const newEtlCtxRes = await fetch(`${damaServerPath}/etl/new-context-id`);
      const contextId = +(await newEtlCtxRes.text());

      if (contextId) {
        setNewEtlCtxId(contextId);
      }
    })();
  }, [pgEnv, damaServerPath]);

  useEffect(() => {
    async function fetchData() {
      const lengthPath = ["dama", pgEnv, "sources", "length"];
      const resp = await falcor.get(lengthPath);
      await falcor.get([
        "dama",
        pgEnv,
        "sources",
        "byIndex",
        { from: 0, to: get(resp.json, lengthPath, 0) - 1 },
        "attributes",
        Object.values(SourceAttributes),
      ]);
    }

    fetchData();
  }, [falcor, pgEnv]);

  const sourceGroup = useMemo(() => {
    return (
      Object.values(get(falcorCache, ["dama", pgEnv, "sources", "byIndex"], {}))
        .map((v) =>
          getAttributes(
            get(falcorCache, v.value, { attributes: {} })["attributes"]
          )
        )
        // .filter(
        //   (source) =>
        //     source?.type === "tiger_counties" ||
        //     source?.type === "tiger_censustrack"
        // )
        .filter((source) => source?.type?.indexOf("tl_") !== -1)
        .reduce((acc, source) => {
          const { source_id, type } = source;
          acc[type] = acc[type] ?? [];
          acc[type].push(source_id);
          return acc;
        }, {}) || {}
    );
  }, [falcorCache, pgEnv]);

  const sourceIds = useMemo(() => {
    return sourceGroup && flattenDeep(Object.values(sourceGroup || {}));
  }, [sourceGroup]);

  useEffect(() => {
    async function getData() {
      const lengthPath = [
        "dama",
        pgEnv,
        "sources",
        "byId",
        sourceIds,
        "views",
        "length",
      ];

      const resp = await falcor.get(lengthPath);

      let requests = (sourceIds || []).map((s_id) => {
        return [
          "dama",
          pgEnv,
          "sources",
          "byId",
          s_id,
          "views",
          "byIndex",
          {
            from: 0,
            to:
              get(
                resp.json,
                ["dama", pgEnv, "sources", "byId", s_id, "views", "length"],
                0
              ) - 1,
          },
          "attributes",
          Object.values(ViewAttributes),
        ];
      });
      falcor.get(...requests);
    }
    getData();
  }, [falcor, sourceIds, pgEnv]);

  const viewGroup = useMemo(() => {
    return Object.keys(sourceGroup).reduce((acc, type) => {
      acc[type] = (uniq(sourceGroup[type]) || []).reduce((out, source_id) => {
        const view = Object.values(
          get(
            falcorCache,
            ["dama", pgEnv, "sources", "byId", source_id, "views", "byIndex"],
            {}
          )
        ).map((v) =>
          getAttributes(
            get(falcorCache, v.value, { attributes: {} })["attributes"]
          )
        );

        if (view?.length) {
          out = uniqBy([...out, ...view], "view_id");
        }
        return out;
      }, []);
      return acc;
    }, {});
  }, [falcorCache, sourceGroup, pgEnv]);

  const views = useMemo(() => {
    return viewGroup && flattenDeep(viewGroup["tl_county"] || []);
  }, [viewGroup]);

  const viewOptions = useMemo(() => {
    return (views || []).map((v) => ({
      id: v.view_id,
      value: v?.version || v?.table_name || "N/A",
      source_id: v?.source_id,
    }));
  }, [views]);

  const customViews = useMemo(() => {
    return viewGroup && flattenDeep(viewGroup["tl_tract"] || []);
  }, [viewGroup]);

  const customViewOptions = useMemo(() => {
    return (customViews || []).map((v) => ({
      id: v.view_id,
      value: v?.version || v?.table_name || "N/A",
      source_id: v?.source_id,
    }));
  }, [customViews]);

  if (!selectedView && viewOptions && viewOptions[0]) {
    setSelecteView(viewOptions[0]);
  }

  // forced to add 2010
  if (!customAcsSelection && customViewOptions && customViewOptions[0]) {
    setcustomAcsSelection({ 2010: customViewOptions[0] });
  }

  useEffect(() => {
    falcor.get([
      "dama",
      pgEnv,
      "viewsbyId",
      selectedView?.id,
      "data",
      "length",
    ]);
  }, [pgEnv, selectedView]);

  const dataLength = useMemo(() => {
    return get(
      falcorCache,
      ["dama", pgEnv, "viewsbyId", selectedView?.id, "data", "length"],
      "No Length"
    );
  }, [pgEnv, selectedView, falcorCache]);

  useEffect(() => {
    if (dataLength > 0) {
      let maxData = Math.min(dataLength, 10000);
      falcor.chunk(
        [
          "dama",
          pgEnv,
          "viewsbyId",
          selectedView?.id,
          "databyIndex",
          [...Array(maxData).keys()],
          [
            "ogc_fid",
            "statefp",
            "countyfp",
            "countyns",
            "geoid",
            "name",
            "namelsad",
            "lsad",
            "classfp",
            "mtfcc",
            "csafp",
            "cbsafp",
            "metdivfp",
            "funcstat",
            "aland",
            "awater",
            "intptlat",
            "intptlon",
          ],
        ],
        { chunkSize: 500 }
      );
    }
  }, [pgEnv, selectedView, dataLength]);

  const tableData = useMemo(() => {
    return Object.values(
      get(
        falcorCache,
        ["dama", pgEnv, "viewsbyId", selectedView?.id, "databyIndex"],
        []
      )
    ).map((d) => get(falcorCache, d.value, {}));
  }, [pgEnv, selectedView, falcorCache, dataLength]);

  function padNumber(num) {
    let str = num?.toString();
    if (str?.length < 5) {
      str = str?.padStart(5, "0");
    }
    return str;
  }

  const tableOptions = useMemo(() => {
    return (tableData || []).map((t, i) => ({
      value: padNumber(t?.geoid || i),
      label: `${padNumber(t?.geoid)} -> ${t?.name}`,
    }));
  }, [tableData]);

  const censusOptions = useMemo(() => {
    return (censusVariables || []).map((c) => ({
      label: c?.name,
      value: c?.censusKeys,
    }));
  }, [censusVariables]);

  const viewDependency = useMemo(() => {
    return uniqBy(
      [selectedView, ...Object.values(customAcsSelection || {})],
      "id"
    )
      .filter((v) => !!v)
      .map((s) => s?.id);
  }, [selectedView, customAcsSelection]);

  return (
    <>
      <div className="w-full max-w-lg">
        <div className="flex flex-wrap -mx-3 mb-6">
          <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
            <label
              className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
              for="grid-view-dependency"
            >
              View Dependency
            </label>

            <Select
              selectedOption={selectedView || (viewOptions && viewOptions[0])}
              options={viewOptions}
              setSelecteOptions={setSelecteView}
            />
          </div>
        </div>

        <div className="flex flex-wrap -mx-3 mb-6">
          <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
            <label
              className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
              for="grid-census-track"
            >
              Cencus Tracks
            </label>

            <AcsCustomAttribute
              customAcsSelection={customAcsSelection}
              options={customViewOptions}
              onChange={setcustomAcsSelection}
            />
          </div>
        </div>
        {selectedView ? (
          <div className="flex flex-wrap -mx-3 mb-6">
            <div className="w-full px-3">
              <label
                className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                for="grid-counties"
              >
                Counties
              </label>

              <MultiSelect
                value={(selectedTableViews || [])
                  .map((values) =>
                    (tableOptions || []).find((prod) => prod.value === values)
                  )
                  .filter((prod) => prod && prod.value && prod.label)
                  .map((prod) => ({
                    label: prod?.label,
                    value: prod?.value,
                  }))}
                closeMenuOnSelect={false}
                options={tableOptions || []}
                onChange={(value) => {
                  setSelecteTableOptions(value?.map((val) => val?.value));
                }}
                selectMessage={"Counties"}
                isSearchable
              />

              <p className="text-gray-600 text-xs italic">
                Select Counties for the view
              </p>
            </div>
          </div>
        ) : null}
        {selectedView ? (
          <div className="flex flex-wrap -mx-3 mb-6">
            <div className="w-full px-3">
              <label
                className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                for="grid-counties"
              >
                Variables
              </label>
              <MultiSelect
                value={(selectedVariables || [])
                  .map((values) =>
                    (censusOptions || []).find((prod) =>
                      isEqual(prod.value, values.value)
                    )
                  )
                  .filter((prod) => prod && prod.value && prod.label)
                  .map((prod) => ({
                    label: prod?.label,
                    value: prod?.value,
                  }))}
                closeMenuOnSelect={false}
                options={censusOptions || []}
                onChange={(value) => {
                  setSelecteVariableOptions(value);
                }}
                selectMessage={"Variables"}
                isSearchable
              />
              <p className="text-gray-600 text-xs italic">
                Select Variables for the view
              </p>
            </div>
          </div>
        ) : null}
        <div class="md:flex md:items-center">
          <PublishAcs
            viewDependency={viewDependency || selectedView?.id}
            viewMetadata={{
              counties: selectedTableViews,
              variables: selectedVariables,
              customDependency: customAcsSelection,
            }}
            etlContextId={newEtlCtxId}
            damaServerPath={damaServerPath}
            {...props}
          />
        </div>
      </div>
    </>
  );
};

export default Create;
