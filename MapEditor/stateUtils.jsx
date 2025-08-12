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
    pluginData: get(state, `${pathBase}['pluginData']`, {}),
  };
};

export { extractState };
