import get from "lodash/get";
import {
  rgb2hex,
  toHex,
  categoricalColors,
  rangeColors,
} from "./components/LayerManager/utils";
import colorbrewer from "./components/LayerManager/colors"; //"colorbrewer"

const extractState = (state) => {
  const activeLayerId = state?.symbology?.activeLayer;
  const selectedInteractiveFilterIndex = get(
    state,
    `symbology.layers[${activeLayerId}]['selectedInteractiveFilterIndex']`,
    0
  );
  const isInteractiveLayer =
    state?.symbology?.layers?.[activeLayerId]?.[
      "layer-type"
    ] === "interactive";
  const pathBase = isInteractiveLayer
    ? `symbology.layers[${activeLayerId}]['interactive-filters'][${selectedInteractiveFilterIndex}]`
    : `symbology.layers[${activeLayerId}]`;

  const polygonLayerType = get(state, `${pathBase}['type']`, {});
  const paintPaths = {
    fill: "layers[1].paint['fill-color']",
    circle: "layers[0].paint['circle-color']",
    line: "layers[1].paint['line-color']",
  };
  const layerType = get(state, `${pathBase}['layer-type']`, {});
  let layerPaintPath = paintPaths[polygonLayerType];

  if (layerType === "circles") {
    layerPaintPath = "layers[0].paint['circle-radius']";
  }
  const pluginData = get(state, `symbology.pluginData`, {});
  const isActiveLayerPlugin = (Object.values(pluginData) || []).some(plugData => plugData.activeLayer === activeLayerId)
  return {
    pathBase,
    isInteractiveLayer,
    activeLayerId,
    activeLayer: get(state,`symbology.layers[${state.symbology.activeLayer}]`),
    layerPaintPath,
    layerType,
    viewId: get(
      state,
      `symbology.layers[${activeLayerId}].view_id`
    ),
    sourceId: get(
      state,
      `symbology.layers[${activeLayerId}].source_id`
    ),
    paintValue: get(state, `${pathBase}.${layerPaintPath}`, {}),
    baseDataColumn: get(
      state,
      `symbology.layers[${activeLayerId}]['data-column']`,
      ""
    ),
    breaks: get(state, `${pathBase}['choroplethdata']['breaks']`, []),
    column: get(state, `${pathBase}['data-column']`, ""),
    categories: get(state, `${pathBase}['categories']`, {}),
    categorydata: get(state, `${pathBase}['category-data']`, {}),
    choroplethdata: get(state, `${pathBase}['choroplethdata']`),
    colors: get(state, `${pathBase}['color-set']`, categoricalColors["cat1"]),
    colorrange: get(
      state,
      `${pathBase}['color-range']`,
      colorbrewer["seq1"][9]
    ),
    numbins: get(state, `${pathBase}['num-bins']`, 9),
    method: get(state, `${pathBase}['bin-method']`, "ckmeans"),
    numCategories: get(state, `${pathBase}['num-categories']`, 10),
    showOther: get(state, `${pathBase}['category-show-other']`, "#ccc"),
    symbology_id: get(state, `symbology_id`),
    filter: get(state, `${pathBase}['filter']`, false),
    filterGroupEnabled: get(state, `${pathBase}['filterGroupEnabled']`, false),
    filterGroupLegendColumn: get(
      state,
      `${pathBase}['filter-group-legend-column']`
    ),
    viewGroupEnabled: get(state, `${pathBase}['viewGroupEnabled']`, false),
    viewGroupId: get(state, `${pathBase}['view-group-id']`),
    initialViewId: get(state, `${pathBase}['initial-view-id']`),
    legendOrientation: get(
      state,
      `${pathBase}['legend-orientation']`,
      "vertical"
    ),
    minRadius: get(state, `${pathBase}['min-radius']`, 8),
    maxRadius: get(state, `${pathBase}['max-radius']`, 128),
    lowerBound: get(state, `${pathBase}['lower-bound']`, null),
    upperBound: get(state, `${pathBase}['upper-bound']`, null),
    radiusCurve: get(state, `${pathBase}['radius-curve']`, "linear"),
    curveFactor: get(state, `${pathBase}['curve-factor']`, 1),
    legendData: get(state, `${pathBase}['legend-data']`),
    pluginData,
    isActiveLayerPlugin,
    controllingPluginName: (Object.keys(pluginData) || []).find(pluginName => pluginData[pluginName].activeLayer === activeLayerId),
    existingDynamicFilter: get(
      state,
      `symbology.layers[${state.symbology.activeLayer}]['dynamic-filters']`,
      []
    ),
  };
};

const fetchBoundsForFilter = async (state, falcor, pgEnv, dynamicFilter) => {
  const { viewId, filter } = extractState(state)
  //dont need to do change detection here. This function is called from inside a use-effect
  const filterEqualOptions = {};
  dynamicFilter.reduce((acc, curr) => {
    acc[curr.column_name] = curr.values;
    return acc;
  }, filterEqualOptions)
  
  Object.keys(filter)
    .filter((filtKey) => filter[filtKey].operator === "==")
    .reduce((acc, curr) => {
      acc[curr] = filter[curr].value;
      return acc;
    }, filterEqualOptions);

  const filterOtherOptions = {};

  //TODO -- how to pass `!=`, or `between`
  Object.keys(filter)
    .reduce((acc, filtKey) => {
      if(filter[filtKey].operator === ">=") {
        if(!acc["gte"]) {
          acc['gte'] = {};
        }
        acc['gte'] = {...acc['gte'], [filter[filtKey].columnName]: filter[filtKey].value}
      } else if(filter[filtKey].operator === ">") {
        if(!acc["gt"]) {
          acc['gt'] = {};
        }
        acc['gt'] = {...acc['gt'], [filter[filtKey].columnName]: filter[filtKey].value}
      } else if(filter[filtKey].operator === "<=") {
        if(!acc["lte"]) {
          acc['lte'] = {};
        }
        acc['lte'] = {...acc['lte'], [filter[filtKey].columnName]: filter[filtKey].value}
      } else if(filter[filtKey].operator === "<") {
        if(!acc["lt"]) {
          acc['lt'] = {};
        }
        acc['lt'] = {...acc['lt'], [filter[filtKey].columnName]: filter[filtKey].value}
      }
      return acc;
    }, filterOtherOptions);

  const newOptions = JSON.stringify({
    filter: { ...filterEqualOptions },
    ...filterOtherOptions
  })
  const resp = await falcor.get([
    'dama',pgEnv,'viewsbyId', viewId, 'options', newOptions, 'databyIndex',{ },['ST_AsGeojson(ST_Extent(wkb_geometry)) as bextent']
  ]);
  const newExtent = get(resp, ['json','dama',pgEnv,'viewsbyId', viewId, 'options', newOptions, 'databyIndex',0,['ST_AsGeojson(ST_Extent(wkb_geometry)) as bextent'] ])
  return newExtent;
}
export { extractState, fetchBoundsForFilter };
