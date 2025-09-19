import get from "lodash/get";
import set from "lodash/set";

const setGeometryBorderFilter = ({
  setState,
  layerId,
  geomDataKey,
  values,
  layerBasePath,
}) => {
  setState((draft) => {
    set(draft, `${layerBasePath}['${layerId}']['isVisible']`, true);

    const draftLayers = get(draft, `${layerBasePath}['${layerId}'].layers`);
    draftLayers.forEach((d, i) => {
      d.layout = { visibility: "visible" };
    });
    const geographyFilter = {
      columnName: geomDataKey,
      value: values,
      operator: "==",
    };
    set(
      draft,
      `${layerBasePath}['${layerId}']['filter']['${geomDataKey}']`,
      geographyFilter
    );
  });
};

const resetGeometryBorderFilter = ({ setState, layerId, layerBasePath }) => {
  setState((draft) => {
    set(draft, `${layerBasePath}['${layerId}']['isVisible']`, false);

    const draftLayers = get(draft, `${layerBasePath}['${layerId}'].layers`);
    draftLayers?.forEach((d, i) => {
      d.layout = { visibility: "none" };
    });
  });
};

const setInitialGeomStyle = ({ setState, layerId, layerBasePath }) => {
  setState((draft) => {
    const draftLayers = get(draft, `${layerBasePath}['${layerId}'].layers`);
    const borderLayer = draftLayers.find(
      (mapLayer) => mapLayer.type === "line"
    );
    if (borderLayer) {
      borderLayer.paint = { "line-color": "#fff", "line-width": 1 };
    }
    const fillLayer = draftLayers.find((mapLayer) => mapLayer.type === "fill");
    if (fillLayer) {
      fillLayer.paint = { "fill-opacity": 0, "fill-color": "#fff" };
    }
    draftLayers.forEach((d, i) => {
      d.layout = { visibility: "none" };
    });
  });
};

function onlyUnique(value, index, array) {
  return array.indexOf(value) === index;
}

export {
  setGeometryBorderFilter,
  resetGeometryBorderFilter,
  setInitialGeomStyle,
  onlyUnique,
};
