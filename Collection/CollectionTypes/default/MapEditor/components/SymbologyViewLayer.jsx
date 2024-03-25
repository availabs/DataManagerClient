import React, { useEffect, useRef } from "react"
import get from "lodash/get"
import isEqual from "lodash/isEqual"
import { AvlLayer, hasValue } from "~/modules/avl-map-2/src"
import { usePrevious, getValidSources } from './LayerManager/utils'
import {DAMA_HOST} from '~/config'

const ViewLayerRender = ({
  maplibreMap,
  layer,
  layerProps,
  allLayerProps
}) => {
  
  // ------------
  // avl-map doesn't always automatically remove layers on unmount
  // so do it here
  // ---------------
  useEffect(() => {  
    return () => { 
      //console.log('unmount', layer.id, layerProps.name, layer)
      layer.layers.forEach(l => {
        if (maplibreMap && maplibreMap.getLayer(l.id)) {
          maplibreMap.removeLayer(l.id)
        }
      })
    }
  }, [])
  
  // to detect changes in layerprops
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
    // to do: STILL BUGGY
    // -------------------------------
    if(layerProps?.order < (prevLayerProps?.order || -1)) {
      let beneathLayer = Object.values(allLayerProps).find(l => l.order === (layerProps.order+1))
      layerProps?.layers?.forEach(l => {
        maplibreMap.moveLayer(l?.id, beneathLayer?.id) 
      })
    }

    // -------------------------------
    // update paint Properties
    // -------------------------------
    layerProps?.layers?.forEach((l,i) => {
      if(maplibreMap.getLayer(l.id)){
        Object.keys(l.paint).forEach(paintKey => {
          if(!isEqual(prevLayerProps?.layers?.[i]?.paint?.[paintKey], l?.paint?.[paintKey])) {
            //  console.log('update paintKey', l.id, paintKey, prevLayerProps?.layers?.[i]?.paint?.[paintKey], l?.paint?.[paintKey])
            maplibreMap.setPaintProperty(l.id, paintKey, l.paint[paintKey])
          }
        })
      }
    })


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
    this.sources = getValidSources(layer.sources, DAMA_HOST)
    this.layers = layer.layers
    
  }
  RenderComponent = ViewLayerRender;
}
export default ViewLayer;
