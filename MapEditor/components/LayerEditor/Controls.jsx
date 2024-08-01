import React, { useContext , useMemo, useEffect, Fragment }from 'react'
import {SymbologyContext} from '../../'
import { DamaContext } from "../../../store"
import { Menu, Transition, Switch } from '@headlessui/react'
// import get from 'lodash/get'
import isEqual from 'lodash/isEqual'
import { Close, CaretDown } from '../icons'
import { DndList } from '~/modules/avl-components/src'
import { rgb2hex, toHex, categoricalColors, rangeColors } from '../LayerManager/utils'
import {categoryPaint, isValidCategoryPaint ,choroplethPaint} from './datamaps'
import colorbrewer from '../LayerManager/colors'//"colorbrewer"
import { StyledControl } from './ControlWrappers'
import get from 'lodash/get'
import set from 'lodash/set'
import cloneDeep from 'lodash/cloneDeep'
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
  let { value, viewId, sourceId,paintValue, column, categories, categorydata, colors, colorrange, numCategories, numbins, method, showOther, symbology_id, choroplethdata } = useMemo(() => {
    return {
      value: get(state, `symbology.layers[${state.symbology.activeLayer}].${path}`, {}),
      viewId: get(state,`symbology.layers[${state.symbology.activeLayer}].view_id`),
      sourceId: get(state,`symbology.layers[${state.symbology.activeLayer}].source_id`),
      paintValue : get(state, `symbology.layers[${state.symbology.activeLayer}].${datapath}`, {}),
      column: get(state, `symbology.layers[${state.symbology.activeLayer}]['data-column']`, ''),
      categories: get(state, `symbology.layers[${state.symbology.activeLayer}]['categories']`, {}),
      categorydata: get(state, `symbology.layers[${state.symbology.activeLayer}]['category-data']`, {}),
      choroplethdata: get(state, `symbology.layers[${state.symbology.activeLayer}]['choroplethdata']`),
      colors: get(state, `symbology.layers[${state.symbology.activeLayer}]['color-set']`, categoricalColors['cat1']),
      colorrange: get(state, `symbology.layers[${state.symbology.activeLayer}]['color-range']`, colorbrewer['seq1'][9]),
      numbins: get(state, `symbology.layers[${state.symbology.activeLayer}]['num-bins']`, 9),
      method: get(state, `symbology.layers[${state.symbology.activeLayer}]['bin-method']`, 'ckmeans'),
      numCategories: get(state, `symbology.layers[${state.symbology.activeLayer}]['num-categories']`, 10),
      showOther: get(state, `symbology.layers[${state.symbology.activeLayer}]['category-show-other']`, '#ccc'),
      symbology_id: get(state, `symbology_id`),
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
    const setPaint = async () => {
      if (value === 'categories') {
        let { paint, legend } = categories?.paint && categories?.legend
          ? cloneDeep(categories)
          : categoryPaint(
            column,
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
        if(isShowOtherEnabled) {
          if(legend[legend.length-1].label !== "Other") {
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
            set(draft, `symbology.layers[${state.symbology.activeLayer}]['categories']`, { paint, legend })
            set(draft, `symbology.layers[${state.symbology.activeLayer}].${datapath}`, paint)
            set(draft, `symbology.layers[${state.symbology.activeLayer}]['legend-data']`, legend)
          })
        }
      } else if(value === 'choropleth') {
        const domainOptions = {
          column,
          viewId,
          numbins,
          method
        }

        let colorBreaks; 

        if(choroplethdata && Object.keys(choroplethdata).length === 2 ) {
          colorBreaks = choroplethdata;
        }
        else {
          setState(draft => {
            set(draft, `symbology.layers[${state.symbology.activeLayer}]['is-loading-colorbreaks']`, true)
          })
          const res = await falcor.get([
            "dama", pgEnv, "symbologies", "byId", [symbology_id], "colorDomain", "options", JSON.stringify(domainOptions)
          ]);
          colorBreaks = get(res, [
            "json","dama", pgEnv, "symbologies", "byId", [symbology_id], "colorDomain", "options", JSON.stringify(domainOptions)
          ])
          setState(draft => {
            set(draft, `symbology.layers[${state.symbology.activeLayer}]['is-loading-colorbreaks']`, false)
          })
        }
        let { paint, legend } = choroplethPaint(column, colorBreaks['max'], colorrange, numbins, method, colorBreaks['breaks'], showOther);
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
        if(paint && !isEqual(paint, paintValue)) {
          setState(draft => {
            set(draft, `symbology.layers[${state.symbology.activeLayer}].${datapath}`, paint)
            set(draft, `symbology.layers[${state.symbology.activeLayer}]['legend-data']`, legend)
            set(draft, `symbology.layers[${state.symbology.activeLayer}]['choroplethdata']`, colorBreaks)
          })
        }
      } else if( value === 'simple' && typeof paintValue !== 'string') {
        // console.log('switch to simple')
        setState(draft => {
          set(draft, `symbology.layers[${state.symbology.activeLayer}].${datapath}`, rgb2hex(null))
        })
      }
    }
    setPaint();
  }, [value, column, categorydata, colors, numCategories, showOther, colorrange, numbins, method, choroplethdata])

  return (
    <label className='flex w-full'>
      <div className='flex w-full items-center'>
        <select
          className='w-full p-2 bg-transparent'
          value={get(state, `symbology.layers[${state.symbology.activeLayer}].${path}`, params.default || params?.options?.[0]?.value )}
          onChange={(e) => setState(draft => {
            if(!column && e.target.value === 'categories') {
              const defaultColorColumn = metadata.filter(col => !['integer', 'number'].includes(col.type))[0]?.name ?? metadata[0]?.name;
              set(draft, `symbology.layers[${state.symbology.activeLayer}]['data-column']`, defaultColorColumn)
            } else if (e.target.value === 'choropleth') {
              const currentColumn = metadata.find(col => col.name === column);
              if(!['integer', 'number'].includes(currentColumn?.type)) {
                const defaultColorColumn = metadata.filter(col => ['integer', 'number'].includes(col.type))[0]?.name ?? metadata[0]?.name;
                set(draft, `symbology.layers[${state.symbology.activeLayer}]['data-column']`, defaultColorColumn)
              }
            }
            set(draft, `symbology.layers[${state.symbology.activeLayer}].${path}`, e.target.value)
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

  const {layerType, viewId, sourceId} = useMemo(() => ({
    layerType: get(state,`symbology.layers[${state.symbology.activeLayer}]['layer-type']`),
    viewId: get(state,`symbology.layers[${state.symbology.activeLayer}].view_id`),
    sourceId: get(state,`symbology.layers[${state.symbology.activeLayer}].source_id`)
  }),[state])

  const column = useMemo(() => {
    return get(state, `symbology.layers[${state.symbology.activeLayer}].${path}`, null )
  },[state, path])

  useEffect(() => {
    if(sourceId) {
      falcor.get([
          "dama", pgEnv, "sources", "byId", sourceId, "attributes", "metadata"
      ]);
    }
  },[pgEnv, sourceId])

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
  }, [pgEnv, sourceId, falcorCache])

  useEffect(() => {
    if(column && layerType === 'categories') {
      const options = JSON.stringify({
        groupBy: [(column).split('AS ')[0]],
        exclude: {[(column).split('AS ')[0]]: ['null']},
        orderBy: {"2": 'desc'}
      })
      falcor.get([
        'dama',pgEnv,'viewsbyId', viewId, 'options', options, 'databyIndex',{ from: 0, to: 100},[column, 'count(1)::int as count']
      ])      
    }
  },[column, layerType, viewId])

  useEffect(() => {
    if(column && layerType === 'categories') {
      const options = JSON.stringify({
        groupBy: [(column).split('AS ')[0]],
        exclude: {[(column).split('AS ')[0]]: ['null']},
        orderBy: {"2": 'desc'}
      })
      let data = get(falcorCache, [
           'dama',pgEnv,'viewsbyId', viewId, 'options', options, 'databyIndex'
      ], {})
      setState(draft => {
        set(draft, `symbology.layers[${state.symbology.activeLayer}]['category-data']`, data)
      })
    }

  }, [column, layerType, viewId, falcorCache])

  return (
    <label className='flex w-full'>
      <div className='flex w-full items-center'>
        <select
          className='w-full p-2 bg-transparent'
          value={column}
          onChange={(e) => setState(draft => {
            let sourceTiles = get(state, `symbology.layers[${state.symbology.activeLayer}].sources[0].source.tiles[0]`, 'no source tiles').split('?')[0]
            
            if(sourceTiles !== 'no source tiles') {
              set(draft, `symbology.layers[${state.symbology.activeLayer}].sources[0].source.tiles[0]`, sourceTiles+`?cols=${e.target.value}`)
            }

            set(draft, `symbology.layers[${state.symbology.activeLayer}]['choroplethdata']`, {});
            set(draft, `symbology.layers[${state.symbology.activeLayer}]['categories']`, {});
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
  
  let rangeColorKey = get(state, `symbology.layers[${state.symbology.activeLayer}]['range-key']`,colorbrewer.schemeGroups.sequential[0])
  let numbins = get(state, `symbology.layers[${state.symbology.activeLayer}]['num-bins']`, 9)
  // console.log('select control', colorbrewer,rangeColorKey, numbins)
  let value = get(state, `symbology.layers[${state.symbology.activeLayer}].${path}`, colorbrewer[rangeColorKey][numbins])
  
  // console.log('value', value, path, colorbrewer)

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

  let { value: mapPaint, column, categorydata, colors, sourceId, categories, showOther } = useMemo(() => {
    return {
      sourceId: get(state,`symbology.layers[${state.symbology.activeLayer}].source_id`),
      value: get(state, `symbology.layers[${state.symbology.activeLayer}].${path}`, {}),
      column: get(state, `symbology.layers[${state.symbology.activeLayer}]['data-column']`, ''),
      categorydata: get(state, `symbology.layers[${state.symbology.activeLayer}]['category-data']`, {}),
      colors: get(state, `symbology.layers[${state.symbology.activeLayer}]['color-set']`, categoricalColors['cat1']),
      categories: get(state, `symbology.layers[${state.symbology.activeLayer}]['categories']`, {}),
      showOther: get(state, `symbology.layers[${state.symbology.activeLayer}]['category-show-other']`, '#ccc')
    }
  },[state])

  const [activeCatIndex, setActiveCatIndex] = React.useState();
  useEffect(() => {
    //console.log('getmetadat', sourceId)
    if(sourceId) {
      falcor.get([
          "dama", pgEnv, "sources", "byId", sourceId, "attributes", "metadata"
      ])//.then(d => console.log('source metadata sourceId', sourceId, d));
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

  //Number of total distinct values, not counting `null`
  const numCategories = useMemo(() => {
      //console.log('categorydata', categorydata)
      return Object.values(categorydata)
        .reduce((out,cat) => {
          if(typeof cat[column] !== 'object') {
            out++
          }
          return out
        },0)
   }, [categorydata])

  const currentCategories = categories?.legend?.filter(row => row.label !== "Other") ?? []
  const availableCategories = getDiffColumns(
    Object.values(categorydata)
      .filter((cat) => typeof cat[column] !== "object")
      .map((catData) => catData[column]),
    currentCategories.map((cat) => cat.label)
  ).map((cat) => ({ label: cat, value: cat }));

  const isShowOtherEnabled = showOther === '#ccc'
  const numCatOptions = [10,20,30,50,100];
  return (
   
      <div className=' w-full items-center'>
        {
          activeCatIndex !== undefined  && 
          <>
            <label className='flex'>
              <div className='flex items-center'>
                <input
                  type='color' 
                  value={toHex(get(state, `symbology.layers[${state.symbology.activeLayer}]['categories'].legend[${activeCatIndex}].color`, colors[(activeCatIndex % colors.length)]))}
                  onChange={(e) => {
                    const updatedCategoryPaint = [...mapPaint];
                    const indexOfLabel = updatedCategoryPaint.indexOf(currentCategories[activeCatIndex].label);
                    updatedCategoryPaint.splice(indexOfLabel+1, 1, e.target.value);

                    setState(draft => {
                      const newLegend = currentCategories.map((d, i) => {
                        if (i === activeCatIndex) {
                          return { color: e.target.value, label: get(metadataLookup, d.label, d.label) }
                        }
                        else {
                          return { color: d.color, label: get(metadataLookup, d.label, d.label) }
                        }
                      })

                      set(draft, `symbology.layers[${state.symbology.activeLayer}]['legend-data']`, newLegend)
                      set(draft, `symbology.layers[${state.symbology.activeLayer}]['categories']`,{
                        paint: updatedCategoryPaint, legend: newLegend
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
              onChange={(e) => setState(draft => {
                set(draft, `symbology.layers[${state.symbology.activeLayer}]['categories']`,{});
                set(draft, `symbology.layers[${state.symbology.activeLayer}].['num-categories']`, e.target.value);
              })}
            >
              <option key={'def'} value={currentCategories.length}>{currentCategories.length} Categories</option>
              {numCatOptions
                .filter((d, i) => {
                  return d !== currentCategories.length && 
                    (d < numCategories || 
                      (numCatOptions[i-1] < numCategories)
                    )  
                })
                .map((val,i) => (
                  <option key={i} value={val}>{val} Categories</option>
                ))}
            </select>
          </div>
        </div>
        <div className='flex items-center'>
          <div className='text-sm text-slate-400 px-2'>Show Other</div>
          <div className='flex items-center'>
            <Switch
              checked={isShowOtherEnabled}
              onChange={()=>{
                setState(draft=> {
                  const update = isShowOtherEnabled ? 'rgba(0,0,0,0)' : '#ccc';
                  set(draft, `symbology.layers[${state.symbology.activeLayer}]['category-show-other']`, update) 
                })
              }}
              className={`${
                isShowOtherEnabled ? 'bg-blue-500' : 'bg-gray-200'
              } relative inline-flex h-4 w-8 items-center rounded-full `}
            >
              <span className="sr-only">Show other</span>
              <div
                className={`${
                  isShowOtherEnabled ? 'translate-x-5' : 'translate-x-0'
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
                  const indexOfLabel = updatedCategoryPaint.indexOf(d.label);

                  //In filter array, the `label` preceeds its paint `value`
                  updatedCategoryPaint.splice(indexOfLabel, 2);
                  setState(draft=> {
                    set(draft, `symbology.layers[${state.symbology.activeLayer}]['legend-data']`, updatedCategoryLegend)
                    set(draft, `symbology.layers[${state.symbology.activeLayer}].['num-categories']`, updatedCategoryLegend.length);
                    set(draft, `symbology.layers[${state.symbology.activeLayer}]['categories']`,{
                      paint: updatedCategoryPaint, legend: updatedCategoryLegend.map(d => {
                        return {color: d.color, label: get(metadataLookup, d.label, d.label )}
                      })
                    });
                  });
                }}
              >
                <Close
                  className="mx-[6px] cursor-pointer group-hover/icon:fill-slate-500 "
                />
              </div>
            </div> 
          ))}
          {isShowOtherEnabled && <div className='w-full flex items-center hover:bg-slate-100'>
              <div className='flex items-center h-8 w-8 justify-center  border-r border-b '>
                <div className='w-4 h-4 rounded border-[0.5px] border-slate-600' style={{backgroundColor: showOther }}/>
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
                            set(draft, `symbology.layers[${state.symbology.activeLayer}]['categories']`,{
                              paint: updatedCategoryPaint, legend: updatedCategoryLegend.map(d => {
                                return {color: d.color, label: get(metadataLookup, d.label, d.label )}
                              })
                            });
                            set(draft, `symbology.layers[${state.symbology.activeLayer}].['num-categories']`, updatedCategoryLegend.length);
                            set(draft, `symbology.layers[${state.symbology.activeLayer}]['legend-data']`, updatedCategoryLegend) 
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

function roundToNearestTen(v) {
  return Math.pow(10, Math.round(Math.log10(v)));
}

function ChoroplethControl({path, params={}}) {
  const { state, setState } = React.useContext(SymbologyContext);
  const { falcor, falcorCache, pgEnv } = React.useContext(DamaContext);
  // console.log('select control', params)
  //let colors = categoricalColors
  let { numbins, method, colorKey, legenddata, showOther, choroplethdata, isLoadingColorbreaks } = useMemo(() => {
    return {
      numbins: get(state, `symbology.layers[${state.symbology.activeLayer}]['num-bins']`, 9),
      colorKey: get(state, `symbology.layers[${state.symbology.activeLayer}]['range-key']`, 'seq1'),
      method: get(state, `symbology.layers[${state.symbology.activeLayer}]['bin-method']`, 'ckmeans'),
      legenddata: get(state, `symbology.layers[${state.symbology.activeLayer}]['legend-data']`),
      choroplethdata: get(state, `symbology.layers[${state.symbology.activeLayer}]['choroplethdata']`, { breaks: [] }),
      showOther: get(state, `symbology.layers[${state.symbology.activeLayer}]['category-show-other']`, '#ccc'),
      isLoadingColorbreaks: get(state, `symbology.layers[${state.symbology.activeLayer}]['is-loading-colorbreaks']`, false)
    }
  },[state])

  const { breaks, max } = choroplethdata;
  const categories = breaks?.map((d,i) => {
    return {color: legenddata[i].color, label: `${breaks[i]} - ${breaks[i+1] || max}`}
  })
  .filter(d => d);

  const isShowOtherEnabled = showOther === '#ccc'

  /**
   * categories[0] is breaks[0] to breaks[1]
   * categories[n-1] (last element) is breaks[n-1] to max
   * minimum value of non-first break, is the value of the prior break + 1
   * max value of non-last break, is the value of the next break - 1
   */
  const rangeInputs = categories?.map((category, catIndex) => {
    return (
      <div key={`range_input_${catIndex}`}>
        <div
          key={catIndex}
          className="w-full flex items-center hover:bg-slate-100 cursor-auto"
        >
          <div className="flex items-center h-8 w-8 justify-center  border-r border-b ">
            <div
              className="w-4 h-4 rounded border-[0.5px] border-slate-600"
              style={{ backgroundColor: category.color }}
            />
          </div>
          <div className="flex items-center justify-between text-center flex-1 px-2 text-slate-600 border-b h-8 truncate overflow-auto w-full">
            <div className='px-2 w-[10px]'>
              {
                catIndex !== 0 && 
                  <i 
                    className="fa-solid fa-chevron-left cursor-pointer hover:text-pink-700"
                    onClick={() => {
                      console.log("move lower bound for range::", category.label);
                      setState((draft) => {
                        const minBreakValue = breaks[catIndex-1] + 1;
                        const newBreaks = [...breaks];
                        newBreaks[catIndex] = catIndex !== 0 ? Math.max(newBreaks[catIndex] - roundToNearestTen(newBreaks[catIndex]/10), minBreakValue) : newBreaks[catIndex] - roundToNearestTen(newBreaks[catIndex]/10);
                        set(draft, `symbology.layers[${state.symbology.activeLayer}]['choroplethdata']['breaks']`, newBreaks)
                      })
                    }}
                  />
              }
            </div>
            {category.label}
            <div className='px-2 w-[10px]'>
              {
                catIndex !== categories.length-1 && 
                  <i 
                    className="fa-solid fa-chevron-right cursor-pointer hover:text-pink-700"
                    onClick={() => {
                      console.log("move upper bound for range::", category.label);
                      setState((draft) => {
                        const newBreaks = [...breaks];
                        if(catIndex !== categories.length-1){
                          const maxBreakValue = catIndex === categories.length-2 ? max - 1 : breaks[catIndex+2] - 1;
                          newBreaks[catIndex+1] = Math.min(newBreaks[catIndex+1] + roundToNearestTen(newBreaks[catIndex+1]/10), maxBreakValue);
                          set(draft, `symbology.layers[${state.symbology.activeLayer}]['choroplethdata']['breaks']`, newBreaks)
                        }
                        else {
                          //adjust max
                          const newMax = max + roundToNearestTen(max/10);
                          set(draft, `symbology.layers[${state.symbology.activeLayer}]['choroplethdata']['max']`, newMax)
                        }
                      })
                    }}
                  />
              }
            </div>
          </div>
        </div>
      </div>
    );
  });
  
  
  
  return (
      <div className=' w-full items-center'>
        <div className='flex items-center'>
          <div className='text-sm text-slate-400 px-2'>Showing</div>
          <div className='border border-transparent hover:border-slate-200 m-1 rounded '>
            <select
              className='w-full p-2 bg-transparent text-slate-700 text-sm'
              value={numbins}
              onChange={(e) => setState(draft => {
                // console.log('SelectViewColumnControl set column path', path, e.target.value)
                set(draft, `symbology.layers[${state.symbology.activeLayer}].['num-bins']`, e.target.value)
                set(draft, `symbology.layers[${state.symbology.activeLayer}].['choroplethdata']`, {});
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
        <div className='flex items-center pb-2'>
          <div className='text-sm text-slate-400 px-2'>Show missing data</div>
          <div className='flex items-center'>
            <Switch
              checked={isShowOtherEnabled}
              onChange={()=>{
                setState(draft=> {
                  const update = isShowOtherEnabled ? 'rgba(0,0,0,0)' : '#ccc';
                  set(draft, `symbology.layers[${state.symbology.activeLayer}]['category-show-other']`,update)
                })
              }}
              className={`${
                isShowOtherEnabled ? 'bg-blue-500' : 'bg-gray-200'
              } relative inline-flex h-4 w-8 items-center rounded-full `}
            >
              <span className="sr-only">Show other</span>
              <div
                className={`${
                  isShowOtherEnabled ? 'translate-x-5' : 'translate-x-0'
                } inline-block h-4 w-4  transform rounded-full bg-white transition border-[0.5] border-slate-600`}
              />
            </Switch>

          </div>

        </div>
        <div className='w-full max-h-[250px] overflow-auto'>
          {
            isLoadingColorbreaks ?  (
                <div className="flex w-full justify-center overflow-hidden pb-2" >
                  Creating scale...
                  <span style={ { fontSize: "1.5rem" } } className={ `ml-2 fa-solid fa-spinner fa-spin` }/> 
                </div>
              ) : rangeInputs
          }
          {isShowOtherEnabled && <div className='w-full flex items-center hover:bg-slate-100'>
            <div className='flex items-center h-8 w-8 justify-center  border-r border-b '>
              <div className='w-4 h-4 rounded border-[0.5px] border-slate-600' style={{backgroundColor: showOther }}/>
            </div>
            <div className='flex items-center text-center flex-1 px-4 text-slate-600 border-b h-8 truncate'>No data</div>
            </div>
          }
        </div>
      </div>
    )
}

const getDiffColumns = (baseArray, subArray) => {
  return baseArray.filter(baseItem => !subArray.includes(baseItem))
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
