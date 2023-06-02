import React, { useState, useMemo, useEffect } from "react";
import { get, uniqBy } from "lodash";
import { useSelector } from "react-redux";
import { useFalcor } from "~/modules/avl-components/src";
import { selectPgEnv } from "~/pages/DataManager/store";
import makeAnimated from "react-select/animated";

import MultiSelect from "./multiSelect";
import { Select } from "./singleSelect";
import PublishAcs from "./publish";

import { DAMA_HOST } from "~/config";

import {
  ViewAttributes,
  getAttributes,
  SourceAttributes,
} from "../../../components/attributes";

const censusVariables = [
  { key: "B02001_001E", name: "Total Population" },
  { key: "B02001_004E", name: "American Indian and Alaska Native alone" },
  { key: "B02001_005E", name: "Asian alone" },
  { key: "B02001_003E", name: "Black or African American alone" },
  {
    key: "B02001_006E",
    name: "Native Hawaiian and Other Pacific Islander alone",
  },
  { key: "B02001_007E", name: "Some other race alone" },
  { key: "B02001_008E", name: "Two or more races" },
  { key: "B02001_002E", name: "White alone" },
];

export const OptionSelectorComponent = ({
  options,
  selectedOptions,
  onChange,
}) => {
  const animatedComponents = makeAnimated();
  return (
    <>
      <MultiSelect
        value={(selectedOptions || [])
          .map((values) =>
            (options || []).find((prod) => prod.value === values)
          )
          .filter((prod) => prod && prod.value && prod.label)
          .map((prod) => ({
            label: prod?.label,
            value: prod?.value,
          }))}
        closeMenuOnSelect={false}
        options={options || []}
        onChange={(value) => {
          onChange(value?.map((val) => val?.value));
        }}
        components={{ animatedComponents }}
        placeholder="-- Select --"
        isSearchable
      />
    </>
  );
};

export const VariableSelectorComponent = ({
  options,
  selectedOptions,
  onChange,
}) => {
  const animatedComponents = makeAnimated();
  return (
    <>
      <MultiSelect
        value={(selectedOptions || [])
          .map((values) =>
            (options || []).find((prod) => prod.value === values.value)
          )
          .filter((prod) => prod && prod.value && prod.label)
          .map((prod) => ({
            label: prod?.label,
            value: prod?.value,
          }))}
        closeMenuOnSelect={false}
        options={options || []}
        onChange={(value) => {
          onChange(value);
        }}
        components={{ animatedComponents }}
        placeholder="-- Select --"
        isSearchable
      />
    </>
  );
};

const AcsSelection = (props) => {
  const { falcor, falcorCache } = useFalcor();
  const pgEnv = useSelector(selectPgEnv);

  const [selectedView, setSelecteView] = useState(null);
  const [selectedTableViews, setSelecteTableOptions] = useState(null);
  const [selectedVariables, setSelecteVariableOptions] = useState(null);
  const [newEtlCtxId, setNewEtlCtxId] = useState(null);

  const damaServerPath = `${DAMA_HOST}/dama-admin/${pgEnv}`;

  useEffect(() => {
    (async () => {
      const newEtlCtxRes = await fetch(`${damaServerPath}/etl/new-context-id`);
      // eslint-disable-next-line react-hooks/exhaustive-deps
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
      return await falcor.get([
        "dama",
        pgEnv,
        "sources",
        "byIndex",
        { from: 0, to: get(resp.json, lengthPath, 0) - 1 },
        "attributes",
        Object.values(SourceAttributes),
      ]);
    }

    return fetchData();
  }, [falcor, pgEnv]);

  const sourceIds = useMemo(() => {
    return Object.values(
      get(falcorCache, ["dama", pgEnv, "sources", "byIndex"], {})
    )
      .map((v) =>
        getAttributes(
          get(falcorCache, v.value, { attributes: {} })["attributes"]
        )
      )
      .filter((source) => source?.type === "tiger_counties")
      .map((sid) => sid?.source_id);
  }, [falcorCache, pgEnv]);

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

      let requests = sourceIds.map((source_id) => {
        return [
          "dama",
          pgEnv,
          "sources",
          "byId",
          source_id,
          "views",
          "byIndex",
          {
            from: 0,
            to:
              get(
                resp.json,
                [
                  "dama",
                  pgEnv,
                  "sources",
                  "byId",
                  source_id,
                  "views",
                  "length",
                ],
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

  const views = useMemo(() => {
    return (sourceIds || []).reduce((out, source_id) => {
      let view = Object.values(
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

      if (view?.length) out = uniqBy([...out, ...view], "view_id");
      return out;
    }, []);
  }, [falcorCache, sourceIds, pgEnv]);

  const viewOptions = useMemo(() => {
    return (views || []).map((v) => ({
      id: v.view_id,
      value: v?.version || "N/A",
      source_id: v?.source_id,
    }));
  }, [views]);

  if (!selectedView && viewOptions && viewOptions[0]) {
    setSelecteView(viewOptions[0]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pgEnv, selectedView, dataLength]);

  const tableData = useMemo(() => {
    return Object.values(
      get(
        falcorCache,
        ["dama", pgEnv, "viewsbyId", selectedView?.id, "databyIndex"],
        []
      )
    ).map((d) => get(falcorCache, d.value, {}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      value: Number(padNumber(t?.geoid || i)),
      label: `${padNumber(t?.geoid)} -> ${t?.name}`,
    }));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableData]);

  return (
    <>
      <div className="flex flex-1">
        <div>
          <Select
            selectedOption={selectedView || (viewOptions && viewOptions[0])}
            options={viewOptions}
            setSelecteOptions={setSelecteView}
          />
        </div>

        {selectedView ? (
          <>
            <div className="w-4/5 mx-2">
              <OptionSelectorComponent
                options={tableOptions}
                selectedOptions={selectedTableViews}
                onChange={setSelecteTableOptions}
              />
            </div>
            <div>
              <VariableSelectorComponent
                options={(censusVariables || []).map((v) => ({
                  label: v?.name,
                  value: v?.key,
                }))}
                selectedOptions={selectedVariables}
                onChange={setSelecteVariableOptions}
              />
            </div>
          </>
        ) : null}
      </div>
      <div>
        <PublishAcs
          viewDependency={selectedView}
          viewMetadata={{
            counties: selectedTableViews,
            variables: selectedVariables,
          }}
          etlContextId={newEtlCtxId}
          damaServerPath={damaServerPath}
          {...props}
        />
      </div>
    </>
  );
};

export default AcsSelection;
