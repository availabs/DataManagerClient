import React, { useState, useEffect, useMemo, createContext, useRef } from "react"
import { useImmer } from 'use-immer';
import { useSearchParams, Link } from "react-router-dom";
import get from "lodash/get"
import isEqual from "lodash/isEqual"
import throttle from "lodash.throttle"

import {PMTilesProtocol} from '../../../../utils/pmtiles/index.ts'
import { AvlMap as AvlMap2 } from "~/modules/avl-map-2/src"
// import { PMTilesProtocol } from '~/pages/DataManager/utils/pmtiles/index.ts'

import { DamaContext } from "../../../../store"

import LayerManager from './components/LayerManager'
import LayerEditor from './components/LayerEditor'

import SymbologyViewLayer from './components/SymbologyViewLayer'


export const SymbologyContext = createContext(undefined);


const MapEditor = ({collection, symbologies, activeSymbologyId, ...props}) => {
  
  const mounted = useRef(false);
  const {falcor, pgEnv} = React.useContext(DamaContext)
  // --------------------------------------------------
  // Symbology Object
  // Single Source of truth for everything in this view
  // once loaded this is mutable here 
  // and is written to db on change
  // ---------------------------------------------------
  const [state,setState] = useImmer(
    symbologies.find(s => +s.symbology_id === +activeSymbologyId) ||
    {
      name: '',
      collection_id: collection.collection_id,
      description: '',
      // symbology: {
      //   layers: {},
      // }
    }
  )


  useEffect(() => {
    async function updateData() {
      console.time('update symbology')
      //console.log('updating symbology to:', state.symbology)
      let resp = await falcor.set({
        paths: [['dama', pgEnv, 'symbologies', 'byId', +activeSymbologyId, 'attributes', 'symbology']],
        jsonGraph: { dama: { [pgEnv]: { symbologies: { byId: { 
          [+activeSymbologyId]: { attributes : { symbology: JSON.stringify(state.symbology) }}
        }}}}}
      })
      console.timeEnd('update symbology')
      
      //console.log('resp',resp)
    }

    let currentData = symbologies.find(s => +s.symbology_id === +activeSymbologyId)
    
    // console.log('check update', 
    //   Object.values(state?.symbology?.layers || {}).map(l => `${l?.name} ${l?.order}`), 
    //   Object.values(currentData?.symbology?.layers || {}).map(l => `${l?.name} ${l?.order}`),
    //   state?.symbology?.layers,
    //   currentData?.symbology?.layers,
    //   symbologies.find(s => +s.symbology_id === +activeSymbologyId),
    //   activeSymbologyId,      
    //   symbologies,
    //   // !isEqual(state?.symbology, currentData?.symbology), 
    //   // state?.symbology?.layers && currentData?.symbology?.layers && !isEqual(state?.symbology, currentData?.symbology)
    // )
    
    if(state?.symbology?.layers && currentData && !isEqual(state?.symbology, currentData?.symbology)) {
      updateData()
      //throttle(updateData,500)
    }
  },[state.symbology])
  // console.log('render', state, activeSymbologyId, symbologies.find(s => +s.symbology_id === +activeSymbologyId)) 
  useEffect(() => {
    // -------------------
    // on navigate or load set state to symbology with data
    // TODO: load state.symbology here and dont autoload them in Collection/index
    // -------------------
    if(symbologies.find(s => +s.symbology_id === +activeSymbologyId)) {
      setState(symbologies.find(s => +s.symbology_id === +activeSymbologyId))
    }
  },[symbologies.length, activeSymbologyId])

  //--------------------------
  // -- Map Layers are the instantation
  // -- of state.symbology.layers as SymbologyViewLayers
  // -------------------------
  const [mapLayers, setMapLayers] = useImmer([])

 

  useEffect(() => {
    // -----------------------
    // Update map layers on map
    // when state.symbology.layers update
    // -----------------------

    console.log('symbology layers effect')
    const updateLayers = async () => {
      if(mounted.current) {
          setMapLayers(draftMapLayers => {

            let currentLayerIds = draftMapLayers.map(d => d.id).filter(d => d)
      
            let newLayers = Object.values(state?.symbology?.layers || {})
              .filter(d => d)
              .filter(d => !currentLayerIds.includes(d.id))
              .sort((a,b) => b.order - a.order)
              .map(l => {
                return new SymbologyViewLayer(l)
              })
            let oldLayers = draftMapLayers.filter(d => Object.keys(state?.symbology?.layers || {}).includes(d.id))
            
            const out = [
                // keep existing layers & filter
                ...oldLayers, 
                // add new layers
                ...newLayers
            ].sort((a,b) => state.symbology.layers[b.id].order - state.symbology.layers[a.id].order)
            // console.log('update layers old:', oldLayers, 'new:', newLayers, 'out', out)
            return out
          })
      }
    }
    updateLayers()
  }, [state?.symbology?.layers])
  

  const layerProps = useMemo(() =>  state?.symbology?.layers || {}, [state?.symbology?.layers]);

  // console.log('render', mapLayers.map(l => `${l?.props?.name} ${l?.props?.order}`))  
	// console.log('state activeLayer', get(state,`symbology.layers[${state?.symbology?.activeLayer}]`, {}))


	return (
    <SymbologyContext.Provider value={{state, setState, collection, symbologies}}>
      <div className="w-full h-full relative" ref={mounted}>
        <AvlMap2
          layers={ mapLayers }
          layerProps = {layerProps}
          mapOptions={{
            center: [-76, 43.3],
            zoom: 6,
            protocols: [PMTilesProtocol],
            styles: [
              {
                name: "dataviz",
                style: "https://api.maptiler.com/maps/dataviz/style.json?key=mU28JQ6HchrQdneiq6k9"
              },
              {
                name: "streets",
                style: "https://api.maptiler.com/maps/streets-v2/style.json?key=mU28JQ6HchrQdneiq6k9"
              },
              {
                name: "toner",
                style: "https://api.maptiler.com/maps/toner-v2/style.json?key=mU28JQ6HchrQdneiq6k9"
              },
              {
                name: "new-style",
                style: "https://api.maptiler.com/maps/dataviz/style.json?key=mU28JQ6HchrQdneiq6k9"
              }
            ]
          }}
          leftSidebar={ false }
          rightSidebar={ false }
        />
        <div className={'z-30 absolute inset-0 flex pointer-events-none'}>
          <LayerManager />
          <div className='flex-1'/>
          <LayerEditor />
        </div>
      </div>
    </SymbologyContext.Provider>
	)
}



export default MapEditor;