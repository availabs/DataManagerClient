import React, { useState, useEffect, useMemo, createContext, useRef } from "react"
import { useImmer } from 'use-immer';
import { useSearchParams, Link, useNavigate, useParams } from "react-router-dom";
import get from "lodash/get"
import isEqual from "lodash/isEqual"
//import throttle from "lodash/throttle"
import { SymbologyAttributes } from "~/pages/DataManager/Collection/attributes";

import {PMTilesProtocol} from '../utils/pmtiles/index.ts'
import { AvlMap as AvlMap2 } from "~/modules/avl-map-2/src"
// import { PMTilesProtocol } from '~/pages/DataManager/utils/pmtiles/index.ts'

import { DamaContext } from "../store"

import LayerManager from './components/LayerManager'
import LayerEditor from './components/LayerEditor'

import SymbologyViewLayer from './components/SymbologyViewLayer'

import {terrain_3d_source} from './components/styles/4dsource.js'


export const SymbologyContext = createContext(undefined);


const MapEditor = () => {
  const mounted = useRef(false);
  const {falcor, falcorCache, pgEnv, baseUrl} = React.useContext(DamaContext);
  const navigate = useNavigate()
  const { symbologyId } = useParams()

  useEffect(() => {
    async function fetchSymbologyData() {
      // console.log('fetchSymbologyData ids', symbologyIds)
      const symbologyPath = ["dama", pgEnv, "symbologies", "byId", [symbologyId] , "attributes", Object.values(SymbologyAttributes)];
      await falcor.get(symbologyPath);
    };

    if(symbologyId){
      fetchSymbologyData();
    }
  }, [symbologyId, pgEnv])

  const symbologies = useMemo(() => {
    const cacheSymbologies = (get(falcorCache, ["dama", pgEnv, "symbologies", "byId"], {}))
    return Object.values(cacheSymbologies)
      .map((v) => {
        // if symbology is created by call it returns in value
        let curVal = v.attributes?.value ? v.attributes?.value : v.attributes
        const newVal = { ...curVal};
        Object.keys(v.attributes).forEach((key) => {
          newVal[key] = v.attributes[key]?.value || v.attributes[key];
        });
        return newVal;
      })

  }, [falcorCache, pgEnv]);

  // --------------------------------------------------
  // Symbology Object
  // Single Source of truth for everything in this view
  // once loaded this is mutable here 
  // and is written to db on change
  // ---------------------------------------------------
  const [state,setState] = useImmer(
    symbologies?.find(s => +s.symbology_id === +symbologyId) ||
    {
      name: '',
      // collection_id: collection.collection_id,
      description: '',
      // symbology: {
      //   layers: {},
      // }
    }
  )

  useEffect(() => {
    // console.log('load', +symbologyId, symbologyId, symbologies)
    if(!(symbologyId) && (+symbologyId) && +symbologyId !== +symbologyId) {
      navigate(`${baseUrl}/mapeditor/${symbologyId}`)
      let currentData = symbologies.find(s => +s.symbology_id === +symbologyId)
      setState(currentData)
    }
  },[symbologyId, symbologyId, symbologies, falcorCache])

  useEffect(() => {
    async function updateData() {
      //console.time('update symbology')
      //console.log('updating symbology to:', state.symbology)
      let resp = await falcor.set({
        paths: [['dama', pgEnv, 'symbologies', 'byId', +symbologyId, 'attributes', 'symbology']],
        jsonGraph: { dama: { [pgEnv]: { symbologies: { byId: { 
          [+symbologyId]: { attributes : { symbology: JSON.stringify(state.symbology) }}
        }}}}}
      })
      //console.timeEnd('update symbology')
      
      //console.log('resp',resp)
    }

    async function updateName() {
      let resp = await falcor.set({
        paths: [['dama', pgEnv, 'symbologies', 'byId', +symbologyId, 'attributes', 'name']],
        jsonGraph: { dama: { [pgEnv]: { symbologies: { byId: { 
          [+symbologyId]: { attributes : { name: state.name }}
        }}}}}
      })
    }

    let currentData = symbologies.find(s => +s.symbology_id === +symbologyId)
    
    // console.log('check update', 
    //   Object.values(state?.symbology?.layers || {}).map(l => `${l?.name} ${l?.order}`), 
    //   Object.values(currentData?.symbology?.layers || {}).map(l => `${l?.name} ${l?.order}`),
    //   state?.symbology?.layers,
    //   currentData?.symbology?.layers,
    //   symbologies.find(s => +s.symbology_id === +symbologyId),
    //   symbologyId,      
    //   symbologies,
    //   !isEqual(state?.symbology, currentData?.symbology), 
    //   // state?.symbology?.layers && currentData?.symbology?.layers && !isEqual(state?.symbology, currentData?.symbology)
    // )
    
    if(state?.symbology?.layers && currentData && !isEqual(state?.symbology, currentData?.symbology)) {
      updateData()
      //throttle(updateData,500)
    }
    if(state?.name && state?.name !== currentData.name) {
      updateName()
    }
  },[state.symbology, state.name])
  // console.log('render', state, symbologyId, symbologies.find(s => +s.symbology_id === +symbologyId)) 
  useEffect(() => {
    // -------------------
    // on navigate or load set state to symbology with data
    // TODO: load state.symbology here and dont autoload them in Collection/index
    // -------------------
    if(symbologies.find(s => +s.symbology_id === +symbologyId)) {
      setState(symbologies.find(s => +s.symbology_id === +symbologyId))
    }
  },[symbologies.length, symbologyId])

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

    // console.log('symbology layers effect')
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
    <SymbologyContext.Provider value={{state, setState, symbologies}}>
      <div className="w-full h-full relative" ref={mounted}>
        <AvlMap2
          layers={ mapLayers }
          layerProps = {layerProps}
          hideLoading={true}
          showLayerSelect={true}
          mapOptions={{
            center: [-76, 43.3],
            zoom: 6,
            maxPitch: 60,
            protocols: [PMTilesProtocol],
            
            styles: [
              {
                name: "Default",
                style: "https://api.maptiler.com/maps/dataviz/style.json?key=mU28JQ6HchrQdneiq6k9"
              },
              { name: "Satellite",
                style: "https://api.maptiler.com/maps/hybrid/style.json?key=mU28JQ6HchrQdneiq6k9",
              },
              { name: "Streets",
                style: "https://api.maptiler.com/maps/streets-v2/style.json?key=mU28JQ6HchrQdneiq6k9",
              },
             
              { name: "Light",
                style: "https://api.maptiler.com/maps/dataviz-light/style.json?key=mU28JQ6HchrQdneiq6k9"
              },
              { name: "Dark",
                style: "https://api.maptiler.com/maps/dataviz-dark/style.json?key=mU28JQ6HchrQdneiq6k9"
              },
              // {
              //   name: 'Sattelite 3d ',
              //   style: terrain_3d_source
              // }
            ]
          }}
          leftSidebar={ false }
          rightSidebar={ false }
        />
        <div className={'absolute inset-0 flex pointer-events-none'}>
          <LayerManager />
          <div className='flex-1'/>
          <LayerEditor />
        </div>
      </div>
    </SymbologyContext.Provider>
	)
}



export default MapEditor;