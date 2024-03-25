import React, { useContext , useMemo, useCallback, Fragment, useRef} from 'react'
import { SymbologyContext } from '../../'
import { DamaContext } from "../../../../../../store"
import SourceSelector from './SourceSelector'
import { DndList } from '~/modules/avl-components/src'
import { Menu, Transition, Tab, Dialog } from '@headlessui/react'
import { useParams, useNavigate } from 'react-router-dom'
import { Fill, Line, Circle, Eye, EyeClosed, MenuDots , CaretDown} from '../icons'
import get from 'lodash/get'
import {LayerMenu} from './LayerPanel'



function VisibilityButton ({layer}) {
  const { state, setState  } = React.useContext(SymbologyContext);
  const { activeLayer } = state.symbology;
  const visible = layer.visible

  return (
    <div onClick={() => {
        setState(draft => {
          draft.symbology.layers[layer.id].visible = !draft.symbology.layers[layer.id].visible
        })}}
      >
      {visible ? 
        <Eye 
          className={` ${activeLayer == layer.id ? 'fill-pink-100' : 'fill-white'} cursor-pointer group-hover:fill-gray-400 group-hover:hover:fill-pink-700`}
            
        /> : 
        <EyeClosed 
        className={` ${activeLayer == layer.id ? 'fill-pink-100' : 'fill-white'} cursor-pointer group-hover:fill-gray-400 group-hover:hover:fill-pink-700`}
          
        />
      }
    </div>
  )
}

const typeSymbols = {
  'fill': ({layer}) => {
      const { state, setState  } = React.useContext(SymbologyContext);
      let color = get(layer, `layers[1].paint['fill-color']`, '#ccc')
      return (
        <div className='pr-2'>
          <div className={'w-4 h-4'} style={{backgroundColor:color}} />
        </div>
      )
  },
  'circle': ({layer}) => {
      const { state, setState  } = React.useContext(SymbologyContext);
      let color = get(layer, `layers[0].paint['circle-color']`, '#ccc')
      let borderColor = get(layer, `layers[0].paint['circle-stroke-color']`, '#ccc')
      return (
        <div className='pl-0.5 pr-2'>
          <div className={'w-3 h-3 rounded-full border-2'} style={{backgroundColor:color, borderColor}} />
        </div>
      )
  },
  'line': ({layer}) => {
      const { state, setState  } = React.useContext(SymbologyContext);
      let color = get(layer, `layers[1].paint['line-color']`, '#ccc')
      return (
        <div className='pr-2'>
          <div className={'w-4 h-1'} style={{backgroundColor:color}} />
        </div>
      )
  }
}

function LegendRow ({ index, layer, i }) {
  const { state, setState  } = React.useContext(SymbologyContext);
  const { activeLayer } = state.symbology;
  const toggleSymbology = () => {
    setState(draft => {
        draft.symbology.activeLayer = activeLayer === layer.id ? '' : layer.id
    })
  }

  const Symbol = typeSymbols[layer.type] || typeSymbols['fill']

  return (
    <div className={`w-full ${activeLayer == layer.id ? 'bg-pink-100' : ''} p-2 py-1 flex border-blue-50/50 border hover:border-pink-500 group items-center`}>
      <div className='px-1'><Symbol layer={layer}/></div>
      <div onClick={toggleSymbology} className='text-sm text-slate-600 font-medium truncate flex-1'>{layer.name}</div>
      {/*<div className='flex items-center text-xs text-slate-400'>{layer.order}</div>*/}
      <div className='text-sm pt-1 px-0.5 flex items-center'>
        <LayerMenu 
          layer={layer}
          button={<MenuDots className={` ${activeLayer == layer.id ? 'fill-pink-100' : 'fill-white'} cursor-pointer group-hover:fill-gray-400 group-hover:hover:fill-pink-700`}/>}
        />
      </div>
      <VisibilityButton layer={layer}/>
    </div>
  )
}

function LayerManager (props) {
  const { state, setState  } = React.useContext(SymbologyContext);
  const layers = useMemo(() => state.symbology?.layers ||  {}, [state])
  //console.log('layers', layers)
  const droppedSection = React.useCallback((start, end) => {
    setState(draft => {
    const sections = Object.values(draft.symbology.layers)
        
    let listLen = Object.values(draft.symbology.layers).length - 1
    let orderStart =  listLen - start
    let orderEnd = listLen - end 

    const [item] = sections.splice(orderStart, 1);
    sections.splice(orderEnd, 0, item);

    sections.forEach((item, i) => {
        item.order = i
    })
    
    draft.symbology.layers = sections
        .reduce((out,sec) => {
          out[sec.id] = sec;
          return out 
        },{})
    })
  }, [])

  return (
    <>     
      {/* ------Layer Pane ----------- */}
      <div className='min-h-20 relative'>
        <DndList onDrop={droppedSection} offset={{x:16, y: 45}}>
        {Object.values(layers)
          .sort((a,b) => b.order - a.order)
          .map((layer,i) => <LegendRow key={layer.id} layer={layer} i={i} />)}
        </DndList>
      </div>
    </>
  )
}

export default LayerManager