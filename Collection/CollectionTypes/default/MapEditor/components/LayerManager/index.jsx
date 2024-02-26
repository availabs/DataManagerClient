import React, { useContext , useMemo } from 'react'
import {SymbologyContext} from '../../'

function LayerManager (props) {
  const { symbology, setSymbology  } = React.useContext(SymbologyContext);
  const layers = useMemo(() => symbology?.layers || symbology?.symbology || [], [symbology])
  console.log('layers', layers)

  return (
    <div className='p-4'>
      <div className='bg-white w-[300px] rounded-lg drop-shadow-lg pointer-events-auto '>
        {/* ------Header ----------- */}
        <div className='flex justify-between items-center border-b'>
          <div className='font-bold text-slate-700 pt-2 pl-4'>Layer Manager</div>
          <div className='pt-2 pr-2'> + </div>
        </div>
        {/* ------Header ----------- */}
        <div className='h-20 p-6'>
          Layers
        </div>
      </div>
    </div>
  )
}



export default LayerManager