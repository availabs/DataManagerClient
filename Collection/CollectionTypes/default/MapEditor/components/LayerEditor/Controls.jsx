import React, { useContext , useMemo, useEffect, Fragment }from 'react'
import {SymbologyContext} from '../../'
import { DamaContext } from "../../../../../../store"
import { Menu, Transition } from '@headlessui/react'
// import get from 'lodash/get'
import { Plus, Close, MenuDots, CaretDown } from '../icons'

import { rgb2hex, toHex, categoricalColors } from '../LayerManager/utils'
import {categoryPaint} from './datamaps'
import get from 'lodash/get'
import set from 'lodash/set'


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
          <Menu.Items className='absolute -right-[10px] w-[226px] py-2 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-20'>
            {children}
          </Menu.Items>
        </Transition>
      </Menu>
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
          className='w-full p-2 bg-transparent'
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

export function SelectTypeControl({path, datapath, params={}}) {
  const { state, setState } = React.useContext(SymbologyContext);
  // console.log('select control', params)
  let { value, column, categorydata, colors } = useMemo(() => {
    return {
      value: get(state, `symbology.layers[${state.symbology.activeLayer}].${path}`, {}),
      column: get(state, `symbology.layers[${state.symbology.activeLayer}]['data-column']`, ''),
      categorydata: get(state, `symbology.layers[${state.symbology.activeLayer}]['category-data']`, {}),
      colors: get(state, `symbology.layers[${state.symbology.activeLayer}]['color-set']`, categoricalColors['cat1'])
    }
  },[state])

  React.useEffect(() => {
    if( value === 'categories') {
      let paint = categoryPaint(column,categorydata,colors)
      setState(draft => {
        set(draft, `symbology.layers[${state.symbology.activeLayer}].${datapath}`, paint)
      })
    } else if( value === 'simple') {
      setState(draft => {
        set(draft, `symbology.layers[${state.symbology.activeLayer}].${datapath}`, rgb2hex(null))
      })
    } 
  }, [value, column, categorydata, colors])

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

  const {viewId, sourceId} = useMemo(() => ({
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
    return get(falcorCache, [
          "dama", pgEnv, "sources", "byId", sourceId, "attributes", "metadata", "value", "columns"
      ], [])
  }, [sourceId,falcorCache])


  useEffect(() => {
    if(column) {
      const options = JSON.stringify({
        groupBy: [column],
        exclude: {[column]: ['null']},
        orderBy: ['count(1) desc']
      })
      falcor.get([
        'dama',pgEnv,'viewsbyId', viewId, 'options', options, 'databyIndex',{ from: 0, to: 100},[column, 'count(1) as count']
      ])      
    }
  },[column])

  const categorydata = useMemo(() => {
    const options = JSON.stringify({
      groupBy: [column],
      exclude: {[column]: ['null']},
      orderBy: ['count(1) desc']
    })
    let data = get(falcorCache, [
         'dama',pgEnv,'viewsbyId', viewId, 'options', options, 'databyIndex'
    ], {})
    setState(draft => {
      set(draft, `symbology.layers[${state.symbology.activeLayer}].${datapath}`, data)
    })

  }, [column, falcorCache])

  // console.log('fun', sourceId, viewId, metadata)

  return (
    <label className='flex w-full'>
      <div className='flex w-full items-center'>
        <select
          className='w-full p-2 bg-transparent'
          value={column}
          onChange={(e) => setState(draft => {
            console.log('SelectViewColumnControl set column path', path, e.target.value)
            set(draft, `symbology.layers[${state.symbology.activeLayer}].${path}`, e.target.value)
          })}
        >
          {(metadata || [])
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

  console.log('value', value, categorydata, column)

  // const categoryPaint = useMemo(() => {
   

  // }, [categorydata, colors ])

  return (
   
      <div className=' w-full items-center'>
        Category Controls
        <div className='p-1'>
          <pre>
          {JSON.stringify(value,null,3)}
          </pre>
        </div>
        {/*<div className='p-1'>
          
          {JSON.stringify(categorydata)}
        </div>*/}

      </div>
    )
}


export const controlTypes = {
  'color': ColorControl,
  'categoricalColor': CategoricalColorControl,
  'categoryControl': CategoryControl,
  'range': RangeControl,
  'simple': SimpleControl,
  'select': SelectControl,
  'selectType': SelectTypeControl,
  'selectViewColumn': SelectViewColumnControl
}
