import React, {
  useState,
  useEffect,
  useMemo,
  createContext,
  useRef,
} from "react";
import get from "lodash/get";
import set from "lodash/set";
import isEqual from "lodash/isEqual";
import { format as d3format } from "d3-format";
import { extractState, createFalcorFilterOptions } from "../../stateUtils";
import {
  filters,
  updateSubMeasures,
  getMeasure,
  getColorRange,
  updateLegend,
} from "./updateFilters";
import { DamaContext } from "../../../store";
import { CMSContext } from "~/modules/dms/src";
import { usePrevious } from "../../components/LayerManager/utils";
import { choroplethPaint } from "../../components/LayerEditor/datamaps";
import { npmrdsPaint } from "./paint";

import {
  REGION_CODE_TO_NAME,
  UA_CODE_TO_NAME,
  PM3_LAYER_KEY,
  MPO_LAYER_KEY,
  COUNTY_LAYER_KEY,
  REGION_LAYER_KEY,
  UA_LAYER_KEY,
  BLANK_OPTION,
} from "./constants";

import {
  setGeometryBorderFilter,
  resetGeometryBorderFilter,
  onlyUnique,
} from "./utils";

const ExternalPanel = ({ state, setState, pathBase = "" }) => {
  const dctx = React.useContext(DamaContext);
  const cctx = React.useContext(CMSContext);
  const ctx = dctx?.falcor ? dctx : cctx;
  let { falcor, falcorCache, pgEnv, baseUrl } = ctx;

  if (!falcorCache) {
    falcorCache = falcor.getCache();
  }
  //const {falcor, falcorCache, pgEnv, baseUrl} = React.useContext(DamaContext);
  //performence measure (speed, lottr, tttr, etc.) (External Panel) (Dev hard-code)
  //"second" selection (percentile, amp/pmp) (External Panel) (dependent on first selection, plus dev hard code)
  const pluginDataPath =`${pathBase}`;

  const pluginData = useMemo(() => {
    return get(state, pluginDataPath, {});
  }, [state]);

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

  const {
    views,
    viewId,
    geography,
    measureFilters,
    pm3LayerId,
    mpoLayerId,
    countyLayerId,
    regionLayerId,
    uaLayerId
  } = useMemo(() => {
    return {
      views: get(state, `${pluginDataPath}['views']`, []),
      viewId: get(state, `${pluginDataPath}['viewId']`, null),
      geography: get(state, `${pluginDataPath}['geography']`, null),
      measureFilters: get(
        state,
        `${pluginDataPath}['measureFilters']`,
        filters
      ),
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
  }, [pluginData, pluginDataPath]);

  const {
    symbology_id,
    existingDynamicFilter,
    filter: dataFilter,
    filterMode,
  } = useMemo(() => {
    if (dctx) {
      return extractState(state);
    } else {
      const symbName = Object.keys(state.symbologies)[0];
      const symbPathBase = `symbologies['${symbName}']`;
      const symbData = get(state, symbPathBase, {});
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

        set(
          draft,
          `${symbologyLayerPath}['${pm3LayerId}']['filterMode']`,
          "any"
        );
      });
    };

    if (geography?.length > 0) {
      //get zoom bounds
      getFilterBounds();
      //filter and display borders for selected geographie

      // //set "mpo" display to enabled
      const selectedMpo = geography.filter((geo) => geo.type === "mpo_name");
      if (selectedMpo.length > 0 && mpoLayerId) {
        //SOURCE 997 view 1992 MPO Boundaries
        setGeometryBorderFilter({
          setState,
          layerId: mpoLayerId,
          geomDataKey: "mpo_name",
          values: selectedMpo.map((mpo) => mpo.value),
          layerBasePath: symbologyLayerPath,
        });
      } else {
        if (mpoLayerId) {
          resetGeometryBorderFilter({
            layerId: mpoLayerId,
            setState,
            layerBasePath: symbologyLayerPath,
          });
        }
      }

      const selectedCounty = geography.filter((geo) => geo.type === "county");
      if (selectedCounty.length > 0 && countyLayerId) {
        //SOURCE 1060 view 2117 NY County Statistics (x1989)
        setGeometryBorderFilter({
          setState,
          layerId: countyLayerId,
          geomDataKey: "ny_counti_4",
          values: selectedCounty.map((county) => {
            const lowCountyString = county.value.toLowerCase();
            return lowCountyString[0].toUpperCase() + lowCountyString.slice(1);
          }),
          layerBasePath: symbologyLayerPath,
        });
      } else {
        if (countyLayerId) {
          console.log("reserting filter for county::", countyLayerId)
          resetGeometryBorderFilter({
            layerId: countyLayerId,
            setState,
            layerBasePath: symbologyLayerPath,
          });
        }
      }

      const selectedRegion = geography.filter(
        (geo) => geo.type === "region_code"
      );
      if (selectedRegion.length > 0 && regionLayerId) {
        //SOURCE 1497 view 4135 nysdot_regions
        console.log({selectedRegion})
        setGeometryBorderFilter({
          setState,
          layerId: regionLayerId,
          geomDataKey: "region",
          values: selectedRegion.map((regionCode) =>
            regionCode.value
          ),
          layerBasePath: symbologyLayerPath,
        });
      } else {
        if (regionLayerId) {
          console.log("reserting filter for region::", regionLayerId)
          resetGeometryBorderFilter({
            layerId: regionLayerId,
            setState,
            layerBasePath: symbologyLayerPath,
          });
        }
      }

      const selectedUa = geography.filter(
        (geo) => geo.type === "urban_code"
      );
      console.log({geography, selectedUa})
      if (selectedUa.length > 0 && uaLayerId) {
        console.log("inside setting border filter", selectedUa)
        //SOURCE 1493 view 2663 ua_boundaries
        setGeometryBorderFilter({
          setState,
          layerId: uaLayerId,
          geomDataKey: "uace_20",
          values: selectedUa.map((uaCode) =>
            {
              let paddedCode = uaCode.value;
              const codeLength = uaCode.value.length;
              const lengthDiff = 5 - codeLength;
              if(lengthDiff !== 0) {
                for(let i = 0; i < lengthDiff; i++) {
                  paddedCode = "0" + paddedCode
                }
              }
              console.log({paddedCode})
              return paddedCode;
            }
          ),
          layerBasePath: symbologyLayerPath,
        });
      } else {
        console.log("trying to reset UA filter")
        if (uaLayerId) {
          console.log("reserting filter for UA::", uaLayerId)
          resetGeometryBorderFilter({
            layerId: uaLayerId,
            setState,
            layerBasePath: symbologyLayerPath,
          });
        }
      }
    } else {
      //resets dynamic filter if there are no geographies selected
      setState((draft) => {
        const zoomToFilterBounds = get(draft, `${symbPath}.zoomToFilterBounds`);
        if (zoomToFilterBounds?.length > 0) {
          set(draft, `${symbPath}.zoomToFilterBounds`, []);

          set(
            draft,
            `${symbologyLayerPath}['${pm3LayerId}']['dynamic-filters']`,
            []
          );
        }

        if (pm3LayerId) {
          set(
            draft,
            `${symbologyLayerPath}['${pm3LayerId}']['filterMode']`,
            null
          );
        }
        if (countyLayerId) {
          resetGeometryBorderFilter({
            layerId: countyLayerId,
            setState,
            layerBasePath: symbologyLayerPath,
          });
        }
        if (mpoLayerId) {
          resetGeometryBorderFilter({
            layerId: mpoLayerId,
            setState,
            layerBasePath: symbologyLayerPath,
          });
        }
        if (regionLayerId) {
          resetGeometryBorderFilter({
            layerId: regionLayerId,
            setState,
            layerBasePath: symbologyLayerPath,
          });
        }
        if (uaLayerId) {
          resetGeometryBorderFilter({
            layerId: uaLayerId,
            setState,
            layerBasePath: symbologyLayerPath,
          });
        }
      });
    }
  }, [geography]);

  //geography selector
  //mpos/regions/counties/ua/state
  const geomOptions = JSON.stringify({
    groupBy: ["urban_code", "region_code", "mpo_name", "county"],
  });
  useEffect(() => {
    const getGeoms = async () => {
      await falcor.get([
        "dama",
        pgEnv,
        "viewsbyId",
        viewId,
        "options",
        geomOptions,
        "databyIndex",
        { from: 0, to: 200 },
        ["urban_code", "region_code", "mpo_name", "county"],
      ]);
    };

    if (viewId) {
      getGeoms();
    }
  }, [viewId]);

  const geomControlOptions = useMemo(() => {
    const geomData = get(falcorCache, [
      "dama",
      pgEnv,
      "viewsbyId",
      viewId,
      "options",
      geomOptions,
      "databyIndex",
    ]);
    if (geomData) {
      const geoms = {
        urban_code: [],
        region_code: [],
        mpo_name: [],
        county: [],
        state: "NY",
      };

      Object.values(geomData).forEach((da) => {
        geoms.urban_code.push(da.urban_code);
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
      const objectFilter = (da) => typeof da !== "object";
      const truthyFilter = (val) => !!val;
      geoms.urban_code = geoms.urban_code
        .filter(onlyUnique)
        .filter(objectFilter)
        .filter(truthyFilter)
        .map((da) => ({ 
          name: UA_CODE_TO_NAME[da] + " UA",
          value: da,
          type: "urban_code" 
        }))
        .sort(nameSort);
      geoms.region_code = geoms.region_code
        .filter(onlyUnique)
        .filter(objectFilter)
        .filter(truthyFilter)
        .map((da) => ({
          name: REGION_CODE_TO_NAME[da],
          value: da,
          type: "region_code",
        }))
        .sort(nameSort);
      geoms.mpo_name = geoms.mpo_name
        .filter(onlyUnique)
        .filter(objectFilter)
        .filter(truthyFilter)
        .map((da) => ({ name: da + " MPO", value: da, type: "mpo_name" }))
        .sort(nameSort);
      geoms.county = geoms.county
        .filter(onlyUnique)
        .filter(objectFilter)
        .filter(truthyFilter)
        .map((da) => ({
          name: da.toLowerCase() + " County",
          value: da,
          type: "county",
        }))
        .sort(nameSort);

      return [
        ...geoms.county,
        ...geoms.mpo_name,
        ...geoms.urban_code,
        ...geoms.region_code,
      ];
    } else {
      return [];
    }
  }, [falcorCache]);

  //transform from filters into plugin inputs
  const measureControls = Object.keys(measureFilters)
    .filter((mFilterKey) => measureFilters[mFilterKey].active)
    .sort((keyA, keyB) => {
      const { order: orderA } = measureFilters[keyA];
      const { order: orderB } = measureFilters[keyB];
      if (!orderA && !orderB) {
        return 0;
      } else if (!orderA) {
        return -1;
      } else if (!orderB) {
        return 1;
      } else {
        return orderA - orderB;
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
            searchable: true,
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
            options: [...views],
            default: views[0],
          },
          path: `['viewId']`,
        },
      ],
    },
    ...measureControls,
  ];

  const prevMeasureFilters = usePrevious(measureFilters["measure"]);

  useEffect(() => {
    //this is probably infinity render
    setState((draft) => {
      set(
        draft,
        `${pluginDataPath}['measureFilters']`,
        updateSubMeasures(measureFilters)
      );
    });
  }, [isEqual(measureFilters["measure"], prevMeasureFilters)]);

  const newDataColumn = useMemo(() => {
    return getMeasure(measureFilters);
  }, [measureFilters]);

  const falcorDataFilter = useMemo(() => {
    return createFalcorFilterOptions({
      dynamicFilter: existingDynamicFilter,
      filterMode,
      dataFilter,
    });
  }, [existingDynamicFilter, filterMode, dataFilter]);

  useEffect(() => {
    const getColors = async () => {
      const numbins = 7,
        method = "ckmeans";
      const domainOptions = {
        column: newDataColumn,
        viewId: parseInt(viewId),
        numbins,
        method,
        dataFilter: falcorDataFilter,
      };

      const showOther = "#ccc";
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
      const { range: paintRange, format } = updateLegend(measureFilters);
      let { paint, legend } = choroplethPaint(
        newDataColumn,
        colorBreaks["max"],
        paintRange,
        numbins,
        method,
        colorBreaks["breaks"],
        showOther,
        "vertical"
      );

      const legendFormat = d3format(format);
      legend = legend.map((legendBreak) => {
        const shouldFormat =
          !newDataColumn.toLowerCase().includes("phed") &&
          !newDataColumn.toLowerCase().includes("ted");
        return {
          ...legendBreak,
          label: shouldFormat
            ? legendFormat(legendBreak.label.split("- ")[1])
            : legendBreak.label.split("- ")[1],
        };
      });

      setState((draft) => {
        set(
          draft,
          `${symbologyLayerPath}['${pm3LayerId}']['layers'][1]['paint']`,
          { ...npmrdsPaint, "line-color": paint }
        ); //Mapbox paint
        set(
          draft,
          `${symbologyLayerPath}['${pm3LayerId}']['legend-data']`,
          legend
        ); //AVAIL-written legend component
        set(
          draft,
          `${symbologyLayerPath}['${pm3LayerId}']['legend-orientation']`,
          "horizontal"
        );
        set(
          draft,
          `${symbologyLayerPath}['${pm3LayerId}']['category-show-other']`,
          "#fff"
        );
        if (mpoLayerId) {
          set(
            draft,
            `${symbologyLayerPath}['${mpoLayerId}']['legend-orientation']`,
            "none"
          );
        }
        if (countyLayerId) {
          set(
            draft,
            `${symbologyLayerPath}['${countyLayerId}']['legend-orientation']`,
            "none"
          );
        }
        if (regionLayerId) {
          set(
            draft,
            `${symbologyLayerPath}['${regionLayerId}']['legend-orientation']`,
            "none"
          );
        }
        if (uaLayerId) {
          set(
            draft,
            `${symbologyLayerPath}['${uaLayerId}']['legend-orientation']`,
            "none"
          );
        }
        //TODO add `no legend` for region, UA layers
      });
    };

    if (pm3LayerId && viewId) {
      getColors();
    }
  }, [newDataColumn, falcorDataFilter, viewId, pm3LayerId]);

  return controls;
};

export { ExternalPanel };
