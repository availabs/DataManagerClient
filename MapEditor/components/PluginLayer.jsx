import React, { useEffect, useContext, useMemo } from "react"
import { AvlLayer, hasValue } from "~/modules/avl-map-2/src"
import { MapContext } from "./dms/MapComponent"

import {PluginLibrary} from "../"

//CURRENTLY
//pluginData path is appended from within SettingsPanel

/**
 * Developer expose to `typeConfig`-like json
 */

//layer-select control (Symbology Creator) (Internal Panel)

//performence measure (speed, lottr, tttr, etc.) (External Panel) (Dev hard-code)
//"second" selection (percentile, amp/pmp) (External Panel) (Dev hard-code)




const PluginLayerRender = ({
  maplibreMap,
  layer,
  layerProps,
  allLayerProps,
  pluginName
}) => {
  const mctx = useContext(MapContext);
  //copy from hovercomp, dynamically determine context
  const { state, setState } = mctx ? mctx : {state: {}, setState:() => {}};

  const plugin = useMemo(() => {
    return  PluginLibrary[layer.id]
  }, [layer.id]);
  // ------------
  // On Load Unload
  // ---------------
  useEffect(() => {
    plugin?.mapRegister(maplibreMap, state, setState);

    return () => {
      plugin?.cleanup(maplibreMap, state, setState)
    }
  }, []);

  // useEffect(() => {
  //   //e.g. Symbology layer selected (internal)
  //   //e.g. pm3 measure selected (external)

  //   layer.dataUpdate(maplibreMap, state, setState)
  // }, [state.symbology.pluginData?.[pluginName] ])
}



class PluginLayer extends AvlLayer { 
  RenderComponent = PluginLayerRender;
}

export default PluginLayer;




