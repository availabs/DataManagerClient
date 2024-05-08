import React, { useContext , useMemo, useEffect, Fragment }from 'react'
import {SymbologyContext} from '../../'
import { DamaContext } from "../../../../../../store"
import { Menu, Transition, Switch } from '@headlessui/react'
// import get from 'lodash/get'
import isEqual from 'lodash/isEqual'
import { Plus, Close, MenuDots, CaretDown } from '../icons'
import { DndList } from '~/modules/avl-components/src'
import { rgb2hex, toHex, categoricalColors, rangeColors } from '../LayerManager/utils'
import {categoryPaint, isValidCategoryPaint ,choroplethPaint} from './datamaps'
import colorbrewer from '../LayerManager/colors'//"colorbrewer"
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
  let { value, viewId, sourceId,paintValue, column, categorydata, choroplethdata, colors, colorrange, numCategories, numbins, method, showOther } = useMemo(() => {
    return {
      value: get(state, `symbology.layers[${state.symbology.activeLayer}].${path}`, {}),
      viewId: get(state,`symbology.layers[${state.symbology.activeLayer}].view_id`),
      sourceId: get(state,`symbology.layers[${state.symbology.activeLayer}].source_id`),
      paintValue : get(state, `symbology.layers[${state.symbology.activeLayer}].${datapath}`, {}),
      column: get(state, `symbology.layers[${state.symbology.activeLayer}]['data-column']`, ''),
      categorydata: get(state, `symbology.layers[${state.symbology.activeLayer}]['category-data']`, {}),
      choroplethdata: get(state, `symbology.layers[${state.symbology.activeLayer}]['choropleth-data']`, {}),
      colors: get(state, `symbology.layers[${state.symbology.activeLayer}]['color-set']`, categoricalColors['cat1']),
      colorrange: get(state, `symbology.layers[${state.symbology.activeLayer}]['color-range']`, colorbrewer['seq1'][9]),
      numbins: get(state, `symbology.layers[${state.symbology.activeLayer}]['num-bins']`, 9),
      method: get(state, `symbology.layers[${state.symbology.activeLayer}]['bin-method']`, 'ckmeans'),
      numCategories: get(state, `symbology.layers[${state.symbology.activeLayer}]['num-categories']`, 10),
      showOther: get(state, `symbology.layers[${state.symbology.activeLayer}]['category-show-other']`, '#ccc')
    }
  },[state])

  useEffect(() => {
    console.log('getmetadat', sourceId)
    if(sourceId) {
      falcor.get([
          "dama", pgEnv, "sources", "byId", sourceId, "attributes", "metadata"
      ]).then(d => console.log('source metadata sourceId', sourceId, d));
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
    console.log('metadata',metadata)
    const hasCols = metadata?.length > 0 
    const hasNumber = metadata.reduce((out,curr) => {
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
      let {paint, legend} = categoryPaint(column,categorydata,colors,numCategories, showOther)
      console.log('categories xyz', paint, isValidCategoryPaint(paint))
      if(isValidCategoryPaint(paint) && !isEqual(paint,paintValue)) {
        console.log('update category paint', column, numCategories, showOther, categorydata, categoryPaint(column,categorydata,colors,numCategories,showOther))
      
        setState(draft => {
          set(draft, `symbology.layers[${state.symbology.activeLayer}].${datapath}`, paint)
          set(draft, `symbology.layers[${state.symbology.activeLayer}]['legend-data']`, legend)
        })
      }
    } else if(value === 'choropleth') {
      let { paint, legend } = choroplethPaint(column,choroplethdata,colorrange,numbins, method)
      //console.log('test paint', paint, paintValue)
      if(paint && !isEqual(paint,paintValue)) {
        //console.log('update choropleth paint', column, numbins, method)
      
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
  }, [value, column, categorydata, colors, numCategories, showOther, choroplethdata, colorrange, numbins, method])

  return (
    <label className='flex w-full'>
      <div className='flex w-full items-center'>
        <select
          className='w-full p-2 bg-transparent'
          value={get(state, `symbology.layers[${state.symbology.activeLayer}].${path}`, params.default || params?.options?.[0]?.value )}
          onChange={(e) => setState(draft => {
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

function SimpleControl({path}) {
  const { state, setState } = React.useContext(SymbologyContext);
  return (
    <label className='flex'>
      <div className='flex items-center'>
        <input
          className='w-full'
          type='text' 
          value={get(state, `symbology.layers[${state.symbology.activeLayer}].${path}`, '#ccc')}
          onChange={(e) => setState(draft => {
            set(draft, `symbology.layers[${state.symbology.activeLayer}].${path}`, e.target.value)
          })}
        />
      </div>
    </label>
  )
}

export function SelectControl({path, params={}}) {
  const { state, setState } = React.useContext(SymbologyContext);
  // console.log('select control', params)
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
  },[state])

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



  useEffect(() => {
    if(column && layerType === 'categories') {
      const options = JSON.stringify({
        groupBy: [column],
        exclude: {[column]: ['null']},
        orderBy: {"2": 'desc'}
      })
      falcor.get([
        'dama',pgEnv,'viewsbyId', viewId, 'options', options, 'databyIndex',{ from: 0, to: 100},[column, 'count(1)::int as count']
      ])      
    }
  },[column])

  useEffect(() => {
    if(layerType === 'categories') {
      const options = JSON.stringify({
        groupBy: [column],
        exclude: {[column]: ['null']},
        orderBy: {"2": 'desc'}
      })
      let data = get(falcorCache, [
           'dama',pgEnv,'viewsbyId', viewId, 'options', options, 'databyIndex'
      ], {})
      setState(draft => {
        set(draft, `symbology.layers[${state.symbology.activeLayer}]['category-data']`, data)
      })
    }

  }, [column, falcorCache])

  useEffect(() => {
    
    const requestData = async () => {
      const options = JSON.stringify({
        exclude: {[column]: ['null']},
      })
      const lenRes = await falcor.get([
        'dama',pgEnv,'viewsbyId', viewId, 'options', options, 'length'
      ]) 
      const len = get(lenRes, [
        'json', 'dama',pgEnv,'viewsbyId', viewId, 'options', options, 'length'
      ])
      // console.log('len', len)
      if(len > 0){
        falcor.get([
          'dama',pgEnv,'viewsbyId', viewId, 'options', options, 'databyIndex', {from: 0, to: len-1}, column
        ])
      }
    }

    if(column && layerType === 'choropleth') {
       requestData()
    }
  },[column])

  useEffect(() => {
    if(layerType === 'choropleth') {
      const options = JSON.stringify({
        exclude: {[column]: ['null']},
      })
      let data = Object.values(get(falcorCache, [
           'dama',pgEnv,'viewsbyId', viewId, 'options', options, 'databyIndex'
      ], {})).map((d,i) => {
        // if(i < 5 ) { console.log(d)}
        return d[column] || null 
      }).filter(d => d).sort((a,b) => a-b)
      //console.log('data', data)
      setState(draft => {
        set(draft, `symbology.layers[${state.symbology.activeLayer}]['choropleth-data']`, data)
      })
    }

  }, [column, falcorCache])

  // console.log('fun', sourceId, viewId, metadata)

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
              <option key={i} value={col.name}>{col.name}</option>
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
  // console.log('select control', params)
  //let colors = categoricalColors
  let { value, column, categorydata, colors } = useMemo(() => {
    return {
      value: get(state, `symbology.layers[${state.symbology.activeLayer}].${path}`, {}),
      column: get(state, `symbology.layers[${state.symbology.activeLayer}]['data-column']`, ''),
      categorydata: get(state, `symbology.layers[${state.symbology.activeLayer}]['category-data']`, {}),
      colors: get(state, `symbology.layers[${state.symbology.activeLayer}]['color-set']`, categoricalColors['cat1'])
    }
  },[state])

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

  const categories = (value || []).filter((d,i) => i > 2 )
            .map((d,i) => {
              if(i%2 === 0) {
                return {color: d, label: value[i+2]}
              }
              return null
            })
            .filter(d => d)

  const showOther = get(state, `symbology.layers[${state.symbology.activeLayer}]['category-show-other']`,'#ccc') === '#ccc'
  return (
   
      <div className=' w-full items-center'>
        <div className='flex items-center'>
          <div className='text-sm text-slate-400 px-2'>Showing</div>
          <div className='border border-transparent hover:border-slate-200 m-1 rounded '>
            <select
              className='w-full p-2 bg-transparent text-slate-700 text-sm'
              value={categories.length}
              onChange={(e) => setState(draft => {
                // console.log('SelectViewColumnControl set column path', path, e.target.value)
                set(draft, `symbology.layers[${state.symbology.activeLayer}].['num-categories']`, e.target.value)
              })}
            >
              <option key={'def'} value={categories.length}>{categories.length} Categories</option>
              {([10,20,30,50,100] || [])
                .filter(d => d < numCategories && d !== categories.length)
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
              <span className="sr-only">Enable notifications</span>
              <div
                className={`${
                  showOther ? 'translate-x-5' : 'translate-x-0'
                } inline-block h-4 w-4  transform rounded-full bg-white transition border-[0.5] border-slate-600`}
              />
            </Switch>

          </div>

        </div>
        <div className='w-full max-h-[250px] overflow-auto'>
        {categories.map((d,i) => (
          <div key={i} className='w-full flex items-center hover:bg-slate-100'>
            <div className='flex items-center h-8 w-8 justify-center  border-r border-b '>
              <div className='w-4 h-4 rounded border-[0.5px] border-slate-600' style={{backgroundColor:d.color}}/>
            </div>
            <div className='flex items-center text-center flex-1 px-4 text-slate-600 border-b h-8 truncate'>{d.label}</div>
          </div> 
        ))}
        {showOther && <div className='w-full flex items-center hover:bg-slate-100'>
            <div className='flex items-center h-8 w-8 justify-center  border-r border-b '>
              <div className='w-4 h-4 rounded border-[0.5px] border-slate-600' style={{backgroundColor:get(state, `symbology.layers[${state.symbology.activeLayer}]['category-show-other']`,'#ccc') }}/>
            </div>
            <div className='flex items-center text-center flex-1 px-4 text-slate-600 border-b h-8 truncate'>Other</div>
          </div>
        }
        </div>
      </div>
    )
}

function ChoroplethControl({path, params={}}) {
  const { state, setState } = React.useContext(SymbologyContext);
  const { falcor, falcorCache, pgEnv } = React.useContext(DamaContext);
  // console.log('select control', params)
  //let colors = categoricalColors
  let { value, column, choroplethdata, colors, numbins, method, colorKey } = useMemo(() => {
    return {
      value: get(state, `symbology.layers[${state.symbology.activeLayer}].${path}`, {}),
      column: get(state, `symbology.layers[${state.symbology.activeLayer}]['data-column']`, ''),
      choroplethdata: get(state, `symbology.layers[${state.symbology.activeLayer}]['choropleth-data']`, {}),
      colors: get(state, `symbology.layers[${state.symbology.activeLayer}]['color-range']`, colorbrewer['seq1'][9]),
      numbins: get(state, `symbology.layers[${state.symbology.activeLayer}]['num-bins']`, 9),
      colorKey: get(state, `symbology.layers[${state.symbology.activeLayer}]['range-key']`, 'seq1'),
      method: get(state, `symbology.layers[${state.symbology.activeLayer}]['bin-method']`, 'ckmeans')
    }
  },[state])

  const max = Math.max(...choroplethdata)
  //console.log('StepLegend',value, value || [])
  const categories = [
    ...(Array.isArray(value) ? value : []).filter((d,i) => i > 2 )
    .map((d,i) => {
    
      if(i%2 === 1) {
        //console.log('test 123', d, i)
        return {color: value[i+1], label: `${value[i+2]} - ${value[i+4] || max}`}
      }
      return null
    })
    .filter(d => d)
  ]

  const showOther = get(state, `symbology.layers[${state.symbology.activeLayer}]['category-show-other']`,'#ccc') === '#ccc'
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
                console.log('SelectViewColumnControl set bin method', path, e.target.value)
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
                  // console.log('update', update  )
                  set(draft, `symbology.layers[${state.symbology.activeLayer}]['category-show-other']`,update)
                  
                })
              }}
              className={`${
                showOther ? 'bg-blue-500' : 'bg-gray-200'
              } relative inline-flex h-4 w-8 items-center rounded-full `}
            >
              <span className="sr-only">Enable notifications</span>
              <div
                className={`${
                  showOther ? 'translate-x-5' : 'translate-x-0'
                } inline-block h-4 w-4  transform rounded-full bg-white transition border-[0.5] border-slate-600`}
              />
            </Switch>

          </div>

        </div>
        <div className='w-full max-h-[250px] overflow-auto'>
        {categories.map((d,i) => (
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
  return baseArray.filter(baseItem => !subArray.includes(baseItem))
}

const ExistingColumnList = ({selectedColumns, sampleData, state, setState, path, dnd}) => {
  const WrapperComponent = useMemo(() => {
    return dnd
      ? ({ children }) => (
          <DndList
            onDrop={(start, end) => {
              const sections = [...selectedColumns];

              const [item] = sections.splice(start, 1);
              sections.splice(end, 0, item);

              setState((draft) => {
                set(
                  draft,
                  `symbology.layers[${state.symbology.activeLayer}].${path}`,
                  sections
                );
              });
            }}
          >
            {children}
          </DndList>
        )
      : ({ children }) => (
          <div className="flex w-full flex-wrap">{children}</div>
        );
  }, [dnd, state, path, selectedColumns, dnd ]);
  
  return (
    <WrapperComponent>
      {selectedColumns?.map((selectedCol, i) => {
        return (
          <div
            key={i}
            className="group/title w-full text-sm grid grid-cols-9  "
          >
            <div className="truncate border-t border-r border-slate-200 p-1 col-span-4">
              {selectedCol}{" "}
            </div>
            <div className="truncate border-t border-slate-200 p-1 col-span-4 text-gray-300 cursor-default">
              {sampleData
                .map((row) => row[selectedCol])
                .filter(onlyUnique)
                .join(", ")}
            </div>
            <div
              className="border-t border-slate-200 cursor-pointer text-white group-hover/title:text-black group/icon col-span-1 p-1"
              onClick={() =>
                setState((draft) => {
                  set(
                    draft,
                    `symbology.layers[${state.symbology.activeLayer}].${path}`,
                    selectedColumns.filter((col) => col !== selectedCol)
                  );
                })
              }
            >
              <div
                style={{ fontFamily: "FontAwesome" }}
                className="mx-2 fa fa-x cursor-pointer group-hover/icon:text-pink-800"
              />
            </div>
          </div>
        );
      })}
    </WrapperComponent>
  );
};

export function ColumnSelectControl({path, params={"dnd": false}}) {
  const { state, setState } = React.useContext(SymbologyContext);
  const selectedColumns = get(
    state,
    `symbology.layers[${state.symbology.activeLayer}].${path}`,
    params.default || params?.options?.[0]?.value
  );
  const viewId = get(state,`symbology.layers[${state.symbology.activeLayer}].view_id`)
  const sourceId = get(state,`symbology.layers[${state.symbology.activeLayer}].source_id`);
  const { pgEnv, falcor, falcorCache } = useContext(DamaContext);

  useEffect(() => {
    if (sourceId) {
      falcor.get([
          "dama", pgEnv, "sources", "byId", sourceId, "attributes", "metadata"
      ]);
    }
  }, [sourceId]);

  const attributes = useMemo(() => {
    let columns = get(falcorCache, [
      "dama", pgEnv, "sources", "byId", sourceId, "attributes", "metadata", "value", "columns"
    ], []);
    if (columns.length === 0) {
      columns = get(falcorCache, [
        "dama", pgEnv, "sources", "byId", sourceId, "attributes", "metadata", "value"
      ], []);
    }
    return columns;
  }, [sourceId, falcorCache]); 
  
  const attributeNames = useMemo(() => attributes.filter(d => !['wkb_geometry'].includes(d)).map((attr) => attr.name), [attributes]);
  const hoverColumnNames = (
    selectedColumns
      ? getDiffColumns(attributeNames, selectedColumns)
      : attributeNames
  ).filter((d) => !["wkb_geometry"].includes(d));

  React.useEffect(() => {
    falcor.get([
      "dama",
      pgEnv,
      "viewsbyId",
      viewId,
      "databyIndex",
      {"from":0, "to": 2},
      attributeNames
    ])
  }, [falcor, pgEnv, viewId, attributeNames]);

  const sampleData = useMemo(() => {
    return Object.values(get(falcorCache, [
      "dama",
      pgEnv,
      "viewsbyId",
      viewId,
      "databyIndex",
    ], [])).map(v => get(falcorCache,[...v.value],''));
  },[pgEnv, falcorCache]);

  return (
    <div className='flex w-full flex-wrap'>
      <ExistingColumnList
        selectedColumns={selectedColumns}
        sampleData={sampleData}
        state={state}
        setState={setState}
        path={path}
        dnd={params.dnd}
      />

      <label className='flex w-full'>
        <div className='flex w-full items-center'>
          Add:
          <select
            className='w-full p-2 bg-transparent'
            value={''}
            onChange={(e) =>
              setState((draft) => {
                if (e.target.value !== "") {
                  set(
                    draft,
                    `symbology.layers[${state.symbology.activeLayer}].${path}`,
                    selectedColumns
                      ? [...selectedColumns, e.target.value]
                      : [e.target.value]
                  );
                }
              })
            }
          >
            <option key={-1} value={""}></option>
            {(hoverColumnNames || []).map((opt, i) => (
              <option key={i} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </label>
    </div>
  );
}


export const controlTypes = {
  'color': ColorControl,
  'categoricalColor': CategoricalColorControl,
  'rangeColor': ColorRangeControl,
  'categoryControl': CategoryControl,
  'choroplethControl':ChoroplethControl, 
  'columnSelectControl': ColumnSelectControl,
  'range': RangeControl,
  'simple': SimpleControl,
  'select': SelectControl,
  'selectType': SelectTypeControl,
  'selectViewColumn': SelectViewColumnControl
}
