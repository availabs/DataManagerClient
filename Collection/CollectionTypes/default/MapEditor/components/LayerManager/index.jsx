import React, { useContext , useMemo, useCallback } from 'react'
import {SymbologyContext} from '../../'
import SourceSelector from './SourceSelector'
import { DndList } from '~/modules/avl-components/src'
import { Fill, Line, Circle, Eye, MenuDots} from '../icons'


const typeIcons = {
  'fill': Fill,
  'circle': Circle,
  'line': Line
}

function LayerRow ({index, layer}) {
  const { symbology, setSymbology  } = React.useContext(SymbologyContext);
  const { activeLayer } = symbology;
  const toggleSymbology = () => {
    setSymbology(draft => {
        console.log('setSymbology', activeLayer, layer.id, activeLayer === layer.id)
        draft.activeLayer = activeLayer === layer.id ? '' : layer.id
    })
  }
  const Icon = typeIcons[layer.type] || <span />

  return <div className={`w-full ${activeLayer == layer.id ? 'bg-pink-100' : 'bg-white'} p-2 py-0.5 flex border-white border hover:border-pink-500 group items-center`}>
    <div className='px-1'><Icon className='fill-slate-400' /></div>
    <div onClick={toggleSymbology} className='text-sm text-slate-600 font-medium'>{layer.name} </div>
    <div onClick={toggleSymbology} className='flex-1 h-4'/>
    <div className='text-sm px-2'><MenuDots className={` ${activeLayer == layer.id ? 'fill-pink-100' : 'fill-white'} cursor-pointer group-hover:fill-gray-400 group-hover:hover:fill-pink-700`}/></div>
    <div><Eye className={` ${activeLayer == layer.id ? 'fill-pink-100' : 'fill-white'} cursor-pointer group-hover:fill-gray-400 group-hover:hover:fill-pink-700`}/></div>
  </div>
}

function LayerManager (props) {
  const { symbology, setSymbology  } = React.useContext(SymbologyContext);
  const layers = useMemo(() => symbology?.layers || symbology?.symbology || {}, [symbology])
  //console.log('layers', layers)
  const droppedSection = React.useCallback((start, end) => {
    setSymbology(draft => {
    const sections = Object.values(draft.layers)
        .sort((a, b) => a.order - b.order);
    
    // console.log('drop section', start,end, sections)
    const [item] = sections.splice(start, 1);
    sections.splice(end, 0, item);

    sections.forEach((item, i) => {
        item.order = i
    })
    
    draft.layers =  sections
        .reduce((out,sec) => {
          out[sec.id] = sec;
          return out 
        },{})
    })
  }, [])

  return (
    <div className='p-4'>
      <div className='bg-white w-[280px] rounded-lg drop-shadow-lg pointer-events-auto '>
        {/* ------Header ----------- */}
        <div className='flex justify-between items-center border-b'>
          <div className='font-bold text-slate-700 pt-2 pl-4'>Layer Manager</div>
          <SourceSelector />
        </div>
        {/* ------Layer Pane ----------- */}
        <div className='min-h-20 relative'>
          <DndList onDrop={droppedSection} offset={{x:16, y: 45}}>
          {Object.values(layers)
            .sort((b,a) => a.order - b.order)
            .map((layer,i) => <LayerRow key={layer.id} layer={layer}/>)}
          </DndList>
        </div>
      </div>
    </div>
  )
}



export default LayerManager