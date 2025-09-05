import React, { useState, useEffect, useMemo, createContext, useRef } from "react"
import get from "lodash/get"
import set from "lodash/set"
import isEqual from "lodash/isEqual"
import { format as d3format } from "d3-format"
import omit from "lodash/omit"
import mapboxgl from "maplibre-gl";
import { extractState, createFalcorFilterOptions } from '../../stateUtils';
import { filters, updateSubMeasures, getMeasure, getColorRange, updateLegend } from "./updateFilters"
import { DamaContext } from "../../../store"
import { CMSContext } from '~/modules/dms/src'
import { getAttributes } from "~/pages/DataManager/Collection/attributes";
import { ViewAttributes } from "../../../Source/attributes"
import { usePrevious } from "../../components/LayerManager/utils";
import { choroplethPaint } from '../../components/LayerEditor/datamaps'
import { npmrdsPaint } from "./paint"
import { REGION_CODE_TO_NAME } from "./constants"
const PM3_LAYER_KEY = "pm3";
const MPO_LAYER_KEY = "mpo";
const COUNTY_LAYER_KEY = "county";
const REGION_LAYER_KEY = 'region'

const setGeometryBorderFilter = ({setState, layerId, geomDataKey, values, layerBasePath}) => {
  setState(draft => {
    set(
      draft,
      `${layerBasePath}['${layerId}']['isVisible']`,
      true
    );

    const draftLayers = get(draft, `${layerBasePath}['${layerId}'].layers`);
    draftLayers.forEach((d,i) => {
      d.layout =  { "visibility": 'visible' }
    })
    const geographyFilter = {
      columnName: geomDataKey,
      value: values,
      operator: "=="
    };
    set(
      draft,
      `${layerBasePath}['${layerId}']['filter']['${geomDataKey}']`,
      geographyFilter
    );
  })
}

const resetGeometryBorderFilter = ({setState, layerId, layerBasePath}) => {
  setState(draft => {
    set(
      draft,
      `${layerBasePath}['${layerId}']['isVisible']`,
      false
    );

    const draftLayers = get(draft, `${layerBasePath}['${layerId}'].layers`);
    draftLayers.forEach((d,i) => {
      console.log(JSON.parse(JSON.stringify(d)))
      d.layout =  { "visibility": 'none' }
    })
  })
}

