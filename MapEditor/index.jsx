import React, { useState, useEffect, useMemo, createContext, useRef } from "react"
import { useImmer } from 'use-immer';
import { useSearchParams, Link, useNavigate, useParams } from "react-router-dom";
import get from "lodash/get"
import set from "lodash/set"
import isEqual from "lodash/isEqual"
//import throttle from "lodash/throttle"
import { SymbologyAttributes } from "~/pages/DataManager/Collection/attributes";
import { usePrevious } from './components/LayerManager/utils'
import {PMTilesProtocol} from '../utils/pmtiles/index.ts'
import { AvlMap as AvlMap2 } from "~/modules/avl-map-2/src"
// import { PMTilesProtocol } from '~/pages/DataManager/utils/pmtiles/index.ts'
import { rgb2hex, toHex, categoricalColors, rangeColors } from './components/LayerManager/utils'
import {categoryPaint, isValidCategoryPaint ,choroplethPaint} from './components/LayerEditor/datamaps'
import cloneDeep from 'lodash/cloneDeep'
import colorbrewer from './components/LayerManager/colors'//"colorbrewer"
import { ViewAttributes } from "../Source/attributes"

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
      //TODO -- after adding about 8-10 interactive filters, localstorage got too full
      try {
        if(window.localStorage) { 
          window.localStorage.setItem(symbologyLocalStorageKey, JSON.stringify(state))
        }
      } catch(e) {
        console.error(e);
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
    const selectedInteractiveFilterIndex = get(state,`symbology.layers[${state?.symbology?.activeLayer}]['selectedInteractiveFilterIndex']`, 0);
    return {
      selectedInteractiveFilterIndex,
      activeLayerType: get(state,`symbology.layers[${state?.symbology?.activeLayer}]['layer-type']`, {}),
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
            name: draftActiveLayer.name,
            filter: draftInteractiveFilter.filter ?? {},
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
  const isInteractiveLayer = state?.symbology?.layers?.[state?.symbology?.activeLayer]?.['layer-type'] === 'interactive';
  const pathBase = isInteractiveLayer
      ? `symbology.layers[${state.symbology.activeLayer}]['interactive-filters'][${selectedInteractiveFilterIndex}]`
      : `symbology.layers[${state.symbology.activeLayer}]`;

  let { layerType, viewId, sourceId,paintValue, column, categories, categorydata, colors, colorrange, numCategories, numbins, method, showOther, symbology_id, choroplethdata, filterGroupEnabled, filterGroupLegendColumn, viewGroupEnabled,layerPaintPath, viewGroupId, initialViewId, baseDataColumn } = useMemo(() => {
    const polygonLayerType = get(state, `${pathBase}['type']`, {});
    const paintPaths = {
      'fill':"layers[1].paint['fill-color']",
      'circle':"layers[0].paint['circle-color']",
      'line':"layers[1].paint['line-color']"
    }

    const layerPaintPath = paintPaths[polygonLayerType];
   
    return {
      layerPaintPath,
      layerType: get(state, `${pathBase}['layer-type']`, {}),
      viewId: get(state,`symbology.layers[${state.symbology.activeLayer}].view_id`),
      sourceId: get(state,`symbology.layers[${state.symbology.activeLayer}].source_id`),
      paintValue: get(state, `${pathBase}.${layerPaintPath}`, {}),
      baseDataColumn: get(state, `symbology.layers[${state.symbology.activeLayer}]['data-column']`, ''),
      column: get(state, `${pathBase}['data-column']`, ''),
      categories: get(state, `${pathBase}['categories']`, {}),
      categorydata: get(state, `${pathBase}['category-data']`, {}),
      choroplethdata: get(state, `${pathBase}['choroplethdata']`),
      colors: get(state, `${pathBase}['color-set']`, categoricalColors['cat1']),
      colorrange: get(state, `${pathBase}['color-range']`, colorbrewer['seq1'][9]),
      numbins: get(state, `${pathBase}['num-bins']`, 9),
      method: get(state, `${pathBase}['bin-method']`, 'ckmeans'),
      numCategories: get(state, `${pathBase}['num-categories']`, 10),
      showOther: get(state, `${pathBase}['category-show-other']`, '#ccc'),
      symbology_id: get(state, `symbology_id`),
      filterGroupEnabled: get(state,`${pathBase}['filterGroupEnabled']`, false),
      filterGroupLegendColumn:get(state,`${pathBase}['filter-group-legend-column']`),
      viewGroupEnabled: get(state,`${pathBase}['viewGroupEnabled']`, false),
      viewGroupId:get(state,`${pathBase}['view-group-id']`),
      initialViewId:get(state,`${pathBase}['initial-view-id']`),
    }
  },[state])

  useEffect(() => {
    //console.log('getmetadat', sourceId)
    if(sourceId) {
      falcor.get([
          "dama", pgEnv, "sources", "byId", sourceId, "attributes", "metadata"
      ])//.then(d => console.log('source metadata sourceId', sourceId, d));
    }
  },[sourceId])

  const metadata = useMemo(() => {
    //console.log('getmetadata', falcorCache)
      let out = get(falcorCache, [
          "dama", pgEnv, "sources", "byId", sourceId, "attributes", "metadata", "value", "columns"
      ], [])
      if(out.length === 0) {
        out = get(falcorCache, [
          "dama", pgEnv, "sources", "byId", sourceId, "attributes", "metadata", "value"
        ], [])
      }
      return out

  }, [sourceId,falcorCache])


  //----------------------------------
  // -- get selected source views
  // ---------------------------------
  useEffect(() => {
    async function fetchData() {
      //console.time("fetch data");
      const lengthPath = ["dama", pgEnv, "sources", "byId", sourceId, "views", "length"];
      const resp = await falcor.get(lengthPath);
      return await falcor.get([
        "dama", pgEnv, "sources", "byId", sourceId, "views", "byIndex",
        { from: 0, to: get(resp.json, lengthPath, 0) - 1 },
        "attributes", Object.values(ViewAttributes)
      ]);
    }
    if(sourceId) {
      fetchData();
    }
  }, [sourceId, falcor, pgEnv]);

  const views = useMemo(() => {
    return Object.values(get(falcorCache, ["dama", pgEnv, "sources", "byId", sourceId, "views", "byIndex"], {}))
      .map(v => getAttributes(get(falcorCache, v.value, { "attributes": {} })["attributes"]));
  }, [falcorCache, sourceId, pgEnv]);

  const prevViewGroupId = usePrevious(viewGroupId);

  useEffect(() => {
    const setPaint = async () => {
      if (layerType === 'categories') {
        let { paint, legend } = categories?.paint && categories?.legend
          ? cloneDeep(categories)
          : categoryPaint(
            baseDataColumn,
            categorydata,
            colors,
            numCategories,
            metadata
          );

        if (!(paint.length % 2)) {
          paint.push(showOther);
        } else {
          paint[paint.length-1] = showOther;
        }

        const isShowOtherEnabled = showOther === '#ccc';
        if(isShowOtherEnabled && legend) {
          if(legend[legend.length-1]?.label !== "Other") {
            legend.push({color: showOther, label: "Other"});
          }
          legend[legend.length-1].color = showOther;
        } else {
          if(legend[legend.length-1].label === "Other") {
            legend.pop();
          }
        }

        if(isValidCategoryPaint(paint) && !isEqual(paint,paintValue)) {
          setState(draft => {
            set(draft, `${pathBase}['categories']`, { paint, legend })
            set(draft, `${pathBase}.${layerPaintPath}`, paint)
            set(draft, `${pathBase}['legend-data']`, legend)
          })
        }
      } else if(layerType === 'choropleth') {
        const domainOptions = {
          column: baseDataColumn,
          viewId,
          numbins,
          method
        }

        let colorBreaks; 

        if(choroplethdata && Object.keys(choroplethdata).length === 2 && viewGroupId === prevViewGroupId) {
          colorBreaks = choroplethdata;
        }
        else {
          if(filterGroupEnabled) {
            domainOptions['column'] = filterGroupLegendColumn;
          }
          if(viewGroupEnabled) {
            domainOptions['viewId'] = viewGroupId;
          }

          setState(draft => {
            set(draft, `${pathBase}['is-loading-colorbreaks']`, true)
          })
          const res = await falcor.get([
            "dama", pgEnv, "symbologies", "byId", [symbology_id], "colorDomain", "options", JSON.stringify(domainOptions)
          ]);
          colorBreaks = get(res, [
            "json","dama", pgEnv, "symbologies", "byId", [symbology_id], "colorDomain", "options", JSON.stringify(domainOptions)
          ])
          setState(draft => {
            set(draft, `${pathBase}['is-loading-colorbreaks']`, false)
          })
        }
        let { paint, legend } = choroplethPaint(baseDataColumn, colorBreaks['max'], colorrange, numbins, method, colorBreaks['breaks'], showOther);
        const isShowOtherEnabled = showOther === '#ccc';
        if(isShowOtherEnabled) {
          if(legend[legend.length-1].label !== "No data") {
            legend.push({color: showOther, label: "No data"});
          }
          legend[legend.length-1].color = showOther;
        } else {
          if(legend[legend.length-1].label === "No data") {
            legend.pop();
          }
        }
        if(isValidCategoryPaint(paint) && !isEqual(paint, paintValue)) {
          setState(draft => {
            set(draft, `${pathBase}.${layerPaintPath}`, paint)
            set(draft, `${pathBase}['legend-data']`, legend)
            set(draft, `${pathBase}['choroplethdata']`, colorBreaks)
          })
        }
      } else if( layerType === 'simple' && typeof paintValue !== 'string') {
        // console.log('switch to simple')
        setState(draft => {
          set(draft, `${pathBase}.${layerPaintPath}`, rgb2hex(null))
        })
      }
    }
    setPaint();
  }, [categories, layerType, baseDataColumn,  categorydata, colors, numCategories, showOther, colorrange, numbins, method, choroplethdata, viewGroupId, filterGroupLegendColumn])

  const activeLayer = get(state,`symbology.layers[${state.symbology.activeLayer}]`);

  useEffect(() => {
    if(!!activeLayer){
      if(filterGroupEnabled && !filterGroupLegendColumn) {
        setState(draft => {
          const fullColumn = metadata.find(attr => attr.name === column)
          set(draft,`${pathBase}['filter-group-name']`, column)
          set(draft, `${pathBase}['filter-group-legend-column']`, column)
          set(draft, `${pathBase}['filter-group']`,[{display_name: fullColumn?.display_name || fullColumn.name, column_name: fullColumn.name}])
        })
      } else if (!filterGroupEnabled && !!activeLayer) {
        setState(draft => {
          set(draft,`${pathBase}['filter-group-name']`, '');
          set(draft, `${pathBase}['filter-group-legend-column']`, '');
          set(draft, `${pathBase}['filter-group']`,[]);
        })
      }
    }
  }, [filterGroupEnabled])

  useEffect(() => {
    if(!!activeLayer){
      if(viewGroupEnabled && !viewGroupId && !!activeLayer) {
        setState(draft => {
          const defaultView = views.find(v => v.view_id === viewId);
          const defaultGroupName = (defaultView?.version ?? defaultView?.view_id + " group");
          set(draft,`${pathBase}['filter-source-views']`, [viewId]);
          set(draft, `${pathBase}['view-group-name']`, defaultGroupName);
          set(draft, `${pathBase}['view-group-id']`, viewId);
        })
      } else if (!viewGroupEnabled && !!activeLayer) {
        setState(draft => {
          set(draft,`${pathBase}['filter-source-views']`, []);
          set(draft, `${pathBase}['view-group-name']`, '');
          set(draft, `${pathBase}['view-group-id']`, undefined);
  
          set(draft, `${pathBase}['view_id']`, initialViewId ?? viewId);
        })
      }
    }

  }, [viewGroupEnabled])

  useEffect(() => {
    if(baseDataColumn && layerType === 'categories') {
      const options = JSON.stringify({
        groupBy: [(baseDataColumn).split('AS ')[0]],
        exclude: {[(baseDataColumn).split('AS ')[0]]: ['null']},
        orderBy: {"2": 'desc'}
      })
      falcor.get([
        'dama',pgEnv,'viewsbyId', viewId, 'options', options, 'databyIndex',{ from: 0, to: 100},[baseDataColumn, 'count(1)::int as count']
      ])      
    }
  },[baseDataColumn, layerType, viewId])

  useEffect(() => {
    if(baseDataColumn && layerType === 'categories') {
      const options = JSON.stringify({
        groupBy: [(baseDataColumn).split('AS ')[0]],
        exclude: {[(baseDataColumn).split('AS ')[0]]: ['null']},
        orderBy: {"2": 'desc'}
      })
      let data = get(falcorCache, [
           'dama',pgEnv,'viewsbyId', viewId, 'options', options, 'databyIndex'
      ], {})
      setState(draft => {
        set(draft, `${pathBase}['category-data']`, data)
      })
    }

  }, [baseDataColumn, layerType, viewId, falcorCache])

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