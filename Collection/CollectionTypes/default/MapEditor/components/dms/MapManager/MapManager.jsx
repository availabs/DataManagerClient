import React, { useContext, useMemo, Fragment, useRef} from 'react'
import { MapContext } from '../MapComponent'
// import { DamaContext } from "../../../../../../store"
import { Menu, Transition, Tab, Dialog } from '@headlessui/react'
import { Fill, Line, Circle, Eye, EyeClosed, MenuDots , CaretDown, Plus} from '../../icons'
import get from 'lodash/get'
// import LegendPanel from './LegendPanel'
import SymbologySelector from './SymbologySelector'

const typeIcons = {
  'fill': Fill,
  'circle': Circle,
  'line': Line
}


function SymbologyRow ({index, row, i}) {
  const { state, setState  } = React.useContext(MapContext);
  // const { activeLayer } = state.symbology;
  const symbology = useMemo(() => get(state, `symbologies[${row.symbologyId}]`, {}), [row.symbologyId])
  const layer = useMemo(()=> get(symbology,`symbology.layers[${Object.keys(symbology.symbology.layers)[0]}]`, {}),[symbology])

  //const Icon = typeIcons?.[layer?.type] || typeIcons['Line']
  const visible = state?.symbologies?.[symbology.symbology_id]?.isVisible

  // console.log('testing', visible)

  return (
    <div className={`w-full p-2 py-1 flex border-white/85 border hover:border-pink-500 group items-center`}>
      <div className='pr-2 flex items-center'><input 
        type='checkbox'
        checked={visible}
        className='h-4 w-4 rounded border-slate-300 text-pink-600 focus:ring-pink-600'
        onChange={() => 
          setState(draft => {
            draft.symbologies[symbology.symbology_id].isVisible  = !draft.symbologies[symbology.symbology_id].isVisible
            Object.keys(draft.symbologies[symbology.symbology_id].symbology.layers).forEach(layerId => {
              draft.symbologies[symbology.symbology_id].symbology.layers[layerId].layers.forEach((d,i) => {
                  let val = get(state, `symbologies[${symbology.symbology_id}].symbology.layers[${layerId}].layers[${i}].layout.visibility`,'') 
                  let update = val === 'visible' ? 'none' : 'visible'
                  draft.symbologies[symbology.symbology_id].symbology.layers[layerId].layers[i].layout =  { "visibility": update }
              })
            })
        })}
      /></div>
      <div className='text-sm text-slate-600 font-medium truncate flex items-center flex-1'>{symbology?.name || ' no name'}</div>
      {/*<div className='flex items-center text-xs text-slate-400'>{layer.order}</div>*/}
      {/*<div className='text-sm pt-1 px-0.5 flex items-center'>
        <LayerMenu 
          layer={layer}
          button={<MenuDots className={` ${activeLayer == layer.id ? 'fill-pink-100' : 'fill-white'} cursor-pointer group-hover:fill-gray-400 group-hover:hover:fill-pink-700`}/>}
        />
      </div>*/}
      <div onClick={() => 
        setState(draft => {
          draft.symbologies[symbology.symbology_id].isVisible  = !draft.symbologies[symbology.symbology_id].isVisible
          Object.keys(draft.symbologies[symbology.symbology_id].symbology.layers).forEach(layerId => {
            draft.symbologies[symbology.symbology_id].symbology.layers[layerId].layers.forEach((d,i) => {
                let val = get(state, `symbologies[${symbology.symbology_id}].symbology.layers[${layerId}].layers[${i}].layout.visibility`,'') 
                let update = val === 'visible' ? 'none' : 'visible'
                draft.symbologies[symbology.symbology_id].symbology.layers[layerId].layers[i].layout =  { "visibility": update }
            })
          })
        })}
      >
        {visible ? 
          <Eye 
            className={`fill-white cursor-pointer group-hover:fill-gray-400 group-hover:hover:fill-pink-700`}
          /> : 
          <EyeClosed 
            className={`fill-white cursor-pointer group-hover:fill-gray-400 group-hover:hover:fill-pink-700`}
          />
        }
      </div>
    </div>
  )
}

