import React, { useState, useEffect, useMemo, createContext, useRef } from "react"
import get from "lodash/get"
import set from "lodash/set"
import omit from "lodash/omit"
import { extractState } from './stateUtils';

const MAP_CLICK = () => console.log("map was clicked");
export const MacroviewPlugin = {
    id: "macroview",
    type: "plugin",
    mapRegister: (map, state, setState) => {
      console.log("look I am registered");
      map.on("click", MAP_CLICK);
    },
    dataUpdate: (map, state, setState) => {
      console.log("---data update-----")
      const { pathBase, layerPaintPath } = extractState(state);
      const pluginDataPath = `symbology.pluginData.macroview`;
      //console.log("plugin Data gets updated", { map, state, setState });
      const hover = get(state, `${pluginDataPath}['hover']`, "");
      console.log("new hover val", {hover})
      console.log( `${pluginDataPath}['hover']`)
      const pm1 = get(state, `${pluginDataPath}['pm-1']`, null);
      const peak = get(state, `${pluginDataPath}['peak']`, null);
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
          console.log({pathBase})
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
      //using pm3 as example
      //developer wants to make control to let geoplanner select the correct layer in map editor
      return [
        {
          label: "PM3 Layer",
          controls: [
            {
              type: "select",
              params: {
                options: Object.keys(state.symbology.layers).map(
                  (layerKey, i) => ({
                    value: layerKey,
                    name: state.symbology.layers[layerKey].name,
                  })
                ),
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
                options: [{value: "hover", name: "Enabled"}, {value: "", name: "Disabled"}],
                default: "",
              },
              //the layer the plugin controls MUST use the `activeLayer` path/field
              path: `['hover']`,
            },
          ],
        },
      ];
    },
    externalPanel: ({ state, setState }) => {
      console.log("plugin control");
      //performence measure (speed, lottr, tttr, etc.) (External Panel) (Dev hard-code)
      //"second" selection (percentile, amp/pmp) (External Panel) (dependent on first selection, plus dev hard code)
      const pluginPathBase = `symbology.pluginData.macroview`;
      //TODO -- kind of annoying that the developer has to do the path like this
      //Maybe, we pass {state, setState, pluginData} ? so they don't have to know the full path?
      const { pm1, peak } = useMemo(() => {
        console.log(`${pluginPathBase}['pm-1']`);
        return {
          pm1: get(state, `${pluginPathBase}['pm-1']`, null),
          peak: get(state, `${pluginPathBase}['peak']`, null),
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
          label: "Test Input",
          controls: [
            {
              type: "radio",
              params: {
                options: perfMeasureOptions
              },
              path: `['pm-1']`,
            },
          ],
        },
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