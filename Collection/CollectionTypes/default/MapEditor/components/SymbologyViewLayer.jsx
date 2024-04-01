import React, { useEffect, useRef } from "react"
import get from "lodash/get"
import isEqual from "lodash/isEqual"
import cloneDeep from "lodash/cloneDeep"
import { AvlLayer, hasValue } from "~/modules/avl-map-2/src"
import { usePrevious, getValidSources } from './LayerManager/utils'
import {DAMA_HOST} from '~/config'

const ViewLayerRender = ({
  maplibreMap,
  layer,
  layerProps,
  allLayerProps
}) => {
  
  // ------------
  // avl-map doesn't always automatically remove layers on unmount
  // so do it here
  // ---------------
  useEffect(() => {  
    return () => { 
      //console.log('unmount', layer.id, layerProps.name, layer)
      layer.layers.forEach(l => {
        try {
          if (maplibreMap && maplibreMap.getLayer(l.id)) {
            maplibreMap.removeLayer(l.id)
          }
        } catch (e) {
          console.log('catch', e)
        }
      })
    }
  }, [])
  
  // to detect changes in layerprops
  const prevLayerProps = usePrevious(layerProps);
  
  // - On layerProps change
  useEffect(() => {
    // console.log('update layer props', layerProps)
    

   
    // ------------------------------------------------------
    // Change Source to Update feature properties dynamically
    // ------------------------------------------------------
    if(layerProps?.['data-column'] !== (prevLayerProps?.['data-column'])) {
      if(maplibreMap.getSource(layerProps?.sources?.[0]?.id)){
       
        let newSource = cloneDeep(layerProps.sources?.[0])
        
        newSource.source.tiles[0] += `?cols=${layerProps?.['data-column'] }`
        newSource.source.tiles[0] = newSource.source.tiles[0].replace('https://graph.availabs.org', 'http://localhost:4444')
        
        console.log('change source columns', newSource.source.tiles[0], layerProps?.sources?.[0].id, newSource.id)
        layerProps?.layers?.forEach(l => {
          if(maplibreMap.getLayer(l?.id) && maplibreMap.getLayer(l?.id)){
            maplibreMap.removeLayer(l?.id) 
          }
        })
        // consol
        maplibreMap.removeSource(newSource.id)
        if(!maplibreMap.getSource(newSource.id)){
          maplibreMap.addSource(newSource.id, newSource.source)
        } else {
          console.log(maplibreMap.getSource(newSource.id))
        }

        let beneathLayer = Object.values(allLayerProps).find(l => l.order === (layerProps.order+1))
        layerProps?.layers?.forEach(l => {
            maplibreMap.addLayer(l, beneathLayer?.id) 
        })
      }
    }

    // -------------------------------
    // Reorder Layers
    // to do: STILL BUGGY
    // -------------------------------
    if(layerProps?.order < (prevLayerProps?.order || -1)) {
      let beneathLayer = Object.values(allLayerProps).find(l => l.order === (layerProps.order+1))
      layerProps?.layers?.forEach(l => {
        if(maplibreMap.getLayer(l?.id) && maplibreMap.getLayer(l?.id)){
          maplibreMap.moveLayer(l?.id, beneathLayer?.id) 
        }
      })
    }

    // -------------------------------
    // update paint Properties
    // -------------------------------
    layerProps?.layers?.forEach((l,i) => {
      if(maplibreMap.getLayer(l.id)){
        Object.keys(l.paint).forEach(paintKey => {
          if(!isEqual(prevLayerProps?.layers?.[i]?.paint?.[paintKey], l?.paint?.[paintKey])) {
            //  console.log('update paintKey', l.id, paintKey, prevLayerProps?.layers?.[i]?.paint?.[paintKey], l?.paint?.[paintKey])
            maplibreMap.setPaintProperty(l.id, paintKey, l.paint[paintKey])
          }
        })
      }
    })

    // -------------------------------
    // update layout Properties
    // -------------------------------
    layerProps?.layers?.forEach((l,i) => {
      if(maplibreMap.getLayer(l.id)){
        Object.keys(l?.layout || {}).forEach(layoutKey => {
          if(!isEqual(prevLayerProps?.layers?.[i]?.layout?.[layoutKey], l?.layout?.[layoutKey])) {
            // console.log('update layoutKey', l.id, layoutKey, prevLayerProps?.layers?.[i]?.paint?.[layoutKey], l?.paint?.[layoutKey])
            maplibreMap.setLayoutProperty(l.id, layoutKey, l.layout[layoutKey])
          }
        })
      }
    })




  }, [layerProps])

  // return null;
}

class ViewLayer extends AvlLayer { 
  // constructor makes onHover not work??
  // constructor(layer, view) { 
  //   super();

  //   this.id = layer.id;
  //   // this.name = `Layer ${ layer.layerId }`;
  //   this.startActive = true;
  //   this.viewId = layer.view_id;
  //   this.sources = getValidSources(layer.sources, DAMA_HOST)
  //   this.layers = layer.layers
    
  // }

  onHover = {
    layers: this.layers
      .filter(d => d?.id?.indexOf('_case') === -1)
      .map((d) => d.id),
    callback: (layerId, features, lngLat) => {

      //console.log('hover callback')
      let feature = features[0];

      let data = [feature.id, layerId, (features[0] || {}).properties];

      return data;
    },
    Component: ({ data, layer }) => { 
      if(!layer.props.hover) return
      return (
        <div className='p-2 bg-white'>
          <pre>{JSON.stringify(data,null,3)}</pre>
        </div>
      )
    },
    isPinnable: this.isPinnable || false
  };
  
  RenderComponent = ViewLayerRender;
}

export default ViewLayer;




const HoverComp = ({ data, layer }) => {
  const { attributes, activeViewId, filters } = layer;
  const { pgEnv, falcor, falcorCache } = React.useContext(DamaContext);
  const id = React.useMemo(() => get(data, "[0]", null), [data]);

  let getAttributes = (typeof attributes?.[0] === 'string' ?
    attributes : attributes.map(d => d.name)).filter(d => !['wkb_geometry'].includes(d))

  
  React.useEffect(() => {
    falcor.get([
      "dama",
      pgEnv,
      "viewsbyId",
      activeViewId,
      "databyId",
      id,
      getAttributes
    ])
    //.then(d => console.log('got attributes', d));
  }, [falcor, pgEnv, activeViewId, id, attributes]);

  const attrInfo = React.useMemo(() => {
    return get(
      falcorCache,
      ["dama", pgEnv, "viewsbyId", activeViewId, "databyId", id],
      {}
    );
  }, [id, falcorCache, activeViewId, pgEnv]);

  
  return (
    <div className="bg-white p-4 max-h-64 max-w-lg scrollbar-xs overflow-y-scroll">
      <div className="font-medium pb-1 w-full border-b ">
        {layer.source.display_name}
      </div>
      {Object.keys(attrInfo).length === 0 ? `Fetching Attributes ${id}` : ""}
      {Object.keys(attrInfo)
        .filter((k) => typeof attrInfo[k] !== "object")
        .map((k, i) => (
          <div className="flex border-b pt-1" key={i}>
            <div className="flex-1 font-medium text-sm pl-1">{k}</div>
            <div className="flex-1 text-right font-thin pl-4 pr-1">
              {attrInfo?.[k]}
            </div>
          </div>
        ))}
    </div>
  );
};