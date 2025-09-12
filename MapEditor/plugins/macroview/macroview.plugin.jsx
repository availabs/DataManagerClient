import React from "react"
import get from "lodash/get"
import set from "lodash/set"
import { filters, updateSubMeasures, getMeasure } from "./updateFilters"
import { InternalPanel } from "./internalPanel"
import { ExternalPanel } from "./externalPanel"
import { DataUpdate } from "./dataUpdate"

import { measure_info } from './measures'


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
    comp: ({state, setState}) => {
      //return <></>
      let layerPluginDataPath = "";
      if (!state.symbologies) {
        layerPluginDataPath = `symbology.pluginData['macroview']`;
      } else {
        const symbName = Object.keys(state.symbologies)[0];
        layerPluginDataPath = `symbologies['${symbName}'].symbology.pluginData['macroview']`;
      }

      const measureFilters  = get(
            state,
            `${layerPluginDataPath}['measureFilters']`,
            filters
          )

      const measure = getMeasure(measureFilters);

      let measureDefintion = '',
          measureEquation = '';
      if(measure.includes('lottr')) {
        //definition needs period
        const { definition: definitionFunction, equation: equationFunction } = measure_info['lottr'];
        const curPeriod = measureFilters['peakSelector'].value;
        measureDefintion = definitionFunction({period: curPeriod});
        measureEquation = equationFunction();
      } else if (measure.includes('tttr')) {
        const { definition: definitionFunction, equation: equationFunction } = measure_info['tttr'];
        //equation needs period
        const curPeriod = measureFilters['peakSelector'].value;
        measureDefintion = definitionFunction();
        measureEquation = equationFunction({period: curPeriod});
      } else if (measure.includes('phed') || measure.includes('ted')) {
        const { definition: definitionFunction, equation: equationFunction } = measure_info['phed'];
        //definition needs freeflow and trafficType
        const curFreeflow = measureFilters['freeflow'].value ? 'the freeflow speed' : 'the posted speed limit';
        const curTrafficType = measureFilters['trafficType'].value;
        measureDefintion = definitionFunction({freeflow: curFreeflow, trafficType: curTrafficType});
        measureEquation = equationFunction();
      } else if (measure.includes('speed')) {
        const { definition: definitionFunction, equation: equationFunction } = measure_info['speed'];
        //definition needs period
        // const curPeriod = measureFilters['peakSelector'].value;
        const curPercentile = measureFilters['percentiles']?.value;
        measureDefintion = definitionFunction({percentile: curPercentile});
        measureEquation = equationFunction();
      }

      const displayInfo = measureDefintion.length > 0 || measureEquation.length;
      return displayInfo && (
        <div
          className="flex flex-col pointer-events-auto drop-shadow-lg p-4 bg-white/75"
          style={{
            position: "absolute",
            top: "94px",
            right: "-168px",
            color: "black",
            width: "318px",
            maxHeight: "325px",
          }}
        >
          {measureDefintion.length > 0 && <div className="m-2  pb-2 px-1">
            <div className="font-semibold text-lg">Measure Definition</div>
            <div className="font-semibold text-sm">{measureDefintion}</div>
          </div>}
          {measureEquation.length > 0 && (
            <div className="m-2  pb-2 px-1">
              <div className="font-semibold text-lg">Equation</div>
              <div className="font-semibold text-sm">{measureEquation}</div>
            </div>
          )}
        </div>
      );
    },
    cleanup: (map, state, setState) => {
      map.off("click", MAP_CLICK);
    },
  }