//TODO 9/4 11am -- this mutates directly, not via path
const setInitialGeomStyle = ({setState, layerId, layerBasePath}) => {
  setState(draft => {
    const draftLayers = get(draft, `${layerBasePath}['${layerId}'].layers`);
    const borderLayer = draftLayers.find(mapLayer => mapLayer.type === 'line')
    borderLayer.paint = {"line-color": '#fff', "line-width": 1}

    draftLayers.forEach((d,i) => {
      d.layout =  { "visibility": 'none' }
    });
  })
}

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
      let pluginDataPath = '';

      //state.symbologies indicates that the map context is DMS
      if(state.symbologies) {
        const symbName = Object.keys(state.symbologies)[0];
        const pathBase = `symbologies['${symbName}']`
        pluginDataPath = `${pathBase}.symbology.pluginData.macroview`
      } else {
        pluginDataPath = `symbology.pluginData.macroview`;
      }

      const newFilters = updateSubMeasures(filters);

      ///const pathBase = MapContext ? `symbologies['${symbName}']` : ``
      setState(draft => {
        set(draft, `${pluginDataPath}['measureFilters']`, newFilters);
        //set(draft, `${pathBase}.${layerPaintPath}`, npmrdsPaint); //Mapbox paint

        // const mpoLayerId = get(state, `${pluginDataPath}['active-layers'][${MPO_LAYER_KEY}]`);
        // const geography = get(state, `${pluginDataPath}['geography']`, null);
        // if(mpoLayerId) {
        //   const selectedMpo = geography.filter(geo => geo.type === "mpo_name");
        //   if(selectedMpo.length === 0) {
        //     set(
        //       draft,
        //       `symbology.layers[${mpoLayerId}]['isVisible']`,
        //       false
        //     );
        //     draft.symbology.layers[mpoLayerId].layers.forEach((d,i) => {
        //       draft.symbology.layers[mpoLayerId].layers[i].layout =  { "visibility": 'none' }
        //     })
        //   }
        // }
        
      })
    },
    dataUpdate: (map, state, setState) => {
      //console.log("---data update-----")
      //9/4 9:02am looks like data update does not fire for DMS map
      //console.log("testing old filters and json code")

      //console.log({filters})
      //updateSubMeasures(this.filters.measure.value, this.filters, falcor);

      let pluginDataPath = ''
      let symbologyDataPath = '';
      if(state.symbologies) {
        const symbName = Object.keys(state.symbologies)[0];
        const pathBase = `symbologies['${symbName}']`
        pluginDataPath = `${pathBase}.symbology.pluginData.macroview`;
        symbologyDataPath = `${pathBase}.symbology.layers`;
      } else {
        pluginDataPath = `symbology.pluginData.macroview`;
        symbologyDataPath = `symbology.layers`;
      }

      //console.log("plugin Data gets updated", { map, state, setState });
      const hover = get(state, `${pluginDataPath}['hover']`, "");
      const pm1 = get(state, `${pluginDataPath}['pm-1']`, null);
      const peak = get(state, `${pluginDataPath}['peak']`, null);
      const viewId = get(state, `${pluginDataPath}['viewId']`, null);
      const allPluginViews = get(state, `${pluginDataPath}['views']`, []);
      const geography = get(state, `${pluginDataPath}['geography']`, null);
      const pm3LayerId = get(state, `${pluginDataPath}['active-layers'][${PM3_LAYER_KEY}]`, null);
      const measureFilters = get(state, `${pluginDataPath}['measureFilters']`, filters)
      const pm3MapLayers = get(state, `${symbologyDataPath}['${pm3LayerId}'].layers`, null);
      const pm3MapSources = get(state, `${symbologyDataPath}['${pm3LayerId}'].sources`, null);
      const layerViewId = get(state, `${symbologyDataPath}['${pm3LayerId}'].view_id`, null);

      if(pm3LayerId && viewId) {
        //Update map with new viewId
        setState(draft => {
          //console.log("data update for plugin, draft::", JSON.parse(JSON.stringify(draft)));

          //9/4 9:36am TODO test that `pm3MapLayers[0]` still works in the mapEditor
          //tbh i am not totally sure how this worked in thefirst place. I prob just references the layers differently.
          const newLayer = JSON.parse(
            JSON.stringify(pm3MapLayers).replaceAll(
              layerViewId,
              viewId
            )
          );
          const newSources = JSON.parse(
            JSON.stringify(
              pm3MapSources
            ).replaceAll(layerViewId, viewId)
          );
          const newDataColumn = getMeasure(measureFilters);
          set(draft,`${symbologyDataPath}['${pm3LayerId}']['layers']` , newLayer)
          set(draft,`${symbologyDataPath}['${pm3LayerId}']['sources']` , newSources)
          set(draft,`${symbologyDataPath}['${pm3LayerId}']['view_id']` , viewId)

          set(draft,`${symbologyDataPath}['${pm3LayerId}']['hover']` , hover)
          set(draft, `${symbologyDataPath}['${pm3LayerId}']['data-column']`, newDataColumn); //must set data column, or else tiles will not have that data
        })
      } else if(pm3LayerId && !viewId && allPluginViews?.length > 0) {
        //if no view is selected, but there is at least 1 element in views, select that 1 element
        setState(draft => {
          set(draft, `${pluginDataPath}['viewId']`, allPluginViews[0].value);
        })
      }
    },
    internalPanel: ({ state, setState }) => {
      const {falcor, falcorCache, pgEnv, baseUrl} = React.useContext(DamaContext);
      // console.log("internal panel state::", state)
      //if a layer is selected, use the source_id to get all the associated views
      let symbologyLayerPath = '';
      if(state.symbologies) {
        const symbName = Object.keys(state.symbologies)[0];
        const pathBase = `symbologies['${symbName}']`
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
          const source_id = get(
            state,
            `symbology.layers[${pm3LayerId}].source_id`
          );

          if (source_id) {
            getRelatedPm3Views(source_id);
          }
        }
      }, [pm3LayerId]);

      //Set initial styles for geometry borders
      useEffect(() => {
        if(mpoLayerId) {
          setInitialGeomStyle({setState, layerId: mpoLayerId, layerBasePath: symbologyLayerPath})
        }
      }, [mpoLayerId]);
      useEffect(() => {
        if(countyLayerId) {
          setInitialGeomStyle({setState, layerId: countyLayerId, layerBasePath: symbologyLayerPath})
        }
      }, [countyLayerId]);
      useEffect(() => {
        if(regionLayerId) {
          setInitialGeomStyle({setState, layerId: regionLayerId,  layerBasePath: symbologyLayerPath})
        }
      }, [regionLayerId]);

      const views = useMemo(() => {
        if (pm3LayerId) {
          const source_id = get(
            state,
            `symbology.layers[${pm3LayerId}].source_id`
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
      }, [falcorCache, pm3LayerId, pgEnv]);

      const borderLayerIds = [mpoLayerId, countyLayerId, pm3LayerId, regionLayerId]
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
                  ...Object.keys(state.symbology.layers).filter(layerKey => !borderLayerIds.includes(layerKey) || layerKey === pm3LayerId).map((layerKey, i) => ({
                    value: layerKey,
                    name: state.symbology.layers[layerKey].name,
                  })),
                ],
                default: "",
              },
              //the layer the plugin controls MUST use the `activeLayer` path/field
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
                  ...Object.keys(state.symbology.layers).filter(layerKey => !borderLayerIds.includes(layerKey) || layerKey === mpoLayerId).map((layerKey, i) => ({
                    value: layerKey,
                    name: state.symbology.layers[layerKey].name,
                  })),
                ],
                default: "",
              },
              //the layer the plugin controls MUST use the `activeLayer` path/field
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
                  ...Object.keys(state.symbology.layers).filter(layerKey => !borderLayerIds.includes(layerKey) || layerKey === countyLayerId).map((layerKey, i) => ({
                    value: layerKey,
                    name: state.symbology.layers[layerKey].name,
                  })),
                ],
                default: "",
              },
              //the layer the plugin controls MUST use the `activeLayer` path/field
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
                  ...Object.keys(state.symbology.layers).filter(layerKey => !borderLayerIds.includes(layerKey) || layerKey === regionLayerId).map((layerKey, i) => ({
                    value: layerKey,
                    name: state.symbology.layers[layerKey].name,
                  })),
                ],
                default: "",
              },
              //the layer the plugin controls MUST use the `activeLayer` path/field
              path: `['active-layers'][${REGION_LAYER_KEY}]`,
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
        pm3LayerId ? {
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
    externalPanel: ({ state, setState, pathBase = "" }) => {
      const dctx = React.useContext(DamaContext);
      const cctx = React.useContext(CMSContext);
      const ctx = dctx?.falcor ? dctx : cctx;
      let { falcor, falcorCache, pgEnv, baseUrl } = ctx;

      if(!falcorCache) {
        falcorCache = falcor.getCache();
      }
      //const {falcor, falcorCache, pgEnv, baseUrl} = React.useContext(DamaContext);
      //performence measure (speed, lottr, tttr, etc.) (External Panel) (Dev hard-code)
      //"second" selection (percentile, amp/pmp) (External Panel) (dependent on first selection, plus dev hard code)
      const pluginDataPath = cctx ? `${pathBase}` : `${pathBase}`

      const pluginData = useMemo(() => {
        return get(state, pluginDataPath, {})
      }, [state]);

      let symbologyLayerPath = '';
      let symbPath = ''
      if(state.symbologies) {
        const symbName = Object.keys(state.symbologies)[0];
        const pathBase = `symbologies['${symbName}']`
        symbologyLayerPath = `${pathBase}.symbology.layers`;

        symbPath = `${pathBase}.symbology`
      } else {
        symbologyLayerPath = `symbology.layers`;
        symbPath = `symbology`
      }

      const { views, viewId, geography, measureFilters, pm3LayerId, mpoLayerId, countyLayerId, regionLayerId } = useMemo(() => {
        return {
          views: get(state, `${pluginDataPath}['views']`, []),
          viewId: get(state, `${pluginDataPath}['viewId']`, null),
          geography: get(state, `${pluginDataPath}['geography']`, null),
          measureFilters: get(state, `${pluginDataPath}['measureFilters']`, filters),
          pm3LayerId: get(state, `${pluginDataPath}['active-layers'][${PM3_LAYER_KEY}]`),
          mpoLayerId: get(state, `${pluginDataPath}['active-layers'][${MPO_LAYER_KEY}]`),
          countyLayerId: get(state, `${pluginDataPath}['active-layers'][${COUNTY_LAYER_KEY}]`),
          regionLayerId: get(state, `${pluginDataPath}['active-layers'][${REGION_LAYER_KEY}]`),
        };
      }, [pluginData, pluginDataPath]);

      const { symbology_id, existingDynamicFilter, filter:dataFilter, filterMode } = useMemo(() => {
        if(dctx) {
          return extractState(state);
        } else {
          const symbName = Object.keys(state.symbologies)[0];
          const symbPathBase = `symbologies['${symbName}']`;
          const symbData = get(state, symbPathBase, {})
          return extractState(symbData);
        }
      }, [state]);
      useEffect(() => {
        //TODO 9/4 9:51am
        //need to fix zoom stuff here, wrong path

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
              `${symbologyLayerPath}['${pm3LayerId}']['dynamic-filters']`,
              geographyFilter
            );

            set(draft, `${symbologyLayerPath}['${pm3LayerId}']['filterMode']`, 'any')
          });
        };

        if (geography?.length > 0) {
          //get zoom bounds
          getFilterBounds();
          //filter and display borders for selected geographie

          // //set "mpo" display to enabled
          const selectedMpo = geography.filter(geo => geo.type === "mpo_name")
          if(selectedMpo.length > 0 && mpoLayerId) {
            //SOURCE 997
            setGeometryBorderFilter({
              setState,
              layerId: mpoLayerId,
              geomDataKey: "mpo_name",
              values: selectedMpo.map((mpo) => mpo.value),
              layerBasePath: symbologyLayerPath
            });
          } else {
            if(mpoLayerId) {
              resetGeometryBorderFilter({layerId: mpoLayerId, setState, layerBasePath: symbologyLayerPath})
            }
          }

          const selectedCounty = geography.filter(geo => geo.type === "county")
          if(selectedCounty.length > 0 && countyLayerId) {
            //SOURCE 1060
            setGeometryBorderFilter({
              setState,
              layerId: countyLayerId,
              geomDataKey: "ny_counti_4",
              values: selectedCounty.map((county) => {
                const lowCountyString = county.value.toLowerCase();
                return (
                  lowCountyString[0].toUpperCase() + lowCountyString.slice(1)
                );
              }),
              layerBasePath: symbologyLayerPath
            });
          } else {
            if(countyLayerId) {
              resetGeometryBorderFilter({layerId: countyLayerId, setState, layerBasePath: symbologyLayerPath})
            }
          }

          const selectedRegion = geography.filter(geo => geo.type === "region_code")
          if(selectedRegion.length > 0 && regionLayerId) {
            //SOURCE 1025
            setGeometryBorderFilter({
              setState,
              layerId: regionLayerId,
              geomDataKey: "redc_ed_attn_objectid",
              values: selectedRegion.map((regionCode) => parseInt(regionCode.value)),
              layerBasePath: symbologyLayerPath
            });
          } else {
            if(regionLayerId) {
              resetGeometryBorderFilter({layerId: selectedRegion, setState, layerBasePath: symbologyLayerPath})
            }
          }
        } else {
          //resets dynamic filter if there are no geographies selected
          setState((draft) => {
            const zoomToFilterBounds = get(draft, `${symbPath}.zoomToFilterBounds`);
            if (zoomToFilterBounds?.length > 0) {
              set(draft, `${symbPath}.zoomToFilterBounds`, [])

              set(
                draft,
                `${symbologyLayerPath}['${pm3LayerId}']['dynamic-filters']`,
                []
              );
            }

            if(pm3LayerId) {
              set(draft, `${symbologyLayerPath}['${pm3LayerId}']['filterMode']`, null);
            }
            if (countyLayerId) {
              resetGeometryBorderFilter({layerId: countyLayerId, setState, layerBasePath: symbologyLayerPath})
            }
            if (mpoLayerId) {
              resetGeometryBorderFilter({layerId: mpoLayerId, setState, layerBasePath: symbologyLayerPath})
            }
            if(regionLayerId) {
              resetGeometryBorderFilter({layerId: regionLayerId, setState, layerBasePath: symbologyLayerPath})
            }
          });
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
          geoms.region_code = geoms.region_code.filter(onlyUnique).filter(objectFilter).filter(truthyFilter).map(da => ({name: REGION_CODE_TO_NAME[da], value: da, type:'region_code'})).sort(nameSort)
          geoms.mpo_name = geoms.mpo_name.filter(onlyUnique).filter(objectFilter).filter(truthyFilter).map(da => ({name: da + " MPO", value: da, type:'mpo_name'})).sort(nameSort)
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

      const controls = [
        {
          label: "Geography",
          controls: [
            {
              type: "multiselect",
              params: {
                options: [BLANK_OPTION, ...geomControlOptions],
                default: "",
                searchable: true
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

      const newDataColumn = useMemo(() => {
        return getMeasure(measureFilters);
      }, [measureFilters]);

      const falcorDataFilter = useMemo(()=> {
        return createFalcorFilterOptions({dynamicFilter:existingDynamicFilter, filterMode, dataFilter});
      }, [existingDynamicFilter, filterMode, dataFilter]);

      useEffect(() => {
        const getColors = async () => {
          const numbins = 7, method = 'ckmeans'
          const domainOptions = {
            column: newDataColumn,
            viewId: parseInt(viewId),
            numbins,
            method,
            dataFilter:falcorDataFilter
          };

          const showOther = '#ccc'
          const res = await falcor.get([
            "dama",
            pgEnv,
            "symbologies",
            "byId",
            [symbology_id],
            "colorDomain",
            "options",
            JSON.stringify(domainOptions),
          ]);
          const colorBreaks = get(res, [
            "json",
            "dama",
            pgEnv,
            "symbologies",
            "byId",
            [symbology_id],
            "colorDomain",
            "options",
            JSON.stringify(domainOptions),
          ]);
          //console.log({newDataColumn, max:colorBreaks['max'], colorange: getColorRange(7, "RdYlBu").reverse(), numbins, method, breaks:colorBreaks['breaks'], showOther, orientation:'vertical'})
          
          //format is used to format legend labels
          const {range: paintRange, format} = updateLegend(measureFilters);
          let { paint, legend } = choroplethPaint(newDataColumn, colorBreaks['max'], paintRange, numbins, method, colorBreaks['breaks'], showOther, 'vertical');

          const legendFormat = d3format(format);
          legend = legend.map(legendBreak => ({...legendBreak, label: legendFormat(legendBreak.label.split("- ")[1])}))
          //console.log({paint})
          //console.log({npmrdsPaint})
          setState(draft => {
            set(draft, `${symbologyLayerPath}['${pm3LayerId}']['layers'][1]['paint']`, {...npmrdsPaint, 'line-color':paint}); //Mapbox paint
            set(draft, `${symbologyLayerPath}['${pm3LayerId}']['legend-data']`, legend); //AVAIL-written legend component
            set(draft, `${symbologyLayerPath}['${pm3LayerId}']['legend-orientation']`, 'horizontal');
            set(draft, `${symbologyLayerPath}['${pm3LayerId}']['category-show-other']`, '#fff');
            set(draft, `${symbologyLayerPath}['${mpoLayerId}']['legend-orientation']`, 'none');
            set(draft, `${symbologyLayerPath}['${countyLayerId}']['legend-orientation']`, 'none');
          })
        };

        getColors();
      }, [newDataColumn, falcorDataFilter, viewId,]);

      return controls;
    },
    comp: () => {
      return <></>
      return( 
        <div
          className="flex flex-col pointer-events-auto drop-shadow-lg bg-neutral-100 p-4"
          style={{
            position: "absolute",
            bottom: "20px",
            left:"300px",
            color: "black",
            width: "500px",
            height: "500px",
          }}
        >
          <div className="m-2 border-b-4 border-black pb-2" ><div className="pb-2 px-1 bg-gray-300">Legend</div></div>
          <div className="m-2 border-b-4 border-black pb-2" ><div className="pb-2 px-1 bg-gray-300">TMC Search</div></div>
          <div className="m-2 border-b-4 border-black pb-2" ><div className="pb-2 px-1 bg-gray-300">Add Infobox</div></div>
          <div className="m-2 " ><div className="pb-2 px-1 bg-gray-300">INFOBOXES</div></div>
        </div>
      )
    },
    cleanup: (map, state, setState) => {
      map.off("click", MAP_CLICK);
    },
  }