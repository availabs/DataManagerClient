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
  
  // - On layerProps change
  useEffect(() => {
    // console.log('update layer props', layerProps)
    
    // -------------------------------
    // Update Layer Visibility Layers
    // -------------------------------
    if(layerProps?.visible !== (prevLayerProps?.visible)) {
      layerProps?.layers?.forEach(l => {
        if(maplibreMap.getLayer(l.id)){
          maplibreMap.setLayoutProperty(l.id, 'visibility', layerProps?.visible ?  'visible' : 'none');
        }
      })
    }

    // -------------------------------
    // Reorder Layers
    // -------------------------------
    if(layerProps?.order < (prevLayerProps?.order || -1)) {
      let beneathLayer = Object.values(allLayerProps).find(l => l.order === (layerProps.order+1))
      layerProps?.layers?.forEach(l => {
        maplibreMap.moveLayer(l?.id, beneathLayer?.id) 
      })
    }


  }, [layerProps])

  // return null;
}

class ViewLayer extends AvlLayer {
  constructor(layer, view) {
    super();

    this.id = layer.id;
    // this.name = `Layer ${ layer.layerId }`;
    this.startActive = true;
    this.viewId = layer.view_id;
    this.sources = layer.sources
    this.layers = layer.layers
    
  }
  RenderComponent = ViewLayerRender;
}
export default ViewLayer;
