import React, { useState, useEffect, useMemo, createContext, useRef } from "react"
import { useImmer } from 'use-immer';
import { useSearchParams, Link, useNavigate, useParams } from "react-router-dom";
import get from "lodash/get"
import isEqual from "lodash/isEqual"
//import throttle from "lodash/throttle"
import { SymbologyAttributes } from "~/pages/DataManager/Collection/attributes";
import { usePrevious } from './components/LayerManager/utils'
import {PMTilesProtocol} from '../utils/pmtiles/index.ts'
import { AvlMap as AvlMap2 } from "~/modules/avl-map-2/src"
// import { PMTilesProtocol } from '~/pages/DataManager/utils/pmtiles/index.ts'

import { DamaContext } from "../store"

import LayerManager from './components/LayerManager'
import LayerEditor from './components/LayerEditor'

import SymbologyViewLayer from './components/SymbologyViewLayer'
import { getAttributes } from "~/pages/DataManager/Collection/attributes";

export const SymbologyContext = createContext(undefined);

export const LOCAL_STORAGE_KEY_BASE = 'mapeditor_symbology_'

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

  useEffect(() => {
    async function fetchAllSymbologies() {
      const symbologyLengthPath = ["dama", pgEnv, "symbologies", "length"];
      const resp = await falcor.get(symbologyLengthPath);

      const symbologyIdsPath = [
        "dama",
        pgEnv,
        "symbologies",
        "byIndex",
        { from: 0, to: get(resp.json, symbologyLengthPath, 0) - 1 },
        "attributes", Object.values(SymbologyAttributes)
      ];
      await falcor.get(symbologyIdsPath);
    }

    fetchAllSymbologies();
  }, [symbologyId]);

  const symbologies = useMemo(() => {
    return Object.values(get(falcorCache, ["dama", pgEnv, "symbologies", "byIndex"], {}))
      .map(v => getAttributes(get(falcorCache, v.value, { "attributes": {} })["attributes"]))
      .filter(v => Object.keys(v).length > 0);
  }, [falcorCache, pgEnv]);

  const dbSymbology = useMemo(() => {
    return symbologies?.find(s => +s.symbology_id === +symbologyId);
  }, [symbologies, symbologyId]);

  let initialSymbology = {
    name: '',
    description: '',
    symbology: {
      layers: {},
    }
  };

  const symbologyLocalStorageKey = LOCAL_STORAGE_KEY_BASE + `${symbologyId}`;
  const rawLocalSymb = window?.localStorage?.getItem(symbologyLocalStorageKey);
  const localStorageSymbology = rawLocalSymb !== "undefined" ? JSON.parse(rawLocalSymb) : null;
  if(localStorageSymbology){
    initialSymbology = localStorageSymbology;
  }
  else if (dbSymbology) {
    initialSymbology = dbSymbology;
  }

  // Sets an initial `activeLayer`
  if (
    !!initialSymbology?.symbology?.layers &&
    Object.keys(initialSymbology?.symbology?.layers).length > 0 &&
    (initialSymbology?.symbology?.activeLayer === "" || 
      !initialSymbology?.symbology.layers[initialSymbology?.symbology?.activeLayer]
    ) 
  ) {
    initialSymbology.symbology.activeLayer = Object.values(
      initialSymbology?.symbology?.layers
    ).find((layer) => layer.order === 0)?.id;
  }

  // --------------------------------------------------
  // Symbology Object
  // Single Source of truth for everything in this view
  // once loaded this is mutable here 
  // and is written to db on change
  // ---------------------------------------------------
  const [state,setState] = useImmer(initialSymbology)

  // Resets state if URL param does not match symbology currently in state
  useEffect(() => {
    // console.log('load', +symbologyId, symbologyId, symbologies)
    if (!!state.symbology_id && (+symbologyId !== +state.symbology_id)) {
      setState(initialSymbology);
    }
  },[initialSymbology]);

  // Updates localStorage whenever state changes 
  useEffect(() => {
    function updateData() {
      if(window.localStorage) { 
        window.localStorage.setItem(symbologyLocalStorageKey, JSON.stringify(state))
      }
    }

    if(state?.symbology?.layers && !isEqual(state, initialSymbology)) {
      updateData()
    }
  },[state?.symbology,  initialSymbology]);


  // If we don't have local storage data for this symbology, use data from API
  useEffect(() => {
    // -------------------
    // on navigate or load set state to symbology with data
    // TODO: load state.symbology here and dont autoload them in Collection/index
    // -------------------
    if(!localStorageSymbology && dbSymbology) {
      setState(dbSymbology)
    }
  },[symbologies.length, dbSymbology])

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
            ]
            //.filter(d => state.symbology.layers[d.id])
            .sort((a,b) => state.symbology.layers[b?.id]?.order - state.symbology.layers[a?.id]?.order)
            //console.log('update layers old:', oldLayers, 'new:', newLayers, 'out', out)
            return out
          })
      }
    }
    updateLayers()
  }, [state?.symbology?.layers, state?.symbology?.zoomToFit])
  

  const layerProps = useMemo(() =>  ({ ...state?.symbology?.layers, zoomToFit: state?.symbology?.zoomToFit } || {}), [state?.symbology?.layers, state?.symbology?.zoomToFit]);

  const { activeLayerType, selectedInteractiveFilterIndex, currentInteractiveFilter } = useMemo(() => {
    const selectedInteractiveFilterIndex = get(state,`symbology.layers[${state?.symbology?.activeLayer}]['selectedInteractiveFilterIndex']`);
    return {
      activeLayerType: get(state,`symbology.layers[${state?.symbology?.activeLayer}]['layer-type']`, {}),
      selectedInteractiveFilterIndex,
      currentInteractiveFilter: get(
        state,
        `symbology.layers[${state?.symbology?.activeLayer}]['interactive-filters'][${selectedInteractiveFilterIndex}]`,
      )
    }
  },[state?.symbology.layers]);

  //Handles updates for Interactive Filters for the ACTIVE LAYER
  useEffect(() => {
    const updateSymbology = () => {
      setState((draft) => {
        const draftActiveLayer = draft.symbology.layers[draft?.symbology?.activeLayer];
        const draftFilters =  get(draft,`symbology.layers[${draft?.symbology?.activeLayer}]['interactive-filters']`);
        const draftInteractiveFilter = get(draft,`symbology.layers[${draft?.symbology?.activeLayer}]['interactive-filters'][${selectedInteractiveFilterIndex}]`)
        if(draftInteractiveFilter) {
          draft.symbology.layers[draft?.symbology?.activeLayer] = {
            ...draftActiveLayer,
            ...draftInteractiveFilter,
            order: draftActiveLayer.order,
            "layer-type": "interactive",
            "interactive-filters": draftFilters,
            selectedInteractiveFilterIndex: selectedInteractiveFilterIndex
          };
        }
      });
    };

    if (activeLayerType === "interactive" && selectedInteractiveFilterIndex !== undefined ) {
      updateSymbology();
    }
  }, [selectedInteractiveFilterIndex, activeLayerType, currentInteractiveFilter]);

  const interactiveFilterIndicies = useMemo(
    () =>
      Object.values(state.symbology.layers).map(
        (l) => l.selectedInteractiveFilterIndex
      ),
    [state.symbology.layers]
  );
  const prevInteractiveIndicies = usePrevious(interactiveFilterIndicies);

  // Handles all non-active layers. We only need to listen for index changes.
  useEffect(() => {
    setState((draft) => {
      Object.values(draft.symbology.layers)
        .filter(l => l['layer-type'] === 'interactive' && l.id !== draft.symbology.activeLayer)
        .forEach(l => {
          const draftFilters =  get(l,`['interactive-filters']`);
          const draftFilterIndex = l.selectedInteractiveFilterIndex;
          const draftInteractiveFilter = draftFilters[draftFilterIndex] 

          if(draftInteractiveFilter) {
            draft.symbology.layers[l.id] = {
              ...l,
              ...draftInteractiveFilter,
              order: l.order,
              "layer-type": "interactive",
              "interactive-filters": draftFilters,
              selectedInteractiveFilterIndex: draftFilterIndex
            };
          }
        })
    });
  }, [isEqual(interactiveFilterIndicies, prevInteractiveIndicies)])

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