import React, { useState, useEffect, createContext } from "react"
import { useSearchParams, Link } from "react-router-dom";
import get from "lodash/get"

import { AvlMap as AvlMap2 } from "~/modules/avl-map-2/src"
import { PMTilesProtocol } from '~/pages/DataManager/utils/pmtiles/index.ts'

import LayerManager from './components/LayerManager'
import LayerEditor from './components/LayerEditor'

export const SymbologyContext = createContext(undefined);


const MapEditor = ({collection, symbologies, activeSymbologyId, ...props}) => {
  
  
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
    sources: [],
    layers: []
  }

  const [symbology,setSymbology] = useState(
    symbologies.find(s => +s.symbology_id === +activeSymbologyId) ||
    blankSymbology
  )

  // update on active symbology id
  useEffect(() => {
    let test = 
    console.log('update active symbology', activeSymbologyId, symbologies, symbologies.find(s => +s.symbology_id === +activeSymbologyId))
    setSymbology(
      symbologies.find(s => +s.symbology_id === +activeSymbologyId) ||
      blankSymbology
    )
  },[symbologies,activeSymbologyId])

  // --------------------------------------------------
  const [activeLayer, setActiveLayer] = useState(null)


  const layers = []
	
	return (
    <SymbologyContext.Provider value={{symbology,setSymbology, activeLayer, setActiveLayer}}>
      <div className="w-full h-full relative">
        <AvlMap2
          layers={ layers }
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