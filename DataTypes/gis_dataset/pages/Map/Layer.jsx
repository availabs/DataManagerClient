import React from 'react'
import { useFalcor, Legend } from "~/modules/avl-components/src"
import get from 'lodash/get'

import { LayerContainer } from "~/modules/avl-map/src";
import ckmeans from '../../../../utils/ckmeans'
import { getColorRange } from '../../../../utils/color-ranges'
import * as d3scale from "d3-scale"

import { DamaContext } from "~/pages/DataManager/store"


const HoverComp = ({ data, layer }) => {
  const { falcor, falcorCache } = useFalcor() 
  const { attributes, activeViewId } = layer 
  const { pgEnv } = React.useContext(DamaContext)
  const id = React.useMemo(() => get(data, '[0]', null), [data])

  React.useEffect(() => {
    falcor.get([
      'dama',
      pgEnv, 
      'viewsbyId',
      activeViewId, 
      'databyId', 
      id,
      attributes
    ])
  }, [falcor, pgEnv, activeViewId, id, attributes])
    

  const attrInfo = React.useMemo(() => {
    return get(falcorCache, [
        'dama',
        pgEnv, 
        'viewsbyId',
        activeViewId, 
        'databyId', 
        id
      ], {});
  }, [id, falcorCache, activeViewId, pgEnv]);

  
  return (
    <div className='bg-white p-4 max-h-64 scrollbar-xs overflow-y-scroll'>
      <div className='font-medium pb-1 w-full border-b '>{layer.source.display_name}</div>
        {Object.keys(attrInfo).length === 0 ? `Fetching Attributes ${id}` : ''}
        {Object.keys(attrInfo).map((k,i) => 
          <div className='flex border-b pt-1' key={i}>
            <div className='flex-1 font-medium text-sm pl-1'>{k}</div>
            <div className='flex-1 text-right font-thin pl-4 pr-1'>{attrInfo?.[k]}</div>
          </div>
        )} 
    </div>
  )
}


class GISDatasetLayer extends LayerContainer {
  state = {
    showLegend: false
  }

  legend = {
    type: "threshold",
    domain: [0, 150],
    range: [],
    format: ".2s",
    show: false,
    Title: ''
  };

  onHover = {
    layers: this.layers.map(d => d.id),
    callback: (layerId, features, lngLat) => {
      let feature = features[0];
      //console.log(feature)
      
      let data = [feature.id,  layerId]
      
      return data
    },
    HoverComp: this.hoverComp || HoverComp
  };

  infoBoxes = [
      {
        Component: () => {
          return (
            <div className='bg-white w-[320px] p-2'>
              <div className='pb-1 text-sm font-medium'>{this.legend.title}</div>
              <Legend {...this.legend} />
            </div>
          )
        }, 
        show: (layer) => {
          console.log('show', layer, layer.state.showLegend)
          return layer.state.showLegend
        }
      }  
  ];

  init(map, falcor) {
    console.log('init freight atlas layer', this.id, this.activeViewId, this)
    
  }

  getColorScale(domain, numBins=5, color='Reds') {
    return d3scale.scaleThreshold()
        .domain(ckmeans(domain,numBins))
        .range(getColorRange(numBins,color));
  }

  fetchData(falcor) {
    return Promise.resolve()
  }

  render(map) {
    const {
      filters,
      activeViewId,
      symbology
    } = this.props

    const activeVariable = get(filters,'activeVar.value', '')
    //console.log('renderLayer', activeViewId, activeVariable, symbology)

    Object.keys(symbology)
      .filter(paintProperty => {
        let value = get(symbology, `[${paintProperty}][${activeVariable}]`, false)
          || get(symbology, `[${paintProperty}][default]`, false)
        return value 
      })
      .forEach(paintProperty => {
        let sym = get(symbology, `[${paintProperty}][${activeVariable}]`, '')
          || get(symbology, `[${paintProperty}][default]`, '')

        
        //console.log('ss', sym.settings)
        if(sym.settings) {
          this.legend.domain =  sym.settings.domain
          this.legend.range = sym.settings.range
          this.legend.title = sym.settings.title
          this.legend.show = true
          this.updateState({showLegend: true})
        } else {
          this.updateState({showLegend: false})
        }

        //console.log('paintProperty',paintProperty, value)
        if(sym.value) { 
          map.setPaintProperty(
            this.layers[0].id, 
            paintProperty,
            sym.value
          )
        }
      })
  }
   
}

const GISDatasetLayerFactory = (options = {}) => new GISDatasetLayer(options);
export default GISDatasetLayerFactory


// function getPropertyByType (type) {
//   switch (type) {
//   case 'fill':
//       return 'fill-color';
//   case: 'line':
//     return 'line-color';
//   case: 
  
//   }
// }