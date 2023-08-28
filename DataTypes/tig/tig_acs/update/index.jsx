import React, { useContext, useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { get } from "lodash";
import { Button, useFalcor } from "~/modules/avl-components/src";

import { DamaContext } from "~/pages/DataManager/store";

import MultiSelect from "./../multiSelect";
import { Select } from "./../singleSelect";
import { ACSCustomVariables } from "./../customVariables";

import { API_HOST, DAMA_HOST } from "~/config";

import {
  ViewAttributes,
  getAttributes,
} from "../../../../components/attributes";

const Update = (props) => {
  const { falcor, falcorCache } = useFalcor();
  const { sourceId } = useParams();
  const { pgEnv } = useContext(DamaContext);
  const [selectedVariables, setSelecteVariableOptions] = useState(null);
  const [selectedYears, setSelectedYears] = useState(null);
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

  const [viewDependency, metadata, variables, years] = useMemo(() => {
    const selectedViewData =
      views.find((v) => v.view_id === selectedView?.id) || {};
    return [
      get(selectedViewData, "view_dependencies", {})?.[0] || [],
      get(selectedViewData, "metadata", {}),
      get(selectedViewData, "metadata.variables", []),
      get(selectedViewData, "metadata.years", []),
    ];
  }, [views, selectedView]);

  useEffect(() => {
    if (variables && !selectedVariables) {
      setSelecteVariableOptions(variables);
    }
  }, [variables]);

  useEffect(() => {
    if (years && !selectedYears) {
      setSelectedYears(years);
    }
  }, [years]);

  const addNewVariable = (newVariable) =>
    setSelecteVariableOptions([...selectedVariables, newVariable]);

  const UpdateView = (attr, value) => {
    if (selectedView && selectedView.id) {
      const { id: view_id } = selectedView;
      try {
        falcor
          .set({
            paths: [
              [
                "dama",
                pgEnv,
                "views",
                "byId",
                view_id,
                "attributes",
                "metadata",
              ],
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

  const yearsOptions = Array.from(
    Array(new Date().getFullYear() - 2009),
    (_, i) => i + 2010
  ).map((year) => ({
    label: year,
    value: Number(year),
  }));

  const runScript = (params) => {
    const runPublish = async () => {
      try {
        const publishData = {
          serverUrl: `${API_HOST}/graph`,
          view_id: params.id,
          source_id: params.source_id,
          viewDependency: params.viewDependency,
          ...params.metadata,
        };
        
        const res = await fetch(
          `${DAMA_HOST}/dama-admin/${pgEnv}/hazard_mitigation/cacheAcs`,
          {
            method: "POST",
            body: JSON.stringify(publishData),
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        await res.json();
      } catch (err) {}
    };
    runPublish();
  };

  return (
    <>
      <div className="w-full max-w-lg">
        <div className="flex flex-wrap -mx-3 mb-6">
          <div className="w-full px-3">
            <label
              className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
              htmlFor="grid-counties"
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
              for="grid-years"
            >
              Years
            </label>

            <MultiSelect
              value={(selectedYears || [])
                ?.map((values) =>
                  (yearsOptions || []).find(
                    (prod) => prod.value === Number(values)
                  )
                )
                .filter((prod) => prod && prod.value && prod.label)
                .map((prod) => ({
                  label: prod?.label,
                  value: prod?.value,
                }))}
              closeMenuOnSelect={false}
              options={yearsOptions}
              onChange={(value) => setSelectedYears(value.map((v) => v.value))}
              selectMessage={"Years"}
              isSearchable
            />

            <p className="text-gray-600 text-xs italic">
              Select Years for the view
            </p>
          </div>
        </div>

        <div className="flex flex-wrap -mx-3 mb-6">
          <div className="w-full px-3">
            <label
              className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
              htmlFor="grid-counties"
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
          onClick={() => {
            UpdateView(
              "metadata",
              Object.assign({}, metadata, {
                variables: selectedVariables,
                years: selectedYears,
              })
            );
            runScript({
              ...selectedView,
              metadata: Object.assign({}, metadata, {
                variables: selectedVariables,
                years: selectedYears,
              }),
              viewDependency,
            });
          }}
        >
          {" "}
          Save{" "}
        </Button>
      </div>
    </>
  );
};

export default Update;
