import React, { useContext , useMemo, useEffect, Fragment }from 'react'
import {SymbologyContext} from '../../'
import { DamaContext } from "../../../store"
import { Menu, Transition, Switch } from '@headlessui/react'
// import get from 'lodash/get'
import isEqual from 'lodash/isEqual'
import { Close, CaretDown } from '../icons'
import { DndList } from '~/modules/avl-components/src'
import { rgb2hex, toHex, categoricalColors } from '../LayerManager/utils'
import { isValidCategoryPaint } from './datamaps'
import colorbrewer from '../LayerManager/colors'//"colorbrewer"
import { StyledControl } from './ControlWrappers'
import get from 'lodash/get'
import set from 'lodash/set'
function onlyUnique(value, index, array) {
  return array.indexOf(value) === index;
}

function ControlMenu({ button, children}) {
  const { state, setState  } = React.useContext(SymbologyContext);

  return (
      <Menu as="div" className="relative inline-block text-left w-full">
        <Menu.Button className='w-full'>
          {button}
        </Menu.Button>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className='absolute -right-[10px] w-[226px] max-h-[400px] overflow-auto py-2 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-20'>
            {children}
          </Menu.Items>
        </Transition>
      </Menu>
  )
}

export function SelectTypeControl({path, datapath, params={}}) {
  const { state, setState } = React.useContext(SymbologyContext);
  const { falcor, falcorCache, pgEnv } = React.useContext(DamaContext);
  // console.log('select control', params)
  let { value, viewId, sourceId, paintValue, categories} = useMemo(() => {
    return {
      value: get(state, `symbology.layers[${state.symbology.activeLayer}].${path}`, {}),
      viewId: get(state,`symbology.layers[${state.symbology.activeLayer}].view_id`),
      sourceId: get(state,`symbology.layers[${state.symbology.activeLayer}].source_id`),
      paintValue : get(state, `symbology.layers[${state.symbology.activeLayer}].${datapath}`, {}),
      column: get(state, `symbology.layers[${state.symbology.activeLayer}]['data-column']`, ''),
      categories: get(state, `symbology.layers[${state.symbology.activeLayer}]['categories']`, {}),
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

  const options = useMemo(() => {
    //console.log('metadata',metadata)
    const hasCols = metadata?.length > 0 
    const hasNumber = metadata?.reduce((out,curr) => {
      if(['integer', 'number'].includes(curr.type)){
        out = true
      }
      return out
    },false)

    return  [
      {name:'Simple', value: 'simple'},
      hasCols ? {name:'Categories', value: 'categories'} : null,
      hasNumber ? {name:'Color Range', value: 'choropleth'} : null
    ].filter(d => d)
  },[metadata])

  React.useEffect(() => {
    if( value === 'categories') {
      const { paint, legend } = categories;
      if(isValidCategoryPaint(paint) && !isEqual(paint, paintValue)) {
        setState(draft => {
          set(draft, `symbology.layers[${state.symbology.activeLayer}].${datapath}`, paint)
          set(draft, `symbology.layers[${state.symbology.activeLayer}]['legend-data']`, legend)
          set(draft, `symbology.layers[${state.symbology.activeLayer}]['num-categories']`, legend.length)
        })
      }
    } else if(value === 'choropleth') {
      const { paint, legend } = categories;
      if(paint && !isEqual(paint,paintValue)) {
        setState(draft => {
          set(draft, `symbology.layers[${state.symbology.activeLayer}].${datapath}`, paint)
          set(draft, `symbology.layers[${state.symbology.activeLayer}]['legend-data']`, legend)
        })
      }
    } else if( value === 'simple' && typeof paintValue !== 'string') {
      // console.log('switch to simple')
      setState(draft => {
        set(draft, `symbology.layers[${state.symbology.activeLayer}].${datapath}`, rgb2hex(null))
      })
    } 
  }, [value, categories])

  return (
    <label className='flex w-full'>
      <div className='flex w-full items-center'>
        <select
          className='w-full p-2 bg-transparent'
          value={get(state, `symbology.layers[${state.symbology.activeLayer}].${path}`, params.default || params?.options?.[0]?.value )}
          onChange={(e) => setState(draft => {
            set(draft, `symbology.layers[${state.symbology.activeLayer}].${path}`, e.target.value);
          })}
        >
          {(options || []).map((opt,i) => {
            return (
              <option key={i} value={opt.value}>{opt.name}</option>
            )
          })}
        </select>
      </div>
    </label>
  )
} 

function ColorControl({path,params={}}) {
  const { state, setState } = React.useContext(SymbologyContext);
  return (
    <label className='flex'>
      <div className='flex items-center'>
        <input
          type='color' 
          value={toHex(get(state, `symbology.layers[${state.symbology.activeLayer}].${path}`, '#ccc'))}
          onChange={(e) => setState(draft => {
            set(draft, `symbology.layers[${state.symbology.activeLayer}].${path}`, e.target.value)
          })}
        />
      </div>
      <div className='flex items-center p-2'>Custom </div>
    </label>
  )
}

function RangeControl({path,params={}}) {
  const { state, setState } = React.useContext(SymbologyContext);
  const identity = (d) => d
  const f = params?.format || identity  
  
  return (
    <div className='flex w-full  items-center'>
      <div className='flex-1 flex w-full'>
        <input
          className='w-full flex-1 accent-slate-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700">'
          type='range'
          min={params.min || "0"}
          max={params.max || "1"}
          step={params.step || "0.01"}
          value={get(state, `symbology.layers[${state.symbology.activeLayer}].${path}`, params.default || "1")}
          onChange={(e) => setState(draft => {
            set(draft, `symbology.layers[${state.symbology.activeLayer}].${path}`, +e.target.value)
          })}
        />
      </div>
      <div className='pl-2'>
        <input 
          className='w-14 px-2 py-1 bg-transparent'
          value={`${f(get(state, `symbology.layers[${state.symbology.activeLayer}].${path}`, params.default || "1"))}${params.units ? params.units : ''}`} 
          onChange={() => {}}
        />
      </div>
    </div>
  )
}

function SimpleControl({path, params={}}) {
  const { state, setState } = React.useContext(SymbologyContext);
  return (
    <label className='flex'>
      <div className='flex items-center'>
        <input
          className='w-full'
          type='text' 
          value={get(state, `symbology.layers[${state.symbology.activeLayer}].${path}`, params?.default ?? '#ccc')}
          onChange={(e) => setState(draft => {
            set(draft, `symbology.layers[${state.symbology.activeLayer}].${path}`, e.target.value)
          })}
        />
      </div>
    </label>
  )
}

export function SelectControl({path, params={}}) {
  //console.log("select control path::", path)
  const { state, setState } = React.useContext(SymbologyContext);
  //console.log('select control', params)
  return (
    <label className='flex w-full'>
      <div className='flex w-full items-center'>
        <select
          className='w-full py-2 bg-transparent'
          value={get(state, `symbology.layers[${state.symbology.activeLayer}].${path}`, params.default || params?.options?.[0]?.value )}
          onChange={(e) => setState(draft => {
            set(draft, `symbology.layers[${state.symbology.activeLayer}].${path}`, e.target.value)
          })}
        >
          {(params?.options || []).map((opt,i) => {
            return (
              <option key={i} value={opt.value}>{opt.name}</option>
            )
          })}
        </select>
      </div>
    </label>
  )
}

function SelectViewColumnControl({path, datapath, params={}}) {
  const { state, setState } = React.useContext(SymbologyContext);
  const { falcor, falcorCache, pgEnv } = React.useContext(DamaContext);

  const { layerType, viewId, sourceId, colors, showOther, numbins, method, colorrange, numCategories, column, symbology_id: symbologyId } = useMemo(() => ({
    layerType: get(state,`symbology.layers[${state.symbology.activeLayer}]['layer-type']`),
    symbology_id: get(state,`symbology_id`),
    viewId: get(state,`symbology.layers[${state.symbology.activeLayer}].view_id`),
    sourceId: get(state,`symbology.layers[${state.symbology.activeLayer}].source_id`),
    colors: get(state, `symbology.layers[${state.symbology.activeLayer}]['color-set']`, categoricalColors['cat1']),
    numCategories: get(state, `symbology.layers[${state.symbology.activeLayer}]['num-categories']`, 10),
    showOther: get(state, `symbology.layers[${state.symbology.activeLayer}]['category-show-other']`, '#ccc'),
    numbins: get(state, `symbology.layers[${state.symbology.activeLayer}]['num-bins']`, 9),
    method: get(state, `symbology.layers[${state.symbology.activeLayer}]['bin-method']`, 'ckmeans'),
    colorrange: get(state, `symbology.layers[${state.symbology.activeLayer}]['color-range']`, colorbrewer['seq1'][9]),
    categories: get(state, `symbology.layers[${state.symbology.activeLayer}]['categories']`, {}),
    column: get(state, `symbology.layers[${state.symbology.activeLayer}].${path}`, null )
  }),[state])

  useEffect(() => {
    if(sourceId) {
      falcor.get([
          "dama", pgEnv, "sources", "byId", sourceId, "attributes", "metadata"
      ]);
    }
  },[sourceId])

  const metadata = useMemo(() => {
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

  //console.log('metadata', metadata)

  //This is used JUST for maxCategoryLength
  //we fetch the data ahead of time so that the user doesn't have to wait when the "add column" menu
  useEffect(() => {
    const requestData = async () => {
      const options = JSON.stringify({
        exclude: {[column]: ['null']},
      })
      const lenRes = await falcor.get([
        'dama',pgEnv,'viewsbyId', viewId, 'options', options, 'length'
      ]) 
      let len = get(lenRes, [
        'json', 'dama',pgEnv,'viewsbyId', viewId, 'options', options, 'length'
      ], 0)

      if(len > 0){
        falcor.get([
          'dama',pgEnv,'viewsbyId', viewId, 'options', options, 'databyIndex', {from: 0, to: len-1}, column
        ])
      }
    }
    if(column && layerType === 'categories') {
      requestData();
    }
  }, [column, layerType]);

  const paintOptions = useMemo(() => {
    if(layerType === "choropleth"){
      return JSON.stringify({
        layerType,
        column,
        view_id: viewId,
        numbins,
        method,
        colorrange
      });
    }
    else {
      return JSON.stringify({
        layerType,
        column,
        view_id: viewId,
        colors,
        numCategories,
        showOther: showOther ? '#ccc' : 'rgba(0,0,0,0)',
        metadata,
      });
    }
  }, [state]);

  useEffect(() => {
    const getSymbologyPaint = async () => {
      console.log("getting new paint for symbology::",symbologyId)
      falcor.get([
        'dama', pgEnv, 'symbologies', 'byId', symbologyId, 'paint', 'options', paintOptions
      ]);
    }

    if(column){
      getSymbologyPaint()
    }
  // we intentionally do not update when `numCategories` changes
  // if we do, it will overwrite any inserted/removed/re-labelled elements
  // since all that is done on client-side only
  },[
    layerType,
    column,
    viewId,
    colors,
    numbins,
    showOther,
    method,
    metadata,
    colorrange
  ]);

  const newCatPaint = useMemo(() => {
    return get(falcorCache, [
      'dama', pgEnv, 'symbologies', 'byId', symbologyId, 'paint', 'options', paintOptions, 'value'
    ], {});
  }, [falcorCache]);

  useEffect(() => {
    setState((draft) => {
      set(
        draft,
        `symbology.layers[${state.symbology.activeLayer}].categories`,
        newCatPaint
      );
    });
  }, [newCatPaint]);

  return (
    <label className='flex w-full'>
      <div className='flex w-full items-center'>
        <select
          className='w-full p-2 bg-transparent'
          value={column}
          onChange={(e) => setState(draft => {
            
            let sourceTiles = get(state, `symbology.layers[${state.symbology.activeLayer}].sources[0].source.tiles[0]`, 'no source tiles').split('?')[0]
            // console.log('SelectViewColumnControl set column path', path, e.target.value, sourceTiles)
            
            if(sourceTiles !== 'no source tiles') {
            // console.log('set source tiles', sourceTiles+`?cols=${e.target.value}`)
              set(draft, `symbology.layers[${state.symbology.activeLayer}].sources[0].source.tiles[0]`, sourceTiles+`?cols=${e.target.value}`)
            }

            set(draft, `symbology.layers[${state.symbology.activeLayer}].categories`, {})
            set(draft, `symbology.layers[${state.symbology.activeLayer}].${path}`, e.target.value)

          })}
        >
          {(metadata || [])
            .filter(d => {
              if(layerType === 'choropleth' && !['integer', 'number'].includes(d.type)){
                return false
              }
              return true
            })
            .filter(d => !['wkb_geometry'].includes(d.name))
            .map((col,i) => {
            return (
              <option key={i} value={col.name}>{col.display_name || col.name}</option>
            )
          })}
        </select>
      </div>
    </label>
  )
}

function ColorRangeControl({path, params={}}) {
  const { state, setState } = React.useContext(SymbologyContext);
  const rangeColorKey = get(state, `symbology.layers[${state.symbology.activeLayer}]['range-key']`,colorbrewer.schemeGroups.sequential[0])
  const numbins = get(state, `symbology.layers[${state.symbology.activeLayer}]['num-bins']`, 9)
  const value = get(state, `symbology.layers[${state.symbology.activeLayer}].${path}`, colorbrewer[rangeColorKey][numbins])
  
  return (
      <div className='flex w-full items-center'>
        <ControlMenu 
          button={<div className='flex items-center w-full cursor-pointer flex-1'>
            <div className='flex-1 flex justify-center '>
              {(value.map ? value : []).map((d,i) => <div key={i} className='flex-1 h-4' style={{backgroundColor: d}} />)}
            </div>
            <div className='flex items-center px-1 border-2 border-transparent h-8  hover fill-slate-400 hover:fill-slate-800 cursor-pointer'> 
              <CaretDown  className=''/> 
            </div>
          </div>
          }
        >
          <Menu.Item className='z-20'>
            <div className='px-4 font-semibold text-sm text-slate-600'>SEQUENTIAL</div>
          </Menu.Item>
          {[
            ...colorbrewer.schemeGroups.sequential,
            ...colorbrewer.schemeGroups.singlehue
            ].map(colorKey => {
            //console.log('color', colorKey)
            return (
              <Menu.Item className='z-20' key={colorKey}>
                {({ active }) => (
                  <div className={`${active ? 'bg-blue-50 ' : ''} flex`} >
                    <div className='w-4 h-4' />
                    <div
                      className = {`flex-1 flex w-full p-2`}
                      onClick={() => setState(draft => {
                        set(draft, `symbology.layers[${state.symbology.activeLayer}].${path}`, colorbrewer[colorKey][numbins])
                        set(draft, `symbology.layers[${state.symbology.activeLayer}]['range-key']`, colorKey)
                      })}
                    >
                      {colorbrewer[colorKey][numbins].map((d,i) => <div key={i} className='flex-1 h-4' style={{backgroundColor: d}} />)}
                    </div>
                  </div>
                )}
              </Menu.Item>
            )
          })}
          <Menu.Item className='z-20'>
            <div className='px-4 font-semibold text-sm text-slate-600'>Diverging</div>
          </Menu.Item>
          {colorbrewer.schemeGroups.diverging.map(colorKey => {
            return (
              <Menu.Item className='z-20' key={colorKey}>
                {({ active }) => (
                  <div className={`${active ? 'bg-blue-50 ' : ''} flex`} >
                    <div className='w-4 h-4' />
                    <div
                      className = {`flex-1 flex w-full p-2`}
                      onClick={() => setState(draft => {
                        set(draft, `symbology.layers[${state.symbology.activeLayer}].${path}`, colorbrewer[colorKey][numbins])
                        set(draft, `symbology.layers[${state.symbology.activeLayer}]['range-key']`, colorKey)
                      })}
                    >
                      {colorbrewer[colorKey][numbins].map((d,i) => <div key={i} className='flex-1 h-4' style={{backgroundColor: d}} />)}
                    </div>
                  </div>
                )}
              </Menu.Item>
            )
          })}
        </ControlMenu>
      </div>
    )
}

function CategoricalColorControl({path, params={}}) {
  const { state, setState } = React.useContext(SymbologyContext);
  // console.log('select control', params)
  let colors = categoricalColors
  let value = get(state, `symbology.layers[${state.symbology.activeLayer}].${path}`, colors['cat1'])

  // console.log('value', value, path)
  return (
      <div className='flex w-full items-center'>
        <ControlMenu 
          button={<div className='flex items-center w-full cursor-pointer flex-1'>
            <div className='flex-1 flex justify-center '>
              {(value.map ? value : []).map((d,i) => <div key={i} className='w-4 h-4' style={{backgroundColor: d}} />)}
            </div>
            <div className='flex items-center px-1 border-2 border-transparent h-8  hover fill-slate-400 hover:fill-slate-800 cursor-pointer'> 
              <CaretDown  className=''/> 
            </div>
          </div>
          }
        >
          {Object.keys(colors).map(colorKey => {
            return (
              <Menu.Item className='z-20' key={colorKey}>
                {({ active }) => (
                  <div className={`${active ? 'bg-blue-50 ' : ''} flex`} >
                    <div className='w-4 h-4' />
                    <div
                      className = {`flex-1 flex w-full p-2`}
                      onClick={() => setState(draft => {
                        set(draft, `symbology.layers[${state.symbology.activeLayer}].${path}`, colors[colorKey])
                      })}
                    >
                      {colors[colorKey].map((d,i) => <div key={i} className='w-4 h-4' style={{backgroundColor: d}} />)}
                    </div>
                  </div>
                )}
              </Menu.Item>
            )
          })}
        </ControlMenu>
      </div>
    )
}

function CategoryControl({path, params={}}) {
  const { state, setState } = React.useContext(SymbologyContext);
  const { falcor, falcorCache, pgEnv } = React.useContext(DamaContext);
  
  let { column, colors, sourceId, viewId, categories, layerType, showOther, symbology_id: symbologyId  } = useMemo(() => {
    return {
      layerType: get(state,`symbology.layers[${state.symbology.activeLayer}]['layer-type']`),
      sourceId: get(state,`symbology.layers[${state.symbology.activeLayer}].source_id`),
      viewId: get(state,`symbology.layers[${state.symbology.activeLayer}].view_id`),
      categories: get(state,`symbology.layers[${state.symbology.activeLayer}].categories`),
      symbology_id: get(state,`symbology_id`),
      column: get(state, `symbology.layers[${state.symbology.activeLayer}]['data-column']`, ''),
      colors: get(state, `symbology.layers[${state.symbology.activeLayer}]['color-set']`, categoricalColors['cat1']),
      showOther: get(state, `symbology.layers[${state.symbology.activeLayer}]['category-show-other']`,'#ccc') === '#ccc'
    }
  }, [state]);

  useEffect(() => {
    const requestData = async () => {
      const options = JSON.stringify({
        exclude: {[column]: ['null']},
      })
      const lenRes = await falcor.get([
        'dama', pgEnv,'viewsbyId', viewId, 'options', options, 'length'
      ]) 
      let len = get(lenRes, [
        'json', 'dama', pgEnv,'viewsbyId', viewId, 'options', options, 'length'
      ], 0)

      if(len > 0){
        falcor.get([
          'dama', pgEnv, 'viewsbyId', viewId, 'options', options, 'databyIndex', { from: 0, to: len-1 }, column
        ])
      }
    }
    if(column && layerType === 'categories') {
      requestData();
    }
  }, [column, layerType]);


  const metadata = useMemo(() => {
    let out = get(falcorCache, [
          "dama", pgEnv, "sources", "byId", sourceId, "attributes", "metadata", "value", "columns"
      ], [])
    if(out.length === 0) {
        out = get(falcorCache, [
          "dama", pgEnv, "sources", "byId", sourceId, "attributes", "metadata", "value"
        ], [])
      }
    return out
  }, [sourceId, falcorCache])

  const categoryData = useMemo(() => {
    const options = JSON.stringify({
      exclude: {[column]: ['null']},
    })
    return get(falcorCache, [
      'dama', pgEnv, 'viewsbyId', viewId, 'options', options, 'databyIndex'
    ])
  }, [falcorCache]);

  const paintOptions = useMemo(() => {
    return {
      layerType,
      column,
      view_id: viewId,
      colors,
      showOther: showOther ? '#ccc' : 'rgba(0,0,0,0)',
      metadata,
    };
  }, [state]);

  const getNewPaint = async (paintOptions) => {   
    falcor.get([
      'dama', pgEnv, 'symbologies', 'byId', symbologyId, 'paint', 'options', paintOptions
    ]);
  }
  const [activeCatIndex, setActiveCatIndex] = React.useState();
  useEffect(() => {
    if(sourceId) {
      falcor.get([
          "dama", pgEnv, "sources", "byId", sourceId, "attributes", "metadata"
      ]);
    }
  },[sourceId])

  const metadataLookup = useMemo(() => {
    //console.log('getmetadata', falcorCache)
      let out = get(falcorCache, [
          "dama", pgEnv, "sources", "byId", sourceId, "attributes", "metadata", "value", "columns"
      ], [])
      if(out.length === 0) {
        out = get(falcorCache, [
          "dama", pgEnv, "sources", "byId", sourceId, "attributes", "metadata", "value"
        ], [])
      }
      return JSON.parse((out.filter(d => d.name === column)?.[0] || {})?.meta_lookup || "{}")
      

  }, [sourceId,falcorCache])

  //Number of total non-null distinct values
  const maxCategoryLength = useMemo(() => {
    return Object.values(categoryData)
      .reduce((out,cat) => {
        if(typeof cat[column] !== 'object') {
          out++
        }
        return out
      },0)
   }, [categoryData]);

  const mapPaint = categories?.paint?? [];
  const currentCategories = categories?.legend ?? [];
  const availableCategories = getDiffColumns(
    Object.values(categoryData)
      .filter((cat) => typeof cat[column] !== "object")
      .map((catData) => catData[column])
      .filter(onlyUnique),
    currentCategories.map((cat) => cat.label)
  ).map((cat) => ({ label: cat, value: cat }));

  return (
   
      <div className=' w-full items-center'>
        {
          activeCatIndex !== undefined  && 
          <>
            <label className='flex'>
              <div className='flex items-center'>
                <input
                  type='color' 
                  value={toHex(get(state, `symbology.layers[${state.symbology.activeLayer}].categories.legend[${activeCatIndex}].color`, colors[(activeCatIndex % colors.length)]))}
                  onChange={(e) => {
                    setState(draft => {
                      const draftCats = get(state,`symbology.layers[${state.symbology.activeLayer}].categories`, {});
                      const updatedCategoryPaint = [...draftCats.paint];
                  
                      const indexOfLabel = mapPaint.indexOf(currentCategories[activeCatIndex].label);
                      updatedCategoryPaint.splice(indexOfLabel+1, 1, e.target.value);


                      set(draft, `symbology.layers[${state.symbology.activeLayer}].categories`,{
                        paint: updatedCategoryPaint, legend: draftCats.legend.map((d, i) => {
                          const newLegendRow = {color: d.color, label: get(metadataLookup, d.label, d.label )}
                          if(i === activeCatIndex){
                            newLegendRow.color = e.target.value;
                          }

                          return newLegendRow;
                        })
                      });
                    })
                  }}
                />
              </div>
              <div className='flex items-center p-2'>Custom color for {currentCategories[activeCatIndex].label} </div>
            </label>
          </>
        }
        <div className='flex items-center'>
          <div className='text-sm text-slate-400 px-2'>Showing</div>
          <div className='border border-transparent hover:border-slate-200 m-1 rounded '>
            <select
              className='w-full p-2 bg-transparent text-slate-700 text-sm'
              value={currentCategories.length}
              onChange={(e) => {
                getNewPaint(JSON.stringify({...paintOptions, numCategories: e.target.value}))
              }}
            >
              <option key={'def'} value={currentCategories.length}>{currentCategories.length} Categories</option>
              {([10,20,30,50,100] || [])
                .filter(d => d < maxCategoryLength && d !== currentCategories.length)
                .map((val,i) => {
                return (
                  <option key={i} value={val}>{val} Categories</option>
                )
              })}
            </select>
          </div>
        </div>
        <div className='flex items-center'>
          <div className='text-sm text-slate-400 px-2'>Show Other</div>
          <div className='flex items-center'>
            <Switch
              checked={showOther}
              onChange={()=>{
                setState(draft=> {
                  const update = get(state, `symbology.layers[${state.symbology.activeLayer}]['category-show-other']`,'#ccc') === '#ccc' ? 'rgba(0,0,0,0)' : '#ccc'
                  // console.log('update', update  )
                  set(draft, `symbology.layers[${state.symbology.activeLayer}]['category-show-other']`,update)
                  
                })
              }}
              className={`${
                showOther ? 'bg-blue-500' : 'bg-gray-200'
              } relative inline-flex h-4 w-8 items-center rounded-full `}
            >
              <span className="sr-only">Show other</span>
              <div
                className={`${
                  showOther ? 'translate-x-5' : 'translate-x-0'
                } inline-block h-4 w-4  transform rounded-full bg-white transition border-[0.5] border-slate-600`}
              />
            </Switch>

          </div>

        </div>
        <div className='w-full max-h-[250px] overflow-auto'>
          {currentCategories.map((d,i) => (
            <div key={i} className='group/title w-full flex items-center hover:bg-slate-100'>
              <div 
                className='flex items-center h-8 w-8 justify-center  border-r border-b ' 
                onClick={() => {
                  if (activeCatIndex !== i) {
                    setActiveCatIndex(i);
                  } else {
                    setActiveCatIndex(undefined);
                  }
                }}
              >
                <div className='w-4 h-4 rounded border-[0.5px] border-slate-600' style={{backgroundColor:d.color}}/>
              </div>
              <div className='flex items-center text-center flex-1 px-4 text-slate-600 border-b h-8 truncate'>{d.label}</div>
              <div
                className="group/icon border-b w-8 h-8 flex items-center border-slate-200 cursor-pointer fill-white group-hover/title:fill-slate-300 hover:bg-slate-200"
                onClick={() => {
                  const updatedCategoryPaint = [...mapPaint];
                  const updatedCategoryLegend = currentCategories.filter(cat => cat.label !== d.label);
                  //console.log('test123', updatedCategoryLegend)

                  const indexOfLabel = updatedCategoryPaint.indexOf(d.label);

                  //In filter array, the `label` preceeds its paint `value`
                  updatedCategoryPaint.splice(indexOfLabel, 2);
                  setState(draft=> {
                    set(draft, `symbology.layers[${state.symbology.activeLayer}].categories`,{
                      paint: updatedCategoryPaint, legend: updatedCategoryLegend.map(d => {
                        return {color: d.color, label: get(metadataLookup, d.label, d.label )}
                      })
                    });
                    set(draft, `symbology.layers[${state.symbology.activeLayer}].num-categories`,updatedCategoryLegend.length);
                  });
                }}
              >
                <Close
                  className="mx-[6px] cursor-pointer group-hover/icon:fill-slate-500 "
                />
              </div>
            </div> 
          ))}
          {showOther && <div className='w-full flex items-center hover:bg-slate-100'>
              <div className='flex items-center h-8 w-8 justify-center  border-r border-b '>
                <div className='w-4 h-4 rounded border-[0.5px] border-slate-600' style={{backgroundColor:get(state, `symbology.layers[${state.symbology.activeLayer}]['category-show-other']`,'#ccc') }}/>
              </div>
              <div className='flex items-center text-center flex-1 px-4 text-slate-600 border-b h-8 truncate'>Other</div>
            </div>
          }
          <>
            <div className='text-slate-500 text-[14px] tracking-wide min-h-[32px] flex items-center mx-4'>
                Add Column
            </div>
            <div className="flex-1 flex items-center mx-4 pb-4">
              <StyledControl>
                <label className='flex w-full'>
                  <div className='flex w-full items-center'>
                    <select
                      className='w-full py-2 bg-transparent'
                      value={''}
                      onChange={(e) =>
                        {
                          const updatedCategoryPaint = [...mapPaint];
                          const updatedCategoryLegend = [...currentCategories];

                          const lastColorUsed = updatedCategoryPaint[updatedCategoryPaint.length-2];
                          const lastColorIndex = colors.map(color => rgb2hex(color)).indexOf(lastColorUsed);
                          const nextColor = lastColorIndex < colors.length-1 ? colors[lastColorIndex+1] : colors[0];

                          updatedCategoryLegend.push({ color: nextColor, label: e.target.value })
                          updatedCategoryPaint.splice(mapPaint.length-1, 0, e.target.value, rgb2hex(nextColor));
                          
                          setState(draft=> {
                            set(draft, `symbology.layers[${state.symbology.activeLayer}].categories`,{
                              paint: updatedCategoryPaint, legend: updatedCategoryLegend.map(d => {
                                return {color: d.color, label: get(metadataLookup, d.label, d.label )}
                              })
                            });
                          });
                        }
                      }
                    >
                      <option key={-1} value={""}></option>
                      {(availableCategories || []).map((opt, i) => (
                        <option key={i} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>
              </StyledControl>
            </div>
          </>
        </div>
      </div>
    )
}

function ChoroplethControl({path, params={}}) {
  const { state, setState } = React.useContext(SymbologyContext);
  let { numbins, method, colorKey, categories, showOther } = useMemo(() => {
    return {
      categories: get(state, `symbology.layers[${state.symbology.activeLayer}]['categories']`, {}),
      numbins: get(state, `symbology.layers[${state.symbology.activeLayer}]['num-bins']`, 9),
      colorKey: get(state, `symbology.layers[${state.symbology.activeLayer}]['range-key']`, 'seq1'),
      method: get(state, `symbology.layers[${state.symbology.activeLayer}]['bin-method']`, 'ckmeans'),
      showOther: get(state, `symbology.layers[${state.symbology.activeLayer}]['category-show-other']`,'#ccc') === '#ccc'
    };
  }, [state])

  const { legend } = categories;

  return (
      <div className=' w-full items-center'>
        <div className='flex items-center'>
          <div className='text-sm text-slate-400 px-2'>Showing</div>
          <div className='border border-transparent hover:border-slate-200 m-1 rounded '>
            <select
              className='w-full p-2 bg-transparent text-slate-700 text-sm'
              value={numbins}
              onChange={(e) => setState(draft => {
                set(draft, `symbology.layers[${state.symbology.activeLayer}].['num-bins']`, e.target.value)
                set(draft, `symbology.layers[${state.symbology.activeLayer}].['color-range']`, colorbrewer[colorKey][e.target.value])
              })}
            >
              {(Object.keys(colorbrewer[colorKey]) || [])
                .map((val,i) => {
                  return (
                    <option key={i} value={val}>{val}</option>
                  )
              })}
            </select>
          </div>
        </div>
        <div className='flex items-center'>
          <div className='text-sm text-slate-400 px-2'>Method</div>
          <div className='border border-transparent hover:border-slate-200 m-1 rounded '>
            <select
              className='w-full p-2 bg-transparent text-slate-700 text-sm'
              value={method}
              onChange={(e) => setState(draft => {
                set(draft, `symbology.layers[${state.symbology.activeLayer}]['bin-method']`, e.target.value)
              })}
            >
              <option  value={'ckmeans'}>ck-means</option>
              <option  value={'jenks'}>Jenks</option>
              <option  value={'pretty'}>Pretty Breaks</option>
              <option  value={'equalInterval'}>Equal Interval</option>
             
            </select>
          </div>
        </div>
        <div className='flex items-center'>
          <div className='text-sm text-slate-400 px-2'>Show Other</div>
          <div className='flex items-center'>
            <Switch
              checked={showOther}
              onChange={()=>{
                setState(draft=> {
                  const update = get(state, `symbology.layers[${state.symbology.activeLayer}]['category-show-other']`,'#ccc') === '#ccc' ? 'rgba(0,0,0,0)' : '#ccc'
                  set(draft, `symbology.layers[${state.symbology.activeLayer}]['category-show-other']`,update)
                })
              }}
              className={`${
                showOther ? 'bg-blue-500' : 'bg-gray-200'
              } relative inline-flex h-4 w-8 items-center rounded-full `}
            >
              <span className="sr-only">Show other</span>
              <div
                className={`${
                  showOther ? 'translate-x-5' : 'translate-x-0'
                } inline-block h-4 w-4  transform rounded-full bg-white transition border-[0.5] border-slate-600`}
              />
            </Switch>

          </div>

        </div>
        <div className='w-full max-h-[250px] overflow-auto'>
        {legend.map((d,i) => (
          <div key={i} className='w-full flex items-center hover:bg-slate-100'>
            <div className='flex items-center h-8 w-8 justify-center  border-r border-b '>
              <div className='w-4 h-4 rounded border-[0.5px] border-slate-600' style={{backgroundColor:d.color}}/>
            </div>
            <div className='flex items-center text-center flex-1 px-4 text-slate-600 border-b h-8 truncate'>{d.label}</div>
          </div> 
        ))}
        
        </div>
      </div>
    )
}

const getDiffColumns = (baseArray, subArray) => {
  return baseArray.filter(baseItem => !subArray?.includes(baseItem))
}

export const AddColumnSelectControl = ({setState, availableColumnNames}) => {
  return (
    <>
      <div className='w-full text-slate-500 text-[14px] tracking-wide min-h-[32px] flex items-center mx-4'>
          Add Column
      </div>
      <div className="flex-1 flex items-center mx-4">
        <StyledControl>
        <label className='flex w-full'>
            <div className='flex w-full items-center'>
              <select
                className='w-full py-2 bg-transparent'
                value={''}
                onChange={(e) =>
                  setState(e.target.value)
                }
              >
                <option key={-1} value={""}></option>
                {(availableColumnNames || []).map((opt, i) => (
                  <option key={i} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </label>
        </StyledControl>
      </div>
    </>
  )
}

export const controlTypes = {
  'color': ColorControl,
  'categoricalColor': CategoricalColorControl,
  'rangeColor': ColorRangeControl,
  'categoryControl': CategoryControl,
  'choroplethControl':ChoroplethControl, 
  'range': RangeControl,
  'simple': SimpleControl,
  'select': SelectControl,
  'selectType': SelectTypeControl,
  'selectViewColumn': SelectViewColumnControl
}
