import React, { useEffect, useContext, useMemo } from "react"
import { AvlLayer, hasValue } from "~/modules/avl-map-2/src"
import { MapContext } from "./dms/MapComponent"
import { SymbologyContext } from "../"
import get from "lodash/get"
import set from "lodash/set"
import omit from "lodash/omit"
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
  allLayerProps
}) => {
  const mctx = useContext(MapContext);
  const sctx = React.useContext(SymbologyContext);
  //copy from hovercomp, dynamically determine context
  const { state, setState } = sctx ? sctx : mctx ? mctx : {state: {}, setState: () => {}};

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

  useEffect(() => {
    //e.g. Symbology layer selected (internal)
    //e.g. pm3 measure selected (external)
    if(!plugin?.dataUpdate) {
      console.error("no data update provided for plugin");
    } else if(!state.symbology?.pluginData?.[layer.id]) {
      console.warn(`no pluginData found for layer:: ${layer.id}. cannot perform dataUpdate`)
    } else {
      plugin.dataUpdate(maplibreMap, state, setState);
    }
  }, [state.symbology?.pluginData?.[layer.id] ])
}



class PluginLayer extends AvlLayer { 
  RenderComponent = PluginLayerRender;
}

export default PluginLayer;




