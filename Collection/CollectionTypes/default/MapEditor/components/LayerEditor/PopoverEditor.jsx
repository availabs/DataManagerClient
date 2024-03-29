import React, { useContext , useMemo, Fragment}from 'react'
import {SymbologyContext} from '../../'
import { Plus, Close, MenuDots, CaretDown } from '../icons'
import { Menu, Popover, Transition, Tab, Dialog } from '@headlessui/react'
import { toHex } from '../LayerManager/utils'
import get from 'lodash/get'
import set from 'lodash/set'

import { LayerMenu } from '../LayerManager/LayerPanel'
import typeConfigs from './typeConfigs'
import { wrapperTypes } from './ControlWrappers'
import { SelectControl } from './Controls'


function StyleEditor (props) {
  const { state, setState } = React.useContext(SymbologyContext);
  const activeLayer = useMemo(() => state.symbology?.layers?.[state.symbology.activeLayer] || null, [state])
  const config = useMemo(() => typeConfigs[activeLayer.type] || []
    ,[activeLayer.type])
  
  return activeLayer && (
    <div>
      <div className='p-4'>
      <div className='font-bold tracking-wider text-sm text-slate-700'>Popover</div>
        <SelectControl 
          path={`['hover']`} 
          params={{options: [{value: '', name:'None'}, {value: 'hover', name:'Hover'}]}} 
        />
      </div>
    </div>
  )
} 

export default StyleEditor