import React, { useContext , useMemo } from 'react'
import {SymbologyContext} from '../../'

function LayerManager (props) {
  const { symbology, setSymbology } = React.useContext(SymbologyContext);
  const activeLayer = useMemo(() => symbology?.layers?.[symbology.activeLayer] || null, [symbology])

  return activeLayer && (
    <div className='p-4'>
      <div className='bg-white w-[312px] rounded-lg drop-shadow-lg pointer-events-auto'>
        <div className='flex justify-between items-center border-b'>
          <div className='font-bold text-slate-700 pt-2 pl-4'>{activeLayer.name}</div>
          <div onClick={() => setSymbology(draft => {  draft.activeLayer = null})}><i className='fa fa-x fa-fw'/></div>
        </div>
        <div className='min-h-20 relative'>
        </div>
      </div>
    </div>
  )
} 

export default LayerManager