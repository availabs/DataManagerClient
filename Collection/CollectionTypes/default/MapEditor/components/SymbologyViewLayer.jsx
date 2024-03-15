import React, { useEffect, useRef } from "react"
import get from "lodash/get"
import { AvlLayer, hasValue } from "~/modules/avl-map-2/src"
const usePrevious = (value) => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};


const ViewLayerRender = ({
    maplibreMap,
    layer,
    layerProps,
    resourcesLoaded,
    setLayerVisibility,
    allLayerProps
}) => {

  const prevLayerProps = usePrevious(layerProps);
  
  // - On layer Prop change
  useEffect(() => {
    // 
    if(layerProps?.order < (prevLayerProps?.order || -1)) {
      let beneathLayer = Object.values(allLayerProps).find(l => l.order === (layerProps.order+1))

      layerProps.layers.forEach(l => {
        // console.log('hola', l.id, beneathLayer.id, `${beneathLayer.id}${['fill','line'].includes(beneathLayer.type) ? '_case' : ''}`)

        maplibreMap.moveLayer(l.id, beneathLayer.id) 
      })
    }


  }, [layerProps])
  // const visibility = React.useMemo(() => {
  //   if (!maplibreMap) return "none";
  //   if (!resourcesLoaded) return "none";
  //   if (!activeView) return "none";
  //   if (!symbologyLayer) return "none";
  //   return activeView.layers.includes(symbologyLayer) ? "visibile" : "none";
  // }, [maplibreMap, resourcesLoaded, activeView, symbologyLayer]);

  // React.useEffect(() => {
  //   if (!maplibreMap) return;
  //   if (!resourcesLoaded) return;
  //   if (!symbologyLayer) return;

  //   setLayerVisibility(symbologyLayer.uniqueId, visibility);
  //   if (visibility === "none") return;

  //   const [layer] = avlLayer.layers;

  //   const defaultPaint = { ...layer.paint };

  //   const ppIds = Object.keys(symbologyLayer.paintProperties);

  //   if (ppIds.length) {

  //     ppIds.forEach(ppId => {

  //       const {
  //         value,
  //         paintExpression,
  //         variable
  //       } = get(symbologyLayer, ["paintProperties", ppId], {});

  //       if (hasValue(value)) {
  //         delete defaultPaint[ppId];
  //         maplibreMap.setPaintProperty(layer.id, ppId, value);
  //       }
  //       else if (paintExpression) {
  //         delete defaultPaint[ppId];
  //         maplibreMap.setPaintProperty(layer.id, ppId, paintExpression);
  //       }
  //       else if (variable) {
  //         delete defaultPaint[ppId];

  //         const { paintExpression, scale } = variable;

  //         maplibreMap.setPaintProperty(layer.id, ppId, paintExpression);
  //       }
  //     })
  //   }

  //   Object.keys(defaultPaint)
  //     .forEach(ppId => {
  //       maplibreMap.setPaintProperty(layer.id, ppId, defaultPaint[ppId]);
  //     })

  //   const filters = Object.values(symbologyLayer.filters);

  //   if (filters.length) {
  //     filters.forEach(({ filterExpression }) => {
  //       maplibreMap.setFilter(layer.id, filterExpression);
  //     })
  //   }
  //   else {
  //     maplibreMap.setFilter(layer.id, null);
  //   }
  // }, [maplibreMap, resourcesLoaded, avlLayer, symbologyLayer,
  //     setLayerVisibility, visibility
  //   ]
  // );

  return null;
}

class ViewLayer extends AvlLayer {
  constructor(layer, view) {
    super();

    this.id = layer.id;
    this.name = `Layer ${ layer.layerId }`;

    this.startActive = true;

    this.viewId = layer.view_id;

    this.sources = layer.sources
    this.layers = layer.layers
    
      // .map(s =>
      //   ({ ...s,
      //     id: layer.id
      //   })
      // );
      // .map(l =>
      //   ({ ...l,
      //     id: layer.id,
      //     source: layer.id,
      //     //layout: { visibility: "none" }
      //   })
      // );
  }
  RenderComponent = ViewLayerRender;
}
export default ViewLayer;
