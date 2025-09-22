import React, { useState, useEffect, useMemo, createContext, useRef } from "react"
import { DamaContext } from "../../../store"
import get from "lodash/get"
import set from "lodash/set"
import { getAttributes } from "~/pages/DataManager/Collection/attributes";
import { ViewAttributes } from "../../../Source/attributes"
import {
  REGION_CODE_TO_NAME,
  PM3_LAYER_KEY,
  MPO_LAYER_KEY,
  COUNTY_LAYER_KEY,
  REGION_LAYER_KEY,
  UA_LAYER_KEY,
  BLANK_OPTION
} from "./constants";
import {
  setInitialGeomStyle,
} from "./utils";

const InternalPanel = ({ state, setState }) => {
  const { falcor, falcorCache, pgEnv, baseUrl } = React.useContext(DamaContext);
  // console.log("internal panel state::", state)
  //if a layer is selected, use the source_id to get all the associated views
  let symbologyLayerPath = "";
  if (state.symbologies) {
    const symbName = Object.keys(state.symbologies)[0];
    const pathBase = `symbologies['${symbName}']`;
    symbologyLayerPath = `${pathBase}.symbology.layers`;
  } else {
    symbologyLayerPath = `symbology.layers`;
  }
  const {
    pluginDataPath,
    pm3LayerId,
    mpoLayerId,
    countyLayerId,
    regionLayerId,
    uaLayerId,
  } = useMemo(() => {
    const pluginDataPath = `symbology.pluginData.macroview`;
    return {
      pluginDataPath,
      pm3LayerId: get(
        state,
        `${pluginDataPath}['active-layers'][${PM3_LAYER_KEY}]`
      ),
      mpoLayerId: get(
        state,
        `${pluginDataPath}['active-layers'][${MPO_LAYER_KEY}]`
      ),
      countyLayerId: get(
        state,
        `${pluginDataPath}['active-layers'][${COUNTY_LAYER_KEY}]`
      ),
      regionLayerId: get(
        state,
        `${pluginDataPath}['active-layers'][${REGION_LAYER_KEY}]`
      ),
      uaLayerId: get(
        state,
        `${pluginDataPath}['active-layers'][${UA_LAYER_KEY}]`
      ),
    };
  }, [state]);

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

    if (pm3LayerId) {
      const source_id = get(state, `symbology.layers[${pm3LayerId}].source_id`);

      //demo'd with source 1410 `pm3`
      if (source_id) {
        getRelatedPm3Views(source_id);
      }
    }
  }, [pm3LayerId]);

  useEffect(() => {
    if(pm3LayerId) { 
      setState(draft => {
        set(draft, `${symbologyLayerPath}['${pm3LayerId}'].layers[0].paint['line-width']`, 0);
      })
    }
  },[pm3LayerId])

  //Set initial styles for geometry borders
  //also disables popovers
  useEffect(() => {
    if (mpoLayerId) {
      setInitialGeomStyle({
        setState,
        layerId: mpoLayerId,
        layerBasePath: symbologyLayerPath,
      });

      setState(draft => {
        set(draft, `${symbologyLayerPath}['${mpoLayerId}'].hover`, "");
      })
    }
  }, [mpoLayerId]);
  useEffect(() => {
    if (countyLayerId) {
      setInitialGeomStyle({
        setState,
        layerId: countyLayerId,
        layerBasePath: symbologyLayerPath,
      });
      setState(draft => {
        set(draft, `${symbologyLayerPath}['${countyLayerId}'].hover`, "");
      })
    }
  }, [countyLayerId]);
  useEffect(() => {
    if (regionLayerId) {
      setInitialGeomStyle({
        setState,
        layerId: regionLayerId,
        layerBasePath: symbologyLayerPath,
      });
      setState(draft => {
        set(draft, `${symbologyLayerPath}['${regionLayerId}'].hover`, "");
      })
    }
  }, [regionLayerId]);
  useEffect(() => {
    if (uaLayerId) {
      setInitialGeomStyle({
        setState,
        layerId: uaLayerId,
        layerBasePath: symbologyLayerPath,
      });
      setState(draft => {
        set(draft, `${symbologyLayerPath}['${uaLayerId}'].hover`, "");
      })
    }
  }, [uaLayerId]);

  const views = useMemo(() => {
    if (pm3LayerId) {
      const source_id = get(state, `symbology.layers[${pm3LayerId}].source_id`);

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
  }, [falcorCache, pm3LayerId, pgEnv]);

  const borderLayerIds = [mpoLayerId, countyLayerId, pm3LayerId, regionLayerId, uaLayerId];
  return [
    {
      label: "PM3 Layer",
      controls: [
        {
          type: "select",
          params: {
            //TODO -- may need to more creatively filter out layers that are already being used by this/other plugin
            options: [
              BLANK_OPTION,
              ...Object.keys(state.symbology.layers)
                .filter(
                  (layerKey) =>
                    !borderLayerIds.includes(layerKey) ||
                    layerKey === pm3LayerId
                )
                .map((layerKey, i) => ({
                  value: layerKey,
                  name: state.symbology.layers[layerKey].name,
                })),
            ],
            default: "",
          },
          //the layer the plugin controls MUST use the `'active-layers'` path/field
          path: `['active-layers'][${PM3_LAYER_KEY}]`,
        },
      ],
    },
    {
      label: "MPO Layer",
      controls: [
        {
          type: "select",
          params: {
            options: [
              BLANK_OPTION,
              ...Object.keys(state.symbology.layers)
                .filter(
                  (layerKey) =>
                    !borderLayerIds.includes(layerKey) ||
                    layerKey === mpoLayerId
                )
                .map((layerKey, i) => ({
                  value: layerKey,
                  name: state.symbology.layers[layerKey].name,
                })),
            ],
            default: "",
          },
          //the layer the plugin controls MUST use the `'active-layers'` path/field
          path: `['active-layers'][${MPO_LAYER_KEY}]`,
        },
      ],
    },
    {
      label: "County Layer",
      controls: [
        {
          type: "select",
          params: {
            options: [
              BLANK_OPTION,
              ...Object.keys(state.symbology.layers)
                .filter(
                  (layerKey) =>
                    !borderLayerIds.includes(layerKey) ||
                    layerKey === countyLayerId
                )
                .map((layerKey, i) => ({
                  value: layerKey,
                  name: state.symbology.layers[layerKey].name,
                })),
            ],
            default: "",
          },
          //the layer the plugin controls MUST use the `'active-layers'` path/field
          path: `['active-layers'][${COUNTY_LAYER_KEY}]`,
        },
      ],
    },
    {
      label: "Region Layer",
      controls: [
        {
          type: "select",
          params: {
            options: [
              BLANK_OPTION,
              ...Object.keys(state.symbology.layers)
                .filter(
                  (layerKey) =>
                    !borderLayerIds.includes(layerKey) ||
                    layerKey === regionLayerId
                )
                .map((layerKey, i) => ({
                  value: layerKey,
                  name: state.symbology.layers[layerKey].name,
                })),
            ],
            default: "",
          },
          //the layer the plugin controls MUST use the `'active-layers'` path/field
          path: `['active-layers'][${REGION_LAYER_KEY}]`,
        },
      ],
    },
    {
      label: "UA Layer",
      controls: [
        {
          type: "select",
          params: {
            options: [
              BLANK_OPTION,
              ...Object.keys(state.symbology.layers)
                .filter(
                  (layerKey) =>
                    !borderLayerIds.includes(layerKey) ||
                    layerKey === uaLayerId
                )
                .map((layerKey, i) => ({
                  value: layerKey,
                  name: state.symbology.layers[layerKey].name,
                })),
            ],
            default: "",
          },
          //the layer the plugin controls MUST use the `'active-layers'` path/field
          path: `['active-layers'][${UA_LAYER_KEY}]`,
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
          //the layer the plugin controls MUST use the `'active-layers'` path/field
          path: `['hover']`,
        },
      ],
    },
    pm3LayerId
      ? {
          label: "Views",
          controls: [
            {
              type: "multiselect",
              params: {
                options: [
                  BLANK_OPTION,
                  ...views.map((view) => ({
                    name: view.version || view.view_id,
                    value: view.view_id,
                  })),
                ],
                default: [],
                placeholder: "Select views to include...",
              },
              //the layer the plugin controls MUST use the `'active-layers'` path/field
              path: `['views']`,
            },
          ],
        }
      : {},
  ];
};

export {
  InternalPanel
}