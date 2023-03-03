import React from 'react'
import { useFalcor } from 'modules/avl-components/src'
import get from 'lodash.get'
import { LayerContainer } from "modules/avl-map/src";
import ckmeans from 'utils/ckmeans'
import { getColorRange } from 'utils/color-ranges'
import * as d3scale from "d3-scale"

const HoverComp = ({ data, layer }) => {
  const { falcor, falcorCache } = useFalcor() 
  const {layerName, version} = layer 
  const id = React.useMemo(() => get(data, '[0]', null), [data])
  let attributes = React.useMemo(() => get(layer.source, 'metadata', [])
    .map(d => d.name)
    .filter(d => !['wkb_geometry', 'objectid', 'objectid_1'].includes(d)), 
    [layer.source])
  
  React.useEffect(() => {
    falcor.get(
      [
        "nysdot-freight-atlas",
        layerName,
        "byVersion",
        version,
        "byId",
        id,
        attributes
      ]
    )
  }, [ id, layerName, version, attributes, falcor]);

  const AttrInfo = React.useMemo(() => {
    return get(falcorCache, [
        "nysdot-freight-atlas",
        layerName,
        "byVersion",
        version,
        "byId",
        id
      ], {});
  }, [id, falcorCache, layerName, version]);

  return (
    <div className='bg-white p-4 max-h-64 scrollbar-xs overflow-y-scroll'>
      <div className='font-medium pb-1 w-full border-b '>{layer.source.display_name}</div>
        {Object.keys(AttrInfo).length === 0 ? `Fetching Attributes ${id}` : ''}
        {Object.keys(AttrInfo).map((k,i) => 
          <div className='flex border-b pt-1' key={i}>
            <div className='flex-1 font-medium text-sm pl-1'>{k}</div>
            <div className='flex-1 text-right font-thin pl-4 pr-1'>{AttrInfo[k].value}</div>
          </div>
        )} 
    </div>
  )
}

class FreightAtlasLayer extends LayerContainer {
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
      
      let data = [feature.properties.id,  layerId ] 
      
      return data
    },
    HoverComp
  };

  init(map, falcor) {
    console.log('init freight atlas layer')
    const { data_table } = get(this, `views[${this.activeView}]`, '')
    this.layerName = get(data_table.split('.'),'[1]','').slice(0,-6)
    this.version = get(data_table.split('.'),'[1]','').slice(-4)
  }

  getColorScale(domain, numBins=5, color='Reds') {
    console.log('getColorScale', ckmeans(domain,numBins), getColorRange(numBins,color))
    return d3scale.scaleThreshold()
        .domain(ckmeans(domain,numBins))
        .range(getColorRange(numBins,color));
  }

  fetchData(falcor) {
    const {layerName, version} = this
    let columns = get(this,'symbology',[])
          .reduce((out, curr) => {
            if(!out.includes(curr.column)){
              out.push(curr.column)
            }
            return out
          },[])

    if(columns.length > 0 && (layerName && version)) {
      return falcor.get([
        "nysdot-freight-atlas",
        layerName,
        "byVersion",
        version,
        "length"
      ]).then(res => {
          const length = get (res,[
            "json",
            "nysdot-freight-atlas",
            layerName,
            "byVersion",
            version,
            "length"
          ], 0)
        if(columns.length > 0 && length > 0){
          // console.time('get final data')
          return falcor.get([
            "nysdot-freight-atlas",
            layerName,
            "byVersion",
            version,
            "byIndex",
            {from: 0, to: length-1},
            columns
          ])
          // .then(fullData => {
          //   console.timeEnd('get final data')
          //   console.log('gotfullData', fullData)
          // })
        } 
        return res
      })
    }
    return Promise.resolve({})
  }

  render(map) {
    const {layerName, version} = this
    const falcorCache = this.falcor.getCache()
    // set symbology
    const versionData = get(falcorCache, [
        "nysdot-freight-atlas",
        layerName,
        "byVersion",
        version,
        "byId"
    ],{})
    get(this , 'symbology', []).forEach(sym => {
      switch(sym.type) {
        case "simple":
          map.setPaintProperty(`${layerName}_v${version}`, sym.paint, isNaN(+sym.value) ? sym.value : +sym.value)
        break; 
        
        break;
        default:
          console.log('no type for symbology', sym)
      }
      


    })
    
  }
   
}

const FreightAtlasFactory = (options = {}) => new FreightAtlasLayer(options);
export default FreightAtlasFactory

