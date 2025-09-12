import React from "react"
import get from "lodash/get"
import set from "lodash/set"
import { filters, updateSubMeasures, getMeasure } from "./updateFilters"
import { InternalPanel } from "./internalPanel"
import { ExternalPanel } from "./externalPanel"
import { DataUpdate } from "./dataUpdate"
import { Comp } from "./comp";

const MAP_CLICK = () => console.log("map was clicked");
export const MacroviewPlugin = {
    id: "macroview",
    type: "plugin",
    mapRegister: (map, state, setState) => {
      map.on("click", MAP_CLICK);
      let pluginDataPath = '';

      //state.symbologies indicates that the map context is DMS
      if(state.symbologies) {
        const symbName = Object.keys(state.symbologies)[0];
        const pathBase = `symbologies['${symbName}']`
        pluginDataPath = `${pathBase}.symbology.pluginData.macroview`
      } else {
        pluginDataPath = `symbology.pluginData.macroview`;
      }

      const newFilters = updateSubMeasures(filters);

      ///const pathBase = MapContext ? `symbologies['${symbName}']` : ``
      setState(draft => {
        set(draft, `${pluginDataPath}['measureFilters']`, newFilters);
        //set(draft, `${pathBase}.${layerPaintPath}`, npmrdsPaint); //Mapbox paint

        // const mpoLayerId = get(state, `${pluginDataPath}['active-layers'][${MPO_LAYER_KEY}]`);
        // const geography = get(state, `${pluginDataPath}['geography']`, null);
        // if(mpoLayerId) {
        //   const selectedMpo = geography.filter(geo => geo.type === "mpo_name");
        //   if(selectedMpo.length === 0) {
        //     set(
        //       draft,
        //       `symbology.layers[${mpoLayerId}]['isVisible']`,
        //       false
        //     );
        //     draft.symbology.layers[mpoLayerId].layers.forEach((d,i) => {
        //       draft.symbology.layers[mpoLayerId].layers[i].layout =  { "visibility": 'none' }
        //     })
        //   }
        // }
        
      })
    },
    dataUpdate: DataUpdate,
    internalPanel: InternalPanel,
    externalPanel: ExternalPanel,
    comp: Comp,
    cleanup: (map, state, setState) => {
      map.off("click", MAP_CLICK);
    },
  }