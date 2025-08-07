import React, { useEffect, useContext, useMemo } from "react"
import { AvlLayer, hasValue } from "~/modules/avl-map-2/src"
import { MapContext } from "./dms/MapComponent"

import {PluginLibrary} from "../"

const PluginLayerRender = ({
  maplibreMap,
  layer,
  layerProps,
  allLayerProps,
  pluginName
}) => {
  const mctx = useContext(MapContext);
  const { state, setState } = mctx ? mctx : {state: {}, setState:() => {}};

  const plugin = useMemo(() => {
    return  PluginLibrary[layer.id]
  }, [layer.id])   
  // ------------
  // On Load Unload
  // ---------------
  useEffect(() => {
    plugin.mapRegister(maplibreMap, state, setState);

    return () => {
      plugin.cleanup(maplibreMap, state, setState)
    }
  }, []);

  // useEffect(() => {
  //   layer.dataUpdate(maplibreMap, state, setState)
  // }, [state.symbology.plugins?.[pluginName]?.data ])
}



class PluginLayer extends AvlLayer { 
  RenderComponent = PluginLayerRender;
}

export default PluginLayer;




