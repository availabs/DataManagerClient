import React, { useEffect, useContext, useRef } from "react"
import { AvlLayer, hasValue } from "~/modules/avl-map-2/src"
import { MapContext } from "./dms/MapComponent"


const PluginLayerRender = ({
  maplibreMap,
  layer,
  layerProps,
  allLayerProps,
  pluginName
}) => {
  const mctx = useContext(MapContext);
  const { state, setState } = mctx ? mctx : {state: {}, setState:() => {}};
  // ------------
  // On Load Unload
  // ---------------
  useEffect(() => {  
    layer.mapRegister(maplibreMap, state, setState)
  }, [])

  // useEffect(() => {
  //   layer.dataUpdate(maplibreMap, state, setState)
  // }, [state.symbology.plugins?.[pluginName]?.data ])
    

  
}



class PluginLayer extends AvlLayer { 
  RenderComponent = PluginLayerRender;
}

export default PluginLayer;




