import React, { useContext, useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { get } from "lodash";
import { Button, useFalcor } from "~/modules/avl-components/src";

import { DamaContext } from "~/pages/DataManager/store";

import MultiSelect from "./../multiSelect";
import { Select } from "./../singleSelect";
import { ACSCustomVariables } from "./../customVariables";

import { DAMA_HOST } from "~/config";

import {
  ViewAttributes,
  getAttributes,
} from "../../../../components/attributes";

// const censusVariables = [
//   { censusKeys: ["B02001_001E"], name: "Total Population", divisorKeys: [] },
//   {
//     censusKeys: ["B02001_004E"],
//     name: "American Indian and Alaska Native alone",
//     divisorKeys: [],
//   },
//   { censusKeys: ["B02001_005E"], name: "Asian alone", divisorKeys: [] },
//   {
//     censusKeys: ["B02001_003E"],
//     name: "Black or African American alone",
//     divisorKeys: [],
//   },
//   {
//     censusKeys: ["B02001_006E"],
//     name: "Native Hawaiian and Other Pacific Islander alone",
//     divisorKeys: [],
//   },
//   {
//     censusKeys: ["B02001_007E"],
//     name: "Some other race alone",
//     divisorKeys: [],
//   },
//   { censusKeys: ["B02001_008E"], name: "Two or more races", divisorKeys: [] },
//   { censusKeys: ["B02001_002E"], name: "White alone", divisorKeys: [] },
// ];

const Update = (props) => {
  const { falcor, falcorCache } = useFalcor();
  const { sourceId } = useParams();
  const { pgEnv } = useContext(DamaContext);
  const [selectedVariables, setSelecteVariableOptions] = useState(null);
  const [selectedView, setSelecteView] = useState(null);

  useEffect(() => {
    async function getData() {
      const lengthPath = [
        "dama",
        pgEnv,
        "sources",
        "byId",
        sourceId,
        "views",
        "length",
      ];

      const resp = await falcor.get(lengthPath);
      await falcor.get([
        "dama",
        pgEnv,
        "sources",
        "byId",
        sourceId,
        "views",
        "byIndex",
        {
          from: 0,
          to: get(resp.json, lengthPath, 0) - 1,
        },
        "attributes",
        Object.values(ViewAttributes),
      ]);
    }
    getData();
  }, [falcor, sourceId, pgEnv]);

  const views = useMemo(() => {
    return Object.values(
      get(
        falcorCache,
        ["dama", pgEnv, "sources", "byId", sourceId, "views", "byIndex"],
        {}
      )
    ).map((v) =>
      getAttributes(get(falcorCache, v.value, { attributes: {} })["attributes"])
    );
  }, [falcorCache, sourceId, pgEnv]);

  const viewOptions = useMemo(() => {
    return (views || []).map((v) => ({
      id: v.view_id,
      value: v?.table_name || "N/A",
      source_id: v?.source_id,
    }));
  }, [views]);

  if (viewOptions && viewOptions[0] && !selectedView) {
    setSelecteView(viewOptions[0]);
  }

  const [metadata, variables] = useMemo(() => {
    const selectedViewData =
      views.find((v) => v.view_id === selectedView?.id) || {};
    return [
      get(selectedViewData, "metadata", {}),
      get(selectedViewData, "metadata.variables", []),
    ];
  }, [views, selectedView]);

  console.log("meta", metadata);

  useEffect(() => {
    if (variables && !selectedVariables) {
      setSelecteVariableOptions(variables);
    }
  }, [variables]);

  const addNewVariable = (newVariable) =>
    setSelecteVariableOptions([...selectedVariables, newVariable]);

  const damaServerPath = `${DAMA_HOST}/dama-admin/${pgEnv}`;

  const censusOptions = useMemo(() => {
    return (selectedVariables || []).map((c) => ({
      label: c?.label || c?.name,
      value: c,
    }));
  }, [selectedVariables]);

  const UpdateView = (attr, value) => {
    if (selectedView && selectedView.id) {
      const { id: view_id } = selectedView;
      try {
        falcor
        .set({
          paths: [
            ["dama", pgEnv, "views", "byId", view_id, "attributes", "metadata"],
          ],
          jsonGraph: {
            dama: {
              [pgEnv]: {
                views: {
                  byId: {
                    [view_id]: {
                      attributes: {
                        ["metadata"]: JSON.stringify(value),
                      },
                    },
                  },
                },
              },
            },
          },
        })
        .then((d) => {
          console.log("d", d);
        });  
      } catch (error) {
        console.log("error", error);
      }
      
    }
  };

  return (
    <>
      <div className="w-full max-w-lg">
        <div className="flex flex-wrap -mx-3 mb-6">
          <div className="w-full px-3">
            <label
              className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
              for="grid-counties"
            >
              Select View
            </label>
            <Select
              selectedOption={selectedView}
              options={viewOptions}
              setSelecteOptions={setSelecteView}
            />
            <p className="text-gray-600 text-xs italic">Select View</p>
          </div>
        </div>
        <div className="flex flex-wrap -mx-3 mb-6">
          <div className="w-full px-3">
            <label
              className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
              for="grid-counties"
            >
              Variables
            </label>
            <MultiSelect
              value={selectedVariables || []}
              closeMenuOnSelect={false}
              options={[]}
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
      </div>
      <ACSCustomVariables addNewVariable={addNewVariable} />

      <div className="mt-6 mb-6">
        <Button
          className="rounded-lg"
          themeOptions={{ size: "sm", color: "primary" }}
          onClick={() =>
            UpdateView(
              "metadata",
              Object.assign({}, metadata, { variables: selectedVariables })
            )
          }
        >
          {" "}
          Save{" "}
        </Button>
      </div>
    </>
  );
};

export default Update;
