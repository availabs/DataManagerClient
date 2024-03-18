import React, { useState, useEffect, useMemo, createContext, useRef } from "react"
import { useImmer } from 'use-immer';
import { useSearchParams, Link } from "react-router-dom";
import get from "lodash/get"

import { AvlMap as AvlMap2 } from "~/modules/avl-map-2/src"
import { PMTilesProtocol } from '~/pages/DataManager/utils/pmtiles/index.ts'

import LayerManager from './components/LayerManager'
import LayerEditor from './components/LayerEditor'

import SymbologyViewLayer from './components/SymbologyViewLayer'

export const SymbologyContext = createContext(undefined);


const MapEditor = ({collection, symbologies, activeSymbologyId, ...props}) => {
  const mounted = useRef(false);
  // --------------------------------------------------
  // Symbology Object
  // Single Source of truth for everything in this view
  // once loaded this is mutable here 
  // and can then be discarded or saved to db
  // ---------------------------------------------------
  const blankSymbology = {
    name: 'New Map',
    collection_id: collection.collection_id,
    description: '',
    layers: {},
    mapLayers: []
  }

  const [symbology,setSymbology] = useImmer(
    symbologies.find(s => +s.symbology_id === +activeSymbologyId) ||
    blankSymbology
  )

  // update on active symbology id
  // useEffect(() => {
  //   let test = 
  //   console.log('update active symbology', activeSymbologyId, symbologies, symbologies.find(s => +s.symbology_id === +activeSymbologyId))
    
  //   setSymbology(
  //     symbologies.find(s => +s.symbology_id === +activeSymbologyId) ||
  //     blankSymbology
  //   )
  // },[symbologies,activeSymbologyId])

  // --------------------------------------------------
  
  // let savelayers = []
  // const mapLayers = React.useMemo(() => {
   
  //     let currentLayerIds = savelayers.map(d => d.id).filter(d => d)
            

  //     let newLayers = Object.values(symbology.layers)
  //       .filter(d => d)
  //       .filter(d => !currentLayerIds.includes(d.id))
  //       .map(l => {
  //         return new SymbologyViewLayer(l)
  //       })
  //           //console.log('new layers', newLayers, Object.values(symbology.layers))
      
  //     let oldLayers = savelayers.filter(d => Object.keys(symbology.layers).includes(d.id))

  //       console.log('adding new layers', newLayers, oldLayers)
  //       savelayers = [
  //           // keep existing layers & filter
  //           ...oldLayers, 
  //           // add new layers
  //           ...newLayers
  //       ]
  //       return savelayers
    
  //   }, [symbology.layers])

  // console.log('maplayers', mapLayers)



  React.useEffect(() => {
    // console.log('symbology layers effect')
    const updateLayers = async () => {
      if(mounted.current) {
          setSymbology(draftSymbology => {

            let currentLayerIds = draftSymbology.mapLayers.map(d => d.id).filter(d => d)
      
            let newLayers = Object.values(symbology.layers)
              .filter(d => d)
              .filter(d => !currentLayerIds.includes(d.id))
              .map(l => {
                return new SymbologyViewLayer(l)
              })
            let oldLayers = draftSymbology.mapLayers.filter(d => Object.keys(symbology.layers).includes(d.id))
            
            // console.log('update layers old:', oldLayers, 'new:', newLayers)
            draftSymbology.mapLayers =  [
                // keep existing layers & filter
                ...oldLayers, 
                // add new layers
                ...newLayers
            ]
            
          })
      }
    }
    updateLayers()
  }, [symbology.layers])
  const mapLayers = useMemo(() => symbology.mapLayers, [symbology.mapLayers])

  const layerProps = useMemo(() =>  symbology.layers, [symbology.layers]);

  
	
	return (
    <SymbologyContext.Provider value={{symbology,setSymbology}}>
      <div className="w-full h-full relative" ref={mounted}>
        <AvlMap2
          layers={ mapLayers }
          layerProps = {layerProps}
          mapOptions={ {
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
          } }
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