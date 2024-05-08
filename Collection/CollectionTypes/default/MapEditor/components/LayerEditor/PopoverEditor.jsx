import React, { useContext, useMemo }from 'react'
import {SymbologyContext} from '../../'
import { SelectControl, ColumnSelectControl } from './Controls'

function PopoverEditor (props) {
  const { state, setState } = useContext(SymbologyContext);
  const activeLayer = useMemo(() => state.symbology?.layers?.[state.symbology.activeLayer] || null, [state])

  return activeLayer && (
    <div>
      <div className='p-4'>
        <div className='font-bold tracking-wider text-sm text-slate-700'>Popover</div>
        <SelectControl 
          path={`['hover']`} 
          params={{options: [{value: '', name:'None'}, {value: 'hover', name:'Hover'}]}} 
        />
        <div className='font-bold tracking-wider text-sm text-slate-700'>Attributes:</div>
        {activeLayer.hover && 
          <ColumnSelectControl 
            path={`['hover-columns']`} 
            params={{dnd:true}} 
          />
        }
      </div>
    </div>
  )
} 

export default PopoverEditor