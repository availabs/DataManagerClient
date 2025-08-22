import React, { useState, useEffect, useMemo, createContext, useRef } from "react"
import get from "lodash/get"
import set from "lodash/set"
import isEqual from "lodash/isEqual"
import omit from "lodash/omit"
import mapboxgl from "maplibre-gl";
import { extractState, fetchBoundsForFilter } from '../../stateUtils';
import {filters, updateSubMeasures, getMeasure} from "./updateFilters"
import { DamaContext } from "../../../store"
import { getAttributes } from "~/pages/DataManager/Collection/attributes";
import { ViewAttributes } from "../../../Source/attributes"
import { usePrevious } from "../../components/LayerManager/utils";

function onlyUnique(value, index, array) {
  return array.indexOf(value) === index;
}
const BLANK_OPTION = { value: "", name: "" };
const MAP_CLICK = () => console.log("map was clicked");
export const MacroviewPlugin = {
    id: "macroview",
    type: "plugin",
    mapRegister: (map, state, setState) => {
      map.on("click", MAP_CLICK);
      const pluginDataPath = `symbology.pluginData.macroview`;
      const newFilters = updateSubMeasures(filters);

      setState(draft => {
        set(draft, `${pluginDataPath}['measureFilters']`, newFilters);
      })
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
      const geography = get(state, `${pluginDataPath}['geography']`, null);
      const activeLayerId = get(state, `${pluginDataPath}['activeLayer']`, null);
      const measureFilters = get(state, `${pluginDataPath}['measureFilters']`, filters)
      const activeLayer = get(state, `symbology.layers[${activeLayerId}]`, null);

      if(activeLayerId && viewId) { 
        //Update map with new viewId
        setState(draft => {
          const newLayer = JSON.parse(
            JSON.stringify(draft.symbology.layers[activeLayerId].layers).replaceAll(
              activeLayer.view_id,
              viewId
            )
          );
          draft.symbology.layers[activeLayerId].layers = newLayer;
          const newSources = JSON.parse(
            JSON.stringify(
              draft.symbology.layers[activeLayerId].sources
            ).replaceAll(activeLayer.view_id, viewId)
          );
          draft.symbology.layers[activeLayerId].sources = newSources;
          draft.symbology.layers[activeLayerId].view_id = viewId
        })
      }

      const newDataColumn = getMeasure(measureFilters);

      console.log("---data update newDataColumn measure---",newDataColumn)


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
      })
      
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
      const {falcor, falcorCache, pgEnv, baseUrl} = React.useContext(DamaContext);
      //performence measure (speed, lottr, tttr, etc.) (External Panel) (Dev hard-code)
      //"second" selection (percentile, amp/pmp) (External Panel) (dependent on first selection, plus dev hard code)
      const pluginDataPath = `symbology.pluginData.macroview`;
      //TODO -- kind of annoying that the developer has to do the path like this
      //Maybe, we pass {state, setState, pluginData} ? so they don't have to know the full path?
      //TODO -- `viewId` might initalize to null or something, might need a better default or conditionals
      const { views, viewId, geography, activeLayerId, measureFilters } = useMemo(() => {
        return {
          views: get(state, `${pluginDataPath}['views']`, []),
          viewId: get(state, `${pluginDataPath}['viewId']`, null),
          geography: get(state, `${pluginDataPath}['geography']`, null),
          activeLayerId: get(state, `${pluginDataPath}['activeLayer']`, null),
          measureFilters: get(state, `${pluginDataPath}['measureFilters']`, filters)
        };
      }, [state.symbology.pluginData, pluginDataPath]);

      useEffect(() => {
        const getFilterBounds = async () => {
          //need array of [{column_name:foo, values:['bar', 'baz']}]
          //geography is currently [{name: foo, value: 'bar', type:'baz'}]

          //loop thru, gather like terms
          const selectedGeographyByType = geography.reduce((acc, curr) => {
            if (!acc[curr.type]) {
              acc[curr.type] = [];
            }
            acc[curr.type].push(curr.value);
            return acc;
          }, {});
          console.log({selectedGeographyByType})
          const geographyFilter = Object.keys(selectedGeographyByType).map(
            (column_name) => {
              return {
                display_name: column_name,
                column_name,
                values: selectedGeographyByType[column_name],
                zoomToFilterBounds: true,
              };
            }
          );
            setState((draft) => {
              set(
                draft,
                `symbology.layers[${activeLayerId}]['dynamic-filters']`,
                geographyFilter
              );

              set(draft, `symbology.layers[${activeLayerId}]['filterMode']`, 'any')
            });
        };
        if (geography?.length > 0) {
          getFilterBounds();
        } else {
          //resets dynamic filter if there are no geographies selected
          if (state?.symbology?.zoomToFilterBounds?.length > 0) {
            setState((draft) => {
              draft.symbology.zoomToFilterBounds = [];
              set(
                draft,
                `symbology.layers[${activeLayerId}]['dynamic-filters']`,
                []
              );
            });
          }
        }
      }, [geography]);

      //geography selector
      //mpos/regions/counties/ua/state
      const geomOptions = JSON.stringify({
        groupBy: ['ua_name', 'region_code', 'mpo_name', 'county'],
      })
      useEffect(() => {
        const getGeoms = async () => {
          await falcor.get([
            'dama',pgEnv,'viewsbyId', viewId, 'options', geomOptions, 'databyIndex',{ from: 0, to: 200 },['ua_name', 'region_code', 'mpo_name', 'county']
          ])
        }

        if(viewId) {
          getGeoms();
        }
      },[viewId])

      const geomControlOptions = useMemo(() => {
        const geomData = get(falcorCache, ['dama',pgEnv,'viewsbyId', viewId, 'options', geomOptions, 'databyIndex'])

        if(geomData) {
          const geoms = {
            ua_name: [],
            region_code: [],
            mpo_name: [],
            county: [],
            state: 'NY'
          };

          Object.values(geomData).forEach(da => {
            geoms.ua_name.push(da.ua_name);
            geoms.region_code.push(da.region_code);
            geoms.mpo_name.push(da.mpo_name);
            geoms.county.push(da.county);
          });

          const nameSort = (a, b) => {
            if (a.name < b.name) {
              return -1;
            } else {
              return 1;
            }
          };
          const objectFilter = (da => typeof da !== 'object');
          const truthyFilter = (val => !!val)
          geoms.ua_name = geoms.ua_name.filter(onlyUnique).filter(objectFilter).filter(truthyFilter).map(da => ({name: da + " UA", value: da, type:'ua_name'})).sort(nameSort)
          geoms.region_code = geoms.region_code.filter(onlyUnique).filter(objectFilter).filter(truthyFilter).map(da => ({name: da, value: da, type:'region_code'})).sort(nameSort)
          geoms.mpo_name = geoms.mpo_name.filter(onlyUnique).filter(objectFilter).filter(truthyFilter).map(da => ({name: da, value: da, type:'mpo_name'})).sort(nameSort)
          geoms.county = geoms.county.filter(onlyUnique).filter(objectFilter).filter(truthyFilter).map(da => ({name: da.toLowerCase() + " County", value: da, type:'county'})).sort(nameSort)

          return [...geoms.county, ...geoms.mpo_name, ...geoms.ua_name, ...geoms.region_code];
        } else {
          return []
        }
      },[falcorCache])

      //transform from filters into plugin inputs
      const measureControls = Object.keys(measureFilters)
        .filter((mFilterKey) => measureFilters[mFilterKey].active)
        .sort((keyA, keyB) => {
          const {order: orderA} = measureFilters[keyA];
          const {order: orderB} = measureFilters[keyB];
          if(!orderA && !orderB) {
            return 0
          } else if (!orderA) {
            return -1
          } else if (!orderB) {
            return 1
          } else {
            return orderA - orderB
          }
        })
        .map((mFilterKey) => {
          const mFilter = measureFilters[mFilterKey];

          return {
            label: mFilter.name,
            controls: [
              {
                type: mFilter.multi ? "multiselect" : mFilter.type,
                params: {
                  options: mFilter.domain,
                },
                path: `['measureFilters']['${mFilterKey}'].value`,
              },
            ],
          };
        });

      // console.log({measureControls})
      // console.log({state})
      const controls = [
        {
          label: "Geography",
          controls: [
            {
              type: "multiselect",
              params: {
                options: [BLANK_OPTION, ...geomControlOptions],
                default: "",
              },
              path: `['geography']`,
            },
          ],
        },
        {
          label: "Year",
          controls: [
            {
              type: "select",
              params: {
                options: [BLANK_OPTION, ...views],
                default: views[0],
              },
              path: `['viewId']`,
            },
          ],
        },
        ...measureControls
      ];

      const prevMeasureFilters = usePrevious(measureFilters['measure']);

      useEffect(() => {
        //this is probably infinity render
        setState(draft => {
          set(draft, `${pluginDataPath}['measureFilters']`, updateSubMeasures(measureFilters))
        })
      }, [isEqual(measureFilters['measure'], prevMeasureFilters)])



      return controls;
    },
    comp: () => <div>Hello world comp</div>,
    cleanup: (map, state, setState) => {
      map.off("click", MAP_CLICK);
    },
  }