function CategoryRow ({row}) {
  return (
     <div>{row.name}</div>
  )
}

const rowTypes = {
  'symbology': SymbologyRow,
  'category': CategoryRow
}

function TabPanel ({index, tab}) {
  const { state, setState } = React.useContext(MapContext);
  return (
    <div className='w-full'>
      {/* --- Header --- */}
      <div className='flex'>
        <div className='flex-1 items-center'>
         <input 
            type="text"
            className='border w-[150px] font-medium border-transparent hover:border-slate-200 outline-2 outline-transparent rounded-md bg-transparent py-1 px-2 text-slate-800 placeholder:text-gray-400 focus:outline-pink-300 sm:leading-6'
            value={tab.name}
            onChange={(e) => setState(draft => { 
               
                draft.tabs[index].name = e.target.value                           
            })}
          />
        </div>
        <div 
          className='w-[28px] h-[28px] justify-center m-1 rounded hover:bg-slate-100 flex items-center' 
          onClick={() => setState(draft => {
            //draft.tabs.push({name: `Layers ${state.tabs.length - 1}`, rows:[]})
          })}
        >
            <MenuDots className='fill-slate-500 hover:fill-pink-300' />
        </div>
        <div 
          className='w-[28px] h-[28px] justify-center m-1 rounded hover:bg-slate-100 flex items-center' 
          onClick={() => setState(draft => {
            //draft.tabs.push({name: `Layers ${state.tabs.length - 1}`, rows:[]})
          })}
        >
            <i className={`text-lg text-slate-400 hover:text-pink-300 ${tab?.icon || 'fad fa-layer-group'} fa-fw mx-auto`} />
        </div>
        <SymbologySelector index={index} />

      </div>
      {/* --- Rows --- */}
      {/* --   -- */}
      <div className='flex flex-col '>
        {(tab?.rows || []).map((row,i) => {
          let RowComp = rowTypes[row.type] || rowTypes['category']
          return (
            <RowComp row={row} index={i} key={i} />
          )
        })}
      </div>
    </div>

  )
}


function MapManager () {
  const { state, setState } = React.useContext(MapContext);
  
  console.log('MapManager', state)

  return(
    <div className='p-4'>
      <div className='bg-white/95 w-[280px] rounded-lg drop-shadow-lg pointer-events-auto flex min-h-[400px] max-h-[calc(100vh_-_111px)] overflow-auto scrollbar-sm '>
        <Tab.Group>
          <div className='flex flex-col justify-between items-center border-r'>
            <Tab.List className='flex w-[40px] flex-1 flex-col '>
              {state.tabs.map((tab,i) => (
                <Tab  key={tab.name} as={Fragment}>
                  {({ selected }) => (
                    <div
                      className={`
                        ${selected ? 
                          'text-blue-500 border-r-2 border-blue-600' : 
                          'text-slate-400'} text-sm cursor-pointer
                      `}
                    >
                      <div className='w-full flex items-center'>
                        <i className={`text-lg hover:text-blue-500 ${tab?.icon || 'fad fa-layer-group'} fa-fw mx-auto`} />
                      </div>
                      
                    </div>
                  )}
                </Tab>
              ))}
            </Tab.List>
            <div 
              className='p-1 rounded hover:bg-slate-100 m-1' 
              onClick={() => setState(draft => {
                //draft.tabs.push({name: `Layers ${state.tabs.length - 1}`, rows:[]})
              })}
            >
                <MenuDots className='fill-slate-500' />
            </div>
            <div 
              className='p-1 rounded hover:bg-slate-100 m-1' 
              onClick={() => setState(draft => {
                draft.tabs.push({name: `Layers ${state.tabs.length - 1}`, icon: 'fad fa-layer-group' ,rows:[]})
              })}
            >
                <Plus className='fill-slate-500' />
            </div>
            
          </div>
          <Tab.Panels className='flex-1 w-[220px] '>
            {state.tabs.map((tab,i) => (
              <Tab.Panel key={i} className='w-full'>
                <TabPanel  tab={tab} index={i} />
              </Tab.Panel>)
            )}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  )
}



export default MapManager