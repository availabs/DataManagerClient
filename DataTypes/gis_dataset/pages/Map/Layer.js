import React from 'react'
//import { useFalcor } from 'modules/avl-components/src'
import get from 'lodash/get'

import { LayerContainer } from "modules/avl-map/src";
import ckmeans from '../../../../utils/ckmeans'
import { getColorRange } from 'utils/color-ranges'
import * as d3scale from "d3-scale"



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
      
      let data = [feature.properties.id,  layerId ] 
      
      return data
    }
  };

  init(map, falcor) {
    console.log('init freight atlas layer')
    
  }

  getColorScale(domain, numBins=5, color='Reds') {
    console.log('getColorScale', ckmeans(domain,numBins), getColorRange(numBins,color))
    return d3scale.scaleThreshold()
        .domain(ckmeans(domain,numBins))
        .range(getColorRange(numBins,color));
  }

  fetchData(falcor) {
    
    return Promise.resolve({})
  }

  render(map) {
    const {layerName, version} = this
    
  }
   
}

const GISDatasetLayerFactory = (options = {}) => new GISDatasetLayer(options);
export default GISDatasetLayerFactory

