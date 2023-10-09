import React from "react"

import get from "lodash/get"

import { DamaContext } from "~/pages/DataManager/store"

import { AvlLayer, getScale } from "~/modules/avl-map-2/src"

import SymbologyInfoBox from "./SymbologyInfoBox"

import { DAMA_HOST } from "~/config"

import SymbologyLegend from "./SymbologyLegend"

const SymbologyLayerRenderComponent = props => {

  const {
    maplibreMap,
    resourcesLoaded,
    setLayerVisibility,
    layer: avlLayer
  } = props;

  const symbology = get(props, ["layerProps", "symbology"], null);
  const activeViewId = get(props, ["layerProps", "activeViewId"], null);
  const activeLayerId = get(props, ["layerProps", "activeLayerId"], null);
  const activePaintProperty = get(props, ["layerProps", "activePaintProperty"], null);

  const [variables, setVariables] = React.useState([]);

  const activeView = React.useMemo(() => {
    return get(symbology, "views", [])
      .reduce((a, c) => {
        return c.viewId === activeViewId ? c : a;
      }, null)
  }, [symbology, activeViewId]);
  const activeLayer = React.useMemo(() => {
    return get(activeView, "layers", [])
      .reduce((a, c) => {
        return c.layerId === activeLayerId ? c : a;
      }, null);
  }, [activeView, activeLayerId]);

  React.useEffect(() => {
    if (!symbology || !activeView) {
      setVariables([]);
      return;
    }

    const variables = activeView.layers.reduce((a, c) => {
      return Object.keys(c.paintProperties)
        .reduce((aa, cc) => {
          const variable = get(c, ["paintProperties", cc, "variable"], null);
          if (variable) {
            aa.push(variable.variableId);
          }
          return aa;
        }, a);
    }, []);

    setVariables(variables);

  }, [symbology, activeView]);

  const [legend, setLegend] = React.useState(null);

  React.useEffect(() => {
    if (!maplibreMap) return;
    if (!resourcesLoaded) return;
    if (!activeLayer) return;

    let legend = null;

    avlLayer.layers.forEach(layer => {
      const defaultPaint = { ...get(layer, "paint", {}) };

      if (layer.id === activeLayer.layerId) {
        Object.keys(activeLayer.paintProperties)
          .forEach(ppId => {

            const paintProperty = get(activeLayer, ["paintProperties", ppId], {});

            const {
              value,
              paintExpression,
              variable
            } = paintProperty;

            if (value) {
              delete defaultPaint[ppId];
// console.log("SymbologyLayerRenderComponent::value", value);
              if (maplibreMap.getLayer(activeLayer.layerId)) {
                maplibreMap.setPaintProperty(activeLayer.layerId, ppId, value);
              }
            }
            else if (paintExpression) {
              // delete defaultPaint[ppId];
// console.log("SymbologyLayerRenderComponent::paintExpression", paintExpression);
            }
            else if (variable) {
              delete defaultPaint[ppId];
// console.log("SymbologyLayerRenderComponent::variable", variable);
              if (maplibreMap.getLayer(activeLayer.layerId)) {

                const { paintExpression, scale } = variable;

                if (ppId.includes("color")) {
                  legend = {
                    name: variable.displayName,
                    ...scale
                  };
                }

                maplibreMap.setPaintProperty(activeLayer.layerId, ppId, paintExpression);
              }
            }
          })
        setLayerVisibility(activeLayer.layerId, "visible");
      }
      else {
        setLayerVisibility(layer.id, "none");
      }

      Object.keys(defaultPaint)
        .forEach(ppId => {
          if (maplibreMap.getLayer(layer.id)) {
            maplibreMap.setPaintProperty(layer.id, ppId, defaultPaint[ppId]);
          }
        })
    });

    setLegend(legend);

  }, [maplibreMap, resourcesLoaded, activeLayer,
      setLayerVisibility, avlLayer
    ]
  )

  return !legend ? null : (
    <div className="p-1 pointer-events-auto bg-gray-100 rounded"
      style={ {
        width: "100%",
        maxWidth: "25rem"
      } }
    >
      <div className="bg-gray-300 border border-current rounded p-1">
        <div>
          { legend.name }
        </div>
        <div>
          <SymbologyLegend { ...legend }/>
        </div>
      </div>
    </div>
  );
}

const SymbologyInfoBoxHeader = props => {
  const symName = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "symbology", "name"], null) || "Unnamed Symbology"
  }, [props.layerProps]);
  return (
    <div>
      { symName }
    </div>
  )
}

const $HOST = `${ DAMA_HOST }/tiles`

const getValidSources = sources => {
  return sources.map(src => {
    const { id, source: { url, type } } = src;
    return {
      id,
      source: {
        type,
        url: url.replace("$HOST", $HOST)
      }
    }
  });
}

class SymbologyLayer extends AvlLayer {
  constructor(views) {
    super();

    this.id = "symbology-layer";
    this.name = "Symbology Layer";

    this.startActive = true;

    const [sources, layers] = views.reduce((a, c) => {
      const sources = get(c, ["metadata", "tiles", "sources"], []);
      a[0].push(...sources);
      const layers = get(c, ["metadata", "tiles", "layers"], [])
        .map(layer => ({ ...layer, layout: { visibility: "none" } }));
      a[1].push(...layers);
      return a;
    }, [[], []]);

    this.sources = getValidSources(sources);
    this.layers = layers;
  }
  RenderComponent = SymbologyLayerRenderComponent;
  infoBoxes = [
    { Header: SymbologyInfoBoxHeader,
      Component: SymbologyInfoBox
    }
  ]
}
export default SymbologyLayer;
