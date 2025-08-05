import React, { useEffect, useContext, useRef } from "react"
//import get from "lodash/get"
//import isEqual from "lodash/isEqual"
//import cloneDeep from "lodash/cloneDeep"
import { AvlLayer, hasValue } from "~/modules/avl-map-2/src"
//import { usePrevious, getValidSources } from './LayerManager/utils'
import { DAMA_HOST } from '~/config'
//import { DamaContext } from "../../store"
import { MapContext } from "./dms/MapComponent"
//import { CMSContext } from '~/modules/dms/src'
import { RegisteredPlugins } from '../'

const PluginLayerRender = ({
  maplibreMap,
  /*
  layer,
  layerProps,
  allLayerProps,
  */
  pluginName
}) => {
 

  const mctx = useContext(MapContext);
  const { state, setState } = mctx ? mctx : {state: {}, setState:() => {}};
  // ------------
  // On Load Unload
  // ---------------
  useEffect(() => {  
    RegisteredPlugins[pluginName].mapRegister(maplibreMap, state, setState)
  }, [])

  useEffect(() => {
    RegisteredPlugins[dataUpdate].dataUpdate(maplibreMap, state, setState)
  }, [state.symbology.activePlugins?.[pluginName]?.data ])
    

  
}



class PluginLayer extends AvlLayer { 
  RenderComponent = PluginLayerRender;
}

export default ViewLayer;




