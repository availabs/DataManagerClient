import React from 'react'
import { useFalcor } from 'modules/avl-components/src'
import get from 'lodash/get'

import { LayerContainer } from "modules/avl-map/src";
import ckmeans from '../../../../utils/ckmeans'
import { getColorRange } from 'utils/color-ranges'
import * as d3scale from "d3-scale"
import { useSelector } from "react-redux";
import { selectPgEnv } from "pages/DataManager/store"


const HoverComp = ({ data, layer }) => {
  const { falcor, falcorCache } = useFalcor() 
  const {layerName, version, attributes, activeViewId} = layer 
  const pgEnv = useSelector(selectPgEnv);
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
  legend = {
    type: "quantile",
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
      console.log(feature)
      
      let data = [feature.id,  layerId]
      
      return data
    },
    HoverComp
  };

  init(map, falcor) {
    //console.log('init freight atlas layer', this.id, this.activeViewId)
    
  }

  getColorScale(domain, numBins=5, color='Reds') {
    return d3scale.scaleThreshold()
        .domain(ckmeans(domain,numBins))
        .range(getColorRange(numBins,color));
  }

  fetchData(falcor) {
    if(this.props.activeVariable) {

      const {
        activeVariable,
        activeViewId,
        pgEnv
      } = this.props
      // console.log('fetchData', activeViewId, activeVariable)
      console.time(`GisMapLayer ${activeViewId} ${activeVariable}`)
      return this.falcor.get(['dama',pgEnv, 'viewsbyId' ,activeViewId, 'data', 'length'])
        .then(d => {
          let length = get(d, 
            ['json', 'dama', pgEnv, 'viewsbyId' ,activeViewId, 'data', 'length'], 
          0)
          return this.falcor.chunk([
            'dama',
            pgEnv,
            'viewsbyId',
            activeViewId,
            'databyIndex', 
            [...Array(length).keys()],
            activeVariable
          ])
        }).then(d => {
          console.timeEnd(`GisMapLayer ${activeViewId} ${activeVariable}`) 
        })
    }
    //console.log('fetchData empty')
    
    return Promise.resolve()
  }

  render(map) {
    const {
      activeVariable,
      activeViewId,
      pgEnv
    } = this.props
    if(activeVariable) {
      const falcorCache = this.falcor.getCache()
      const dataById = get(falcorCache, 
        ['dama', pgEnv, 'viewsbyId', activeViewId, 'databyId'], 
      {})
      
      const domainData = Object.values(dataById).map( d => d[activeVariable] )
      
      if(domainData.length > 0){
        let colorScale = this.getColorScale(domainData)
        let colors = Object.keys(dataById).reduce((out, id) => {
          out[+id] = colorScale(dataById[+id][activeVariable])
          return out
        },{})
        map.setPaintProperty(
          this.layers[0].id, 
          "fill-color",
          ["get",  ["to-string",["get","ogc_fid"]], ["literal", colors]]
          
        )
      }
    }
  }
   
}

const GISDatasetLayerFactory = (options = {}) => new GISDatasetLayer(options);
export default GISDatasetLayerFactory

