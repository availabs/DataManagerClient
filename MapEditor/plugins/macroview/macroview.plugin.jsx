import React from "react"
import get from "lodash/get"
import set from "lodash/set"
import { filters, updateSubMeasures, getMeasure } from "./updateFilters"
import { InternalPanel } from "./internalPanel"
import { ExternalPanel } from "./externalPanel"
import { DataUpdate } from "./dataUpdate"

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
    comp: () => {
      return <></>
      return( 
        <div
          className="flex flex-col pointer-events-auto drop-shadow-lg bg-neutral-100 p-4"
          style={{
            position: "absolute",
            bottom: "20px",
            left:"300px",
            color: "black",
            width: "500px",
            height: "500px",
          }}
        >
          <div className="m-2 border-b-4 border-black pb-2" ><div className="pb-2 px-1 bg-gray-300">Legend</div></div>
          <div className="m-2 border-b-4 border-black pb-2" ><div className="pb-2 px-1 bg-gray-300">TMC Search</div></div>
          <div className="m-2 border-b-4 border-black pb-2" ><div className="pb-2 px-1 bg-gray-300">Add Infobox</div></div>
          <div className="m-2 " ><div className="pb-2 px-1 bg-gray-300">INFOBOXES</div></div>
        </div>
      )
    },
    cleanup: (map, state, setState) => {
      map.off("click", MAP_CLICK);
    },
  }