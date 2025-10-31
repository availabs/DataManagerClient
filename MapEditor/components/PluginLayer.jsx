import React, { useEffect, useContext, useMemo } from "react"
import { AvlLayer, hasValue } from "~/modules/avl-map-2/src"
import { MapContext } from "./dms/map/MapComponent"
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
  const mctx = React.useContext(MapContext);
  const sctx = React.useContext(SymbologyContext);
  const ctx = mctx?.falcor ? mctx : sctx;
  const { state, setState } = ctx;

  let layerPluginDataPath = '';
  //console.log("state in plugin layer::", state)

  if(sctx) {
    layerPluginDataPath =`symbology.pluginData['${layer.id}']`
  } else {
    const symbName = Object.keys(state.symbologies)[0];
    layerPluginDataPath  = `symbologies['${symbName}'].symbology.pluginData['${layer.id}']`;
        // console.log({layerPluginDataPath, symbName, layerId: layer.id})
  }

  const layerPluginData = get(state, layerPluginDataPath);

  const plugin = useMemo(() => {
    return PluginLibrary[layer.id]
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
    } else if(!layerPluginData) {
      console.warn(`no pluginData found for layer:: ${layer.id}. cannot perform dataUpdate`)
    } else {
      plugin.dataUpdate(maplibreMap, state, setState);
    }
  }, [layerPluginData]);

  const RenderComp = plugin?.comp || (() => {});

  return (
    <RenderComp state={state} setState={setState}/>
  );
}



class PluginLayer extends AvlLayer { 
  RenderComponent = PluginLayerRender;
}

export default PluginLayer;




