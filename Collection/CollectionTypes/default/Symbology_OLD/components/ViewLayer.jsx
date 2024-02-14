import React from "react"

import get from "lodash/get"

import { AvlLayer, hasValue } from "~/modules/avl-map-2/src"

const ViewLayerRenderComponent = props => {

  const {
    maplibreMap,
    layer: avlLayer,
    layerProps,
    resourcesLoaded,
    setLayerVisibility,
    allLayerProps
  } = props;

  const {
    symbologyLayer
  } = layerProps;

  const activeView = get(allLayerProps, ["symbology-layer", "activeView"], null);

  const visibility = React.useMemo(() => {
    if (!maplibreMap) return "none";
    if (!resourcesLoaded) return "none";
    if (!activeView) return "none";
    if (!symbologyLayer) return "none";
    return activeView.layers.includes(symbologyLayer) ? "visibile" : "none";
  }, [maplibreMap, resourcesLoaded, activeView, symbologyLayer]);

  React.useEffect(() => {
    if (!maplibreMap) return;
    if (!resourcesLoaded) return;
    if (!symbologyLayer) return;

    setLayerVisibility(symbologyLayer.uniqueId, visibility);
    if (visibility === "none") return;

    const [layer] = avlLayer.layers;

    const defaultPaint = { ...layer.paint };

    const ppIds = Object.keys(symbologyLayer.paintProperties);

    if (ppIds.length) {

      ppIds.forEach(ppId => {

        const {
          value,
          paintExpression,
          variable
        } = get(symbologyLayer, ["paintProperties", ppId], {});

        if (hasValue(value)) {
          delete defaultPaint[ppId];
          maplibreMap.setPaintProperty(layer.id, ppId, value);
        }
        else if (paintExpression) {
          delete defaultPaint[ppId];
          maplibreMap.setPaintProperty(layer.id, ppId, paintExpression);
        }
        else if (variable) {
          delete defaultPaint[ppId];

          const { paintExpression, scale } = variable;

          maplibreMap.setPaintProperty(layer.id, ppId, paintExpression);
        }
      })
    }

    Object.keys(defaultPaint)
      .forEach(ppId => {
        maplibreMap.setPaintProperty(layer.id, ppId, defaultPaint[ppId]);
      })

    const filters = Object.values(symbologyLayer.filters);

    if (filters.length) {
      filters.forEach(({ filterExpression }) => {
        maplibreMap.setFilter(layer.id, filterExpression);
      })
    }
    else {
      maplibreMap.setFilter(layer.id, null);
    }
  }, [maplibreMap, resourcesLoaded, avlLayer, symbologyLayer,
      setLayerVisibility, visibility
    ]
  );

  return null;
}

class ViewLayer extends AvlLayer {
  constructor(layer, view) {
    super();

    this.id = layer.uniqueId;
    this.name = `Layer ${ layer.layerId }`;

    this.startActive = true;

    this.viewId = view.view_id;

    this.sources = view.metadata.tiles.sources
      .map(s =>
        ({ ...s,
          id: layer.uniqueId
        })
      );
    this.layers = view.metadata.tiles.layers
      .map(l =>
        ({ ...l,
          id: layer.uniqueId,
          source: layer.uniqueId,
          layout: { visibility: "none" }
        })
      );
  }
  RenderComponent = ViewLayerRenderComponent;
}
export default ViewLayer;
