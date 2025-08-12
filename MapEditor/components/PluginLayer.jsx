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

  console.log("layer render, state::", state)
  console.log("layer.id", layer.id)

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
    const pluginDataPath = `symbology.pluginData.${layer.id}`;
    //e.g. Symbology layer selected (internal)
    //e.g. pm3 measure selected (external)
    console.log("data update use effecct fire")
    console.log({pluginDataPath})

    //TODO -- do we want the plugin to return only changed fields? All fields? 
    const updatedState = plugin.dataUpdate(maplibreMap, state, setState);
    const pluginLayer = get(
      state,
      `${pluginDataPath}['activeLayer']`,
      null
    );
    if(updatedState["data-column"]) {
      const symbologyPath = `symbology.layers['${pluginLayer}']`;
      console.log("---in pluginlayer, new data-column, updating---");

      setState((draft) => {
          set(draft, `${symbologyPath}['choroplethdata']`, {});
          set(draft, `${symbologyPath}['categories']`, {});
          set(draft, `${symbologyPath}['data-column']`, updatedState["data-column"]);
      })
    }
  }, [state.symbology?.pluginData?.[layer.id] ])
}



class PluginLayer extends AvlLayer { 
  RenderComponent = PluginLayerRender;
}

export default PluginLayer;




