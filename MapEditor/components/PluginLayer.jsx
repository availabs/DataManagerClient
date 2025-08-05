import React, { useEffect, useContext, useRef } from "react"
import get from "lodash/get"
import isEqual from "lodash/isEqual"
import cloneDeep from "lodash/cloneDeep"
import { AvlLayer, hasValue } from "~/modules/avl-map-2/src"
import { usePrevious, getValidSources } from './LayerManager/utils'
import { DAMA_HOST } from '~/config'
import { DamaContext } from "../../store"
import { MapContext } from "./dms/MapComponent"
import { CMSContext } from '~/modules/dms/src'
function onlyUnique(value, index, array) {
  return array.indexOf(value) === index;
}
const PluginLayerRender = ({
  maplibreMap,
  layer,
  layerProps,
  allLayerProps,
}) => {
 

  const mctx = useContext(MapContext);
  const { state, setState } = mctx ? mctx : {state: {}, setState:() => {}};
  // ------------
  // avl-map doesn't always automatically remove layers on unmount
  // so do it here
  // ---------------
  useEffect(() => {  
    
  }, [])

  

  
}



class PluginLayer extends AvlLayer { 
  RenderComponent = PluginLayerRender;
}

export default ViewLayer;




