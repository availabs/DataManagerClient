import React, { useContext , useMemo } from 'react'
import {SymbologyContext} from '../../'

function LayerManager (props) {
  const { symbology, setSymbology, activeLayer, setActiveLayer  } = React.useContext(SymbologyContext);
  const layers = useMemo(() => symbology?.layers || [], [symbology])

  return activeLayer && (
    <div className='p-2'>
      <div className='bg-white w-[300px] rounded-lg drop-shadow-lg p-4 pointer-events-auto'>
        <span className='font-bold text-slate-700 py-2'>Layer Editor</span>
      </div>
    </div>
  )
} 

export default LayerManager