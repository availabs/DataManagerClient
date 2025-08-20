import React, { useState, useEffect, useMemo, createContext, useRef } from "react"
import get from "lodash/get"
import set from "lodash/set"
import omit from "lodash/omit"
import { extractState } from '../../stateUtils';
import {filters, updateSubMeasures} from "./updateFilters"
import { DamaContext } from "../../../store"
import { getAttributes } from "~/pages/DataManager/Collection/attributes";
import { ViewAttributes } from "../../../Source/attributes"

const BLANK_OPTION = { value: "", name: "" };
const MAP_CLICK = () => console.log("map was clicked");
export const MacroviewPlugin = {
    id: "macroview",
    type: "plugin",
    mapRegister: (map, state, setState) => {
      map.on("click", MAP_CLICK);
    },
    dataUpdate: (map, state, setState) => {
      //console.log("---data update-----")
      //console.log("testing old filters and json code")

      //console.log({filters})
      //updateSubMeasures(this.filters.measure.value, this.filters, falcor);
      const { pathBase, layerPaintPath } = extractState(state);
      const pluginDataPath = `symbology.pluginData.macroview`;
      //console.log("plugin Data gets updated", { map, state, setState });
      const hover = get(state, `${pluginDataPath}['hover']`, "");
      const pm1 = get(state, `${pluginDataPath}['pm-1']`, null);
      const peak = get(state, `${pluginDataPath}['peak']`, null);
      const viewId = get(state, `${pluginDataPath}['viewId']`, null);
      const activeLayerId = get(state, `${pluginDataPath}['activeLayer']`, null);
      const activeLayer = get(state, `symbology.layers[${activeLayerId}]`, null);
      setState(draft => {
        const newLayer = JSON.parse(
          JSON.stringify(draft.symbology.layers[activeLayerId].layers).replaceAll(
            activeLayer.view_id,
            viewId
          )
        );
        draft.symbology.layers[activeLayerId].layers = newLayer;
        // //sources[0].id
        // //sources[0].source.tiles
        const newSources = JSON.parse(
          JSON.stringify(
            draft.symbology.layers[activeLayerId].sources
          ).replaceAll(activeLayer.view_id, viewId)
        );
        draft.symbology.layers[activeLayerId].sources = newSources;

        draft.symbology.layers[activeLayerId].view_id = viewId

      })

      if (pm1 && peak) {
        const newDataColumn = `${pm1}_${peak}_${pm1}`;

        const newPaint = [
          "case",
          ["==", ["get", newDataColumn], null],
          "#ccc",
          [
            "step",
            ["to-number", ["get", newDataColumn]],
            "#e8e873",
            1,
            "#e8e873",
            1.32,
            "#2cbaa8",
            2.06,
            "#4b5899",
          ],
        ];

        const newLegend = [
          {
            color: "#e8e873",
            label: "test123",
          },
          {
            color: "#2cbaa8",
            label: "1.32 - 2.06",
          },
          {
            color: "#4b5899",
            label: "2.06 - 6.55",
          },
        ];

        setState((draft) => {
          set(draft,`${pathBase}['hover']` , hover)
          set(draft, `${pathBase}['data-column']`, newDataColumn); //must set data column, or else tiles will not have that data
          set(draft, `${pathBase}.${layerPaintPath}`, newPaint); //Mapbox paint
          set(draft, `${pathBase}['legend-data']`, newLegend); //AVAIL-written legend component

          //SHAPE OF layerFilter --  
          // { colToFilterOn: { operator: "==", value: valToCompareAgainst } }
          //value can be an array of 2 numbers, if operator === 'between'
          //Allowed FILTER_OPERATORS -- src/pages/DataManager/MapEditor/components/LayerEditor/FilterEditor/FilterControls.jsx
          const testFilter = {
            [newDataColumn]: { operator: ">", value: 1.2 },
          };
          set(draft, `${pathBase}['filter']`, testFilter); //eventually consumed by mapbox, but formatted/parsed by AVAIL code
        })
      }
    },
    internalPanel: ({ state, setState }) => {
      const {falcor, falcorCache, pgEnv, baseUrl} = React.useContext(DamaContext);
      // console.log("internal panel state::", state)
      //if a layer is selected, use the source_id to get all the associated views
      const activeLayer = get(state, `symbology.pluginData.macroview.activeLayer`);

      useEffect(() => {
        const getRelatedPm3Views = async (source_id) => {
          //console.time("fetch data");
          const lengthPath = [
            "dama",
            pgEnv,
            "sources",
            "byId",
            source_id,
            "views",
            "length",
          ];
          const resp = await falcor.get(lengthPath);
          return await falcor.get([
            "dama",
            pgEnv,
            "sources",
            "byId",
            source_id,
            "views",
            "byIndex",
            { from: 0, to: get(resp.json, lengthPath, 0) - 1 },
            "attributes",
            Object.values(ViewAttributes),
          ]);
        };

        if (activeLayer) {
          const source_id = get(
            state,
            `symbology.layers[${activeLayer}].source_id`
          );

          if (source_id) {
            getRelatedPm3Views(source_id);
          }
        }
      }, [activeLayer]);

      const views = useMemo(() => {
        if (activeLayer) {
          const source_id = get(
            state,
            `symbology.layers[${activeLayer}].source_id`
          );

          return Object.values(
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
        } else {
          return [];
        }
      }, [falcorCache, activeLayer, pgEnv]);

      //using pm3 as example
      //developer wants to make control to let geoplanner select the correct layer in map editor
      return [
        {
          label: "PM3 Layer",
          controls: [
            {
              type: "select",
              params: {
                options: [
                  BLANK_OPTION,
                  ...Object.keys(state.symbology.layers).map((layerKey, i) => ({
                    value: layerKey,
                    name: state.symbology.layers[layerKey].name,
                  })),
                ],
                default: "",
              },
              //the layer the plugin controls MUST use the `activeLayer` path/field
              path: `['activeLayer']`,
            },
          ],
        },
        {
          label: "Hover Popup",
          controls: [
            {
              type: "select",
              params: {
                options: [
                  { value: "hover", name: "Enabled" },
                  { value: "", name: "Disabled" },
                ],
                default: "",
              },
              //the layer the plugin controls MUST use the `activeLayer` path/field
              path: `['hover']`,
            },
          ],
        },
        activeLayer ? {
          label: "Views",
          controls: [
            {
              type: "multiselect",
              params: {
                options: [
                  BLANK_OPTION,
                  ...views.map(view => ({name: view.version || view.view_id, value:view.view_id}))
                ],
                default: [],
                placeholder: "Select views to include..."
              },
              //the layer the plugin controls MUST use the `activeLayer` path/field
              path: `['views']`,
            },
          ],
        } : {}
      ];
    },
    externalPanel: ({ state, setState }) => {
      //performence measure (speed, lottr, tttr, etc.) (External Panel) (Dev hard-code)
      //"second" selection (percentile, amp/pmp) (External Panel) (dependent on first selection, plus dev hard code)
      const pluginPathBase = `symbology.pluginData.macroview`;
      //TODO -- kind of annoying that the developer has to do the path like this
      //Maybe, we pass {state, setState, pluginData} ? so they don't have to know the full path?
      const { pm1, peak, views } = useMemo(() => {
        return {
          pm1: get(state, `${pluginPathBase}['pm-1']`, null),
          peak: get(state, `${pluginPathBase}['peak']`, null),
          views: get(state, `${pluginPathBase}['views']`, null),
        };
      }, [state.symbology.pluginData, pluginPathBase]);

      const perfMeasureOptions = [
        {
          value: "lottr",
          name: "Level of Travel Time Reliability (LOTTR)",
        },
        {
          value: "phed",
          name: "PHED (person hours)",
        },
        {
          value: "ted",
          name: "TED (person hours)",
        },
      ];

      const controls = [
        {
          label: "Performance Measure",
          controls: [
            {
              type: "select",
              params: {
                options: perfMeasureOptions,
                default: "",
              },
              path: `['pm-1']`,
            },
          ],
        },
        {
          label: "Year",
          controls: [
            {
              type: "select",
              params: {
                options: [...views],
              default: views[0],
              },
              path: `['viewId']`,
            },
          ],
        }
      ];

      //peak selector control
      if (pm1 === "lottr") {
        const peakSelectorOptions = [
          {
            value: "none",
            name: "No Peak",
          },
          {
            value: "amp",
            name: "AM Peak",
          },
          {
            value: "off",
            name: "OFF Peak",
          },
          {
            value: "pmp",
            name: "PM Peak",
          },
          {
            value: "we",
            name: "Weekend",
          },
        ];
        const peakSelector = {
          label: "Peak Selector",
          controls: [
            {
              type: "select",
              params: {
                options: peakSelectorOptions,
                default: "",
              },
              path: `['peak']`,
            },
          ],
        };

        controls.push(peakSelector);
      }

      return controls;
    },
    comp: () => <div>Hello world comp</div>,
    cleanup: (map, state, setState) => {
      map.off("click", MAP_CLICK);
    },
  }