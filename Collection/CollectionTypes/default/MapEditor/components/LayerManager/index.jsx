import React, { useContext , useMemo } from 'react'
import {SymbologyContext} from '../../'
import SourceSelector from './SourceSelector'
import { DndList } from '~/modules/avl-components/src'

function LayerRow ({index, layer}) {
  return <div className='w-full bg-white p-2 py-0.5 flex border-white border hover:border-pink-500 group items-center'>
    <div className='text-sm text-slate-600 font-medium'>{layer.name}</div>
    <div className='flex-1'/>
    <div><i className='text-sm fa fa-eye text-slate-300 hover:text-slate-500 text-white group-hover:text-slate-300 cursor-pointer'/></div>
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
      <div className='bg-white w-[300px] rounded-lg drop-shadow-lg pointer-events-auto '>
        {/* ------Header ----------- */}
        <div className='flex justify-between items-center border-b'>
          <div className='font-bold text-slate-700 pt-2 pl-4'>Layer Manager</div>
          <SourceSelector />
        </div>
        {/* ------Layer Pane ----------- */}
        <div className='min-h-20 relative'>
          <DndList onDrop={droppedSection} offset={{x:16, y: 45}}>
          {Object.values(layers)
            .sort((a,b) => a.order - b.order)
            .map((layer,i) => <LayerRow key={layer.id} layer={layer}/>)}
          </DndList>
        </div>
      </div>
    </div>
  )
}



export default LayerManager