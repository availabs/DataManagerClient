import React, { useEffect, useContext, useRef } from "react"
import get from "lodash/get"
import isEqual from "lodash/isEqual"
import cloneDeep from "lodash/cloneDeep"
import { AvlLayer, hasValue } from "~/modules/avl-map-2/src"
import { usePrevious, getValidSources } from './LayerManager/utils'
import {DAMA_HOST} from '~/config'
import { DamaContext } from "../../store"
import { MapContext } from "./dms/MapComponent"
import { CMSContext } from '~/modules/dms/src'

const ViewLayerRender = ({
  maplibreMap,
  layer,
  layerProps,
  allLayerProps
}) => {
  const mctx = useContext(MapContext);
  const { state, setState } = mctx ? mctx : {state: {}, setState:() => {}};
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
          //console.log('catch', e)
        }
      })
    }
  }, [])

  const mapCenter = maplibreMap.getCenter();
  const mapZoom = maplibreMap.getZoom();

  useEffect(() => {
    if(state.setInitialBounds) {
      setState(draft => {
        draft.setInitialBounds = false;
        const newBounds = {
          center: mapCenter,
          zoom: mapZoom
        };
        if(!isEqual(state.initialBounds, newBounds)){
          draft.initialBounds = newBounds;
        }
      })
    }
  }, [maplibreMap, state.setInitialBounds]);

  // to detect changes in layerprops
  const prevLayerProps = usePrevious(layerProps);
  // - On layerProps change
  useEffect(() => {
    // ------------------------------------------------------
    // Change Source to Update feature properties dynamically
    // ------------------------------------------------------
    if(layerProps?.['data-column'] !== (prevLayerProps?.['data-column']) || layerProps?.filter !== (prevLayerProps?.['filter'])) {
      //console.log('data-column update')
      if(maplibreMap.getSource(layerProps?.sources?.[0]?.id)){
        let newSource = cloneDeep(layerProps.sources?.[0])
        let tileBase = newSource.source.tiles?.[0];

        if(tileBase){
          newSource.source.tiles = [getLayerTileUrl(tileBase, layerProps)];
        }

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
          console.log('cant add',maplibreMap.getSource(newSource.id))
        }

        let beneathLayer = Object.values(allLayerProps).find(l => l?.order === (layerProps.order+1))
        layerProps?.layers?.forEach(l => {
            if(maplibreMap.getLayer(beneathLayer?.id)){
              maplibreMap.addLayer(l, beneathLayer?.id) 
            } else {
              maplibreMap.addLayer(l) 
            }
        })
      }
    }

    if(prevLayerProps?.order !== undefined && layerProps?.order < prevLayerProps?.order) {
      let beneathLayer = Object.values(allLayerProps).find(l => l?.order === (layerProps?.order+1))
      layerProps?.layers?.forEach(l => {
        if(maplibreMap.getLayer(l?.id)){
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
    

    // -------------------------------
    // Apply filters
    // -------------------------------
    const { filter: layerFilter } = layerProps;
    layerProps?.layers?.forEach((l,i) => {
      if(maplibreMap.getLayer(l.id)){
        if(layerFilter){
          const mapLayerFilter = Object.keys(layerFilter).map(
            (filterColumnName) => {
              let mapFilter = [];
              const filterOperator = layerFilter[filterColumnName].operator;
              const filterValue = layerFilter[filterColumnName].value;
              const filterColumnClause = ["get", filterColumnName];

              if(filterOperator === 'between') {
                mapFilter = [
                  "all",
                  [">=", ["to-string", filterColumnClause], ["to-string", filterValue?.[0]]],
                  ["<=", ["to-string", filterColumnClause], ["to-string", filterValue?.[1]]],
                ];
              }
              else {
                if (["==", "!="].includes(filterOperator)) {
                  //Allows for `or`, i.e. ogc_fid = 123 or 456
                  mapFilter = [
                    "in",
                    filterColumnClause,
                    ["literal", filterValue]
                  ];

                  if(filterOperator === "!="){
                    mapFilter = ["!", mapFilter];
                  }
                }
                else {
                  mapFilter = [
                    filterOperator,
                    ["to-string", filterColumnClause],
                    ["to-string", filterValue]
                  ];
                }
              }

              return mapFilter;
            }
          );
          maplibreMap.setFilter(l.id, ["all", ...mapLayerFilter]);
        }
      }
    });
  }, [layerProps]);

  useEffect(() => {
    if (maplibreMap && allLayerProps && allLayerProps?.zoomToFit?.length > 0){
      maplibreMap.fitBounds(allLayerProps.zoomToFit, {
        duration: 400
      });
    }
  }, [maplibreMap, allLayerProps?.zoomToFit]);
}

const getLayerTileUrl = (tileBase, layerProps) => {
  let newTileUrl = tileBase;

  const layerHasFilter = layerProps?.filter && Object.keys(layerProps?.filter)?.length > 0;
  const getUrlHasDataColumn = (url) => url.includes(layerProps?.["data-column"]);
  if (newTileUrl && (layerProps?.["data-column"] || layerHasFilter)) {
    if (!newTileUrl?.includes("?cols=")) {
      newTileUrl += `?cols=`;
    }

    if (layerProps?.["data-column"] && !getUrlHasDataColumn(newTileUrl)) {
      newTileUrl += layerProps?.["data-column"];
    }

    if (getUrlHasDataColumn(newTileUrl) && layerHasFilter) {
      newTileUrl += ",";
    }

    if (layerHasFilter) {
      Object.keys(layerProps.filter).forEach((filterCol, i) => {
        newTileUrl += `${filterCol}`;

        if (i < Object.keys(layerProps.filter).length - 1) {
          newTileUrl += ",";
        }
      });
    }
  }

  return newTileUrl;
};

class ViewLayer extends AvlLayer { 
  // constructor makes onHover not work??
  // constructor(layer, view) { 
  //   super();

  //   this.id = layer.id;
  //   // this.name = `Layer ${ layer.layerId }`;
  //   //console.log('sources', layer.layers)
  //   //this.startActive = true;
  //   //this.viewId = layer.view_id;
  //   this.sources = layer.sources.map(s => {
  //     let newSource = cloneDeep(s)
  //     newSource.id = `${layer.id}_${newSource.id}`
  //     return newSource
  //   })
  //   this.layers = layer.layers.map(l => {
  //     let newLayer = cloneDeep(l)
  //     newLayer.source = `${layer.id}_${l.source}`
  //     return newLayer
  //   })
    
  // }

  onHover = {
    layers: this.layers
      .filter(d => d?.id?.indexOf('_case') === -1)
      .map((d) => d.id),
    callback: (layerId, features, lngLat) => {

      //console.log('hover callback')
      let feature = features[0];
      // console.log('testing feature', feature)

      let data = [feature.id, layerId, (features[0] || {}).properties];

      return data;
    },
    Component: HoverComp,
    // Component: ({ data, layer }) => { 
    //   if(!layer.props.hover) return
    //   return (
    //     <div className='p-2 bg-white'>
    //       <pre>{JSON.stringify(data,null,3)}</pre>
    //     </div>
    //   )
    // },
    isPinnable: this.isPinnable || true
  };
  
  RenderComponent = ViewLayerRender;
}

export default ViewLayer;




const HoverComp = ({ data, layer }) => {
  if(!layer.props.hover) return
  const { source_id, view_id } = layer;
  const dctx = React.useContext(DamaContext);
  const cctx = React.useContext(CMSContext);
  const ctx = dctx?.falcor ? dctx : cctx;
  const { pgEnv, falcor, falcorCache } = ctx;
  const id = React.useMemo(() => get(data, "[0]", null), [data]);
  // console.log(source_id, view_id, id)

  const hoverColumns = React.useMemo(() => {
    return layer.props['hover-columns'];
  }, [layer]);

  useEffect(() => {
    if(source_id) {
      falcor.get([
          "dama", pgEnv, "sources", "byId", source_id, "attributes", "metadata"
      ]);
    }
    
  }, [source_id, hoverColumns]);



  // useEffect(() => {
  //   if(view_id) {
  //     falcor.get([
  //        "dama", pgEnv, "viewsbyId", view_id, "databyId", ''+id
  //     ]).then(d => console.log('getting', [ "dama", pgEnv, "viewsbyId", view_id, "databyId", id], d))
  //   }
  // },[pgEnv,view_id,id])

  const attributes = React.useMemo(() => {
    if (!hoverColumns) {
      let out = get(falcorCache, [
        "dama", pgEnv, "sources", "byId", source_id, "attributes", "metadata", "value", "columns"
      ], [])
      if(out.length === 0) {
          out = get(falcorCache, [
            "dama", pgEnv, "sources", "byId", source_id, "attributes", "metadata", "value"
          ], [])
        }
      return out
    }
    else {
      return hoverColumns;
    }

  }, [source_id, falcorCache, hoverColumns]);

  const metadata = React.useMemo(() => {
    let out = get(falcorCache, [
      "dama", pgEnv, "sources", "byId", source_id, "attributes", "metadata", "value", "columns"
    ], [])
    if(out.length === 0) {
        out = get(falcorCache, [
          "dama", pgEnv, "sources", "byId", source_id, "attributes", "metadata", "value"
        ], [])
      }
    return out
  }, [source_id, falcorCache]);

  let getAttributes = (typeof attributes?.[0] === 'string' ?
    attributes : attributes.map(d => d.name || d.column_name)).filter(d => !['wkb_geometry'].includes(d))

  React.useEffect(() => {
    falcor.get([
      "dama",
      pgEnv,
      "viewsbyId",
      view_id,
      "databyId",
      id,
      getAttributes
    ])
    //.then(d => console.log('got attributes', d));
  }, [falcor, pgEnv, view_id, id, attributes]);

  const attrInfo = React.useMemo(() => {
    return get(
      falcorCache,
      ["dama", pgEnv, "viewsbyId", view_id, "databyId", ''+id],
      {}
    )
  }, [id, falcorCache, view_id, pgEnv]);

  return (
    <div className="bg-white p-4 max-h-64 max-w-lg min-w-[300px] scrollbar-xs overflow-y-scroll">
      <div className="font-medium pb-1 w-full border-b ">
        {layer?.name || ''}
      </div>
      {Object.keys(attrInfo).length === 0 && attributes.length !== 0 ? `Fetching Attributes ${id}` : ""}
      {Object.keys(attrInfo)
        .filter((k) => typeof attrInfo[k] !== "object")
        .sort((a,b) =>{
          const aIndex = (hoverColumns?.findIndex(column => column.column_name === a) || 0);
          const bIndex = (hoverColumns?.findIndex(column => column.column_name === b) || 0);
          return aIndex - bIndex;
        })
        .map((k, i) => {
          const hoverAttr = attributes.find(attr => attr.name === k || attr.column_name === k) || {};

          const metadataAttr = metadata.find(attr => attr.name === k || attr.column_name === k) || {};
          const columnMetadata = JSON.parse(metadataAttr?.meta_lookup || "{}");
          if ( !(hoverAttr.name || hoverAttr.display_name) ) {
            return <></>;
          }
          else {
            return (
              <div className="flex border-b pt-1" key={i}>
                <div className="flex-1 font-medium text-xs text-slate-400 pl-1">{hoverAttr.display_name || hoverAttr.name }</div>
                <div className="flex-1 text-right text-sm font-thin pl-4 pr-1">
                  {attrInfo?.[k] !== "null" ? get(columnMetadata, attrInfo?.[k],attrInfo?.[k]) : ""}
                </div>
              </div>
            );
          }
        })}
    </div>
  );
};