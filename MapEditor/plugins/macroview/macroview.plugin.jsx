import React from "react"
import get from "lodash/get"
import set from "lodash/set"
import { filters, updateSubMeasures, getMeasure } from "./updateFilters"
import { InternalPanel } from "./internalPanel"
import { ExternalPanel } from "./externalPanel"
import {
  PM3_LAYER_KEY,
} from "./constants";

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
    dataUpdate: (map, state, setState) => {
      //console.log("---data update-----")
      //9/4 9:02am looks like data update does not fire for DMS map
      //console.log("testing old filters and json code")

      //console.log({filters})
      //updateSubMeasures(this.filters.measure.value, this.filters, falcor);

      let pluginDataPath = ''
      let symbologyDataPath = '';
      if(state.symbologies) {
        const symbName = Object.keys(state.symbologies)[0];
        const pathBase = `symbologies['${symbName}']`
        pluginDataPath = `${pathBase}.symbology.pluginData.macroview`;
        symbologyDataPath = `${pathBase}.symbology.layers`;
      } else {
        pluginDataPath = `symbology.pluginData.macroview`;
        symbologyDataPath = `symbology.layers`;
      }

      //console.log("plugin Data gets updated", { map, state, setState });
      const hover = get(state, `${pluginDataPath}['hover']`, "");
      const pm1 = get(state, `${pluginDataPath}['pm-1']`, null);
      const peak = get(state, `${pluginDataPath}['peak']`, null);
      const viewId = get(state, `${pluginDataPath}['viewId']`, null);
      const allPluginViews = get(state, `${pluginDataPath}['views']`, []);
      const geography = get(state, `${pluginDataPath}['geography']`, null);
      const pm3LayerId = get(state, `${pluginDataPath}['active-layers'][${PM3_LAYER_KEY}]`, null);
      const measureFilters = get(state, `${pluginDataPath}['measureFilters']`, filters)
      const pm3MapLayers = get(state, `${symbologyDataPath}['${pm3LayerId}'].layers`, null);
      const pm3MapSources = get(state, `${symbologyDataPath}['${pm3LayerId}'].sources`, null);
      const layerViewId = get(state, `${symbologyDataPath}['${pm3LayerId}'].view_id`, null);

      if(pm3LayerId && viewId) {
        //Update map with new viewId
        setState(draft => {
          //console.log("data update for plugin, draft::", JSON.parse(JSON.stringify(draft)));

          //9/4 9:36am TODO test that `pm3MapLayers[0]` still works in the mapEditor
          //tbh i am not totally sure how this worked in thefirst place. I prob just references the layers differently.
          const newLayer = JSON.parse(
            JSON.stringify(pm3MapLayers).replaceAll(
              layerViewId,
              viewId
            )
          );
          const newSources = JSON.parse(
            JSON.stringify(
              pm3MapSources
            ).replaceAll(layerViewId, viewId)
          );
          const newDataColumn = getMeasure(measureFilters);
          set(draft,`${symbologyDataPath}['${pm3LayerId}']['layers']` , newLayer)
          set(draft,`${symbologyDataPath}['${pm3LayerId}']['sources']` , newSources)
          set(draft,`${symbologyDataPath}['${pm3LayerId}']['view_id']` , viewId)

          set(draft,`${symbologyDataPath}['${pm3LayerId}']['hover']` , hover)
          set(draft, `${symbologyDataPath}['${pm3LayerId}']['data-column']`, newDataColumn); //must set data column, or else tiles will not have that data
        })
      } else if(pm3LayerId && !viewId && allPluginViews?.length > 0) {
        //if no view is selected, but there is at least 1 element in views, select that 1 element
        setState(draft => {
          set(draft, `${pluginDataPath}['viewId']`, allPluginViews[0].value);
        })
      }
    },
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