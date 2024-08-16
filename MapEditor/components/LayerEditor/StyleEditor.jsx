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
import { controlTypes } from './Controls'


const layerTypeNames = {
  'fill': 'Polygons',
  'line': 'Lines',
  'circle': 'Points'
}

function StyleEditor (props) {
  const { state, setState } = React.useContext(SymbologyContext);
  const activeLayer = useMemo(() => state.symbology?.layers?.[state.symbology.activeLayer] || null, [state])
  let config = useMemo(() => typeConfigs[activeLayer.type] || []
    ,[activeLayer.type])
  if(props.type === 'interactive') {
    config = config.filter(c => c.label !== 'Interactive Filters').map(c => {
      let newControls = [...c.controls];
      let newConditonal = c.conditional ? {...c.conditional} : undefined;

      newControls = newControls.map(ic => ({...ic, params:{...ic.params, pathPrefix: props.pathPrefix, version: 'interactive'}}))
      if(c.conditional){
        newConditonal.path = props.pathPrefix + newConditonal['path'];
      }


      return {...c, controls: newControls, conditional: newConditonal}
    })
  }

  return activeLayer && (
    <div>
      <div className='p-4'>
      <div className='font-bold tracking-wider text-sm text-slate-700'>{layerTypeNames[activeLayer.type]}</div>
      {config
        .filter(c => {
          if(!c.conditional) {
            return true
          } else {
            // console.log('has conditional')
            const condValue = get(state, `symbology.layers[${state.symbology.activeLayer}].${c.conditional.path}`, '-999')
            // console.log('has conditional',c.conditional, condValue)
            return c.conditional.conditions.includes(condValue)
          }
        })
        .map((control,i) => {
          let ControlWrapper = wrapperTypes[control.type] || wrapperTypes['inline'];
          return (
            <div className='flex flex-wrap' key={i}>
                <ControlWrapper
                  label={control.label}
                  controls={control.controls}
                />
            </div>
        )
      })}

    </div>
    </div>
  )
} 

export default StyleEditor