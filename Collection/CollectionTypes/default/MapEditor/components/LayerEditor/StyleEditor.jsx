import React, { useContext , useMemo, Fragment}from 'react'
import {SymbologyContext} from '../../'
import { Plus, Close, MenuDots, CaretDown } from '../icons'
import { LayerMenu } from '../LayerManager/LayerPanel'
import { Menu, Popover, Transition, Tab, Dialog } from '@headlessui/react'
import { toHex } from '../LayerManager/utils'
import { ChromePicker } from 'react-color';
import get from 'lodash/get'
import set from 'lodash/set'

function StyledControl ({children}) {
  return (
    <div className='rounded-md h-[36px] flex w-full p-2 items-center border border-white/50 hover:bg-white cursor-pointer hover:border-slate-200'>
      {children}
    </div>
  )
}

function PopoverControl ({values,title='',children}) {
  return (
    <StyledControl> 
      <Popover className="relative w-full">
          {({ open }) => (
            <>
              <Popover.Button className='w-full'>
               <div className='w-full flex items-center group'>
                <div className='flex items-center group-hover:flex-1'>{(values || []).map((v,i) => {
                  // console.log('test', v.value)
                  return <Fragment key={i}>
                    {v.type === 'color' && <div className='h-4 w-4 border' style={{backgroundColor:toHex(v.value)}}/> }
                    <div className='px-1 py-1 '><span className='uppercase'>{v.type === 'color' ? toHex(v.value) : v.value}</span>{v.unit ? v.unit : ''} </div>
                    <div className='px-1 py-1'>{i < values.length - 1 ? '/' : ''}</div>
                    </Fragment>
                })}</div>
                <div className='flex items-center '><CaretDown className='fill-slate-400 group-hover:fill-slate-800'/>
              </div>
            </div>
              </Popover.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <Popover.Panel className="absolute w-[250px] left-0  z-10 mt-3 -translate-x-[325px] -translate-y-[78px] transform px-4  ">
                  {({ close }) => (
                    <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black/5 bg-white/95">
                      <div className='flex justify-between items-center'>
                        <div className=' w-full flex text-slate-700 py-1 px-2 text-sm font-semibold tracking-wider'>
                          {title}
                        </div>
                        <div 
                          onClick={() => close()} 
                          className='p-0.5 rounded hover:bg-slate-100 m-1 cursor-pointer'>
                            <Close className='fill-slate-700' /> 
                        </div>
                      </div>
                      <div className="relative p-2 ">
                        {children}
                      </div>
                    </div>
                  )}
                </Popover.Panel>
              </Transition>
            </>
          )}
      </Popover>
    </StyledControl> 
  )
}

function SimpleControlWrapper ({controls}) {
  return (
    <StyledControl>
      {controls.map((c,i) => {
        const Control = controlTypes[c.type] || controlTypes['simple']
        return <Control key={i} path={c.path} params={c.params} />
      })}
    </StyledControl>
  )
}


function PopoverControlWrapper ({label, controls}) {
  const { state, setState } = React.useContext(SymbologyContext);
  const values = useMemo(() => {
    return controls.map(c => {
      let value = get(state, `symbology.layers[${state.symbology.activeLayer}].${c.path}`, '#ccc')
      return {
        type: c?.type,
        unit: c?.unit,
        value: value
      }
    })
  }, [state,controls])
  return (
    <PopoverControl
      values={values}
      title={label}
    >
      {controls.map((c,i) => {
        const Control = controlTypes[c.type] || controlTypes['simple']
        return <Control key={i} path={c.path} params={c.params}/>
      })}
    </PopoverControl>
  )
}

const wrapperTypes = {
  'popover': PopoverControlWrapper,
  'inline': SimpleControlWrapper,
}


function ColorControl({path,params={}}) {
  const { state, setState } = React.useContext(SymbologyContext);
  return (
    <label className='flex'>
      <div className='flex items-center'>
        <input
          type='color' 
          value={toHex(get(state, `symbology.layers[${state.symbology.activeLayer}].${path}`, '#ccc'))}
          onChange={(e) => setState(draft => {
            set(draft, `symbology.layers[${state.symbology.activeLayer}].${path}`, e.target.value)
          })}
        />
      </div>
      <div className='flex items-center p-2'>Custom </div>
    </label>
  )
}



function RangeControl({path,params={}}) {
  const { state, setState } = React.useContext(SymbologyContext);
  const identity = (d) => d
  const f = params?.format || identity  
  
  return (
    <div className='flex w-full  items-center'>
      <div className='flex-1 flex w-full'>
        <input
          className='w-full flex-1 accent-slate-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700">'
          type='range'
          min={params.min || "0"}
          max={params.max || "1"}
          step={params.step || "0.01"}
          value={get(state, `symbology.layers[${state.symbology.activeLayer}].${path}`, params.default || "1")}
          onChange={(e) => setState(draft => {
            set(draft, `symbology.layers[${state.symbology.activeLayer}].${path}`, +e.target.value)
          })}
        />
      </div>
      <div className='pl-2'>
        <input 
          className='w-14 px-2 py-1 bg-transparent'
          value={`${f(get(state, `symbology.layers[${state.symbology.activeLayer}].${path}`, params.default || "1"))}${params.units ? params.units : ''}`} 
          onChange={() => {}}
        />
      </div>
    </div>
  )
}

function SimpleControl({path}) {
  const { state, setState } = React.useContext(SymbologyContext);
  return (
    <label className='flex'>
      <div className='flex items-center'>
        <input
          className='w-full'
          type='text' 
          value={get(state, `symbology.layers[${state.symbology.activeLayer}].${path}`, '#ccc')}
          onChange={(e) => setState(draft => {
            set(draft, `symbology.layers[${state.symbology.activeLayer}].${path}`, e.target.value)
          })}
        />
      </div>
    </label>
  )
}

function SelectControl({path, params={}}) {
  const { state, setState } = React.useContext(SymbologyContext);
  // console.log('select control', params)
  return (
    <label className='flex w-full'>
      <div className='flex w-full items-center'>
        <select
          className='w-full p-2'
          value={get(state, `symbology.layers[${state.symbology.activeLayer}].${path}`, params.default || params?.options?.[0]?.value )}
          onChange={(e) => setState(draft => {
            set(draft, `symbology.layers[${state.symbology.activeLayer}].${path}`, e.target.value)
          })}
        >
          {(params?.options || []).map((opt,i) => {
            return (
              <option key={i} value={opt.value}>{opt.name}</option>
            )
          })}
        </select>
      </div>
    </label>
  )
}

const controlTypes = {
  'color': ColorControl,
  'range': RangeControl,
  'simple': SimpleControl,
  'select': SelectControl
}



const typeConfigs = {
  'fill': [
    {
      label: 'type',
      type: 'inline',
      controls: [
        {
          type: 'select',
          params: {
            options: [
              {name:'Simple', value: 'simple'},
              {name:'Categories', value: 'categories'},
              {name:'Color Range', value: 'colors'}
            ]
          },
          path: `layers[1]['layer-type']`
        }
      ]
    },
    {
      label: 'Fill',
      type: 'popover',
      controls: [
        {
          type: 'color',
          path: `layers[1].paint['fill-color']`
        }
      ]
    },
    {
      label: 'Stroke',
      type: 'popover',
      controls: [
        {
          type: 'color',
          path: `layers[0].paint['line-color']`
        },
        {
          type: 'range',
          unit: 'px',
          path: `layers[0].paint['line-width']`,
          params: {
            min: "0",
            max: "10",
            step: "0.5",
            default: "3",
            units: "px"
          }
        },
      ],
    },
    {
      label: 'Opacity',
      type: 'inline',
      controls: [
        {
          type: 'range',
          unit: '%',
          path: `layers[1].paint['fill-opacity']`,
          params: {
            min: "0",
            max: "1",
            step: "0.01",
            default: "0.75",
            units: "%",
            format: (v) => Math.round(v * 100)
          }
        },
      ],
    }
  ],
  'circle': [
    
    {
      label: 'Fill',
      type: 'popover',
      controls: [
        {
          type: 'color',
          path: `layers[0].paint['circle-color']`
        }
      ],
    },
    {
      label: 'Size',
      type: 'inline',
      controls: [
        {
          type: 'range',
          unit: '%',
          path: `layers[0].paint['circle-radius']`,
          params: {
            min: "0",
            max: "20",
            step: "0.5",
            default: "3",
            units: "px"
          }
        },
      ],
    },
    {
      label: 'Stroke',
      type: 'popover',
      controls: [
        {
          type: 'color',
          path: `layers[0].paint['circle-stroke-color']`
        },
        {
          type: 'range',
          unit: 'px',
          path: `layers[0].paint['circle-stroke-width']`,
          params: {
            min: "0",
            max: "20",
            step: "0.5",
            default: "3",
            units: "px"
          }
        },
      ],
    },
    {
      label: 'Opacity',
      type: 'inline',
      controls: [
        {
          type: 'range',
          unit: '%',
          path: `layers[0].paint['circle-opacity']`,
          params: {
            min: "0",
            max: "1",
            step: "0.01",
            default: "0.75",
            units: "%",
            format: (v) => Math.round(v * 100)
          }
        },
      ],
    }
  ],
  'line': [
    {
      label: 'Fill',
      type: 'popover',
      controls: [
        {
          type: 'color',
          path: `layers[1].paint['line-color']`
        }
      ],
    },
    {
      label: 'Size',
      type: 'inline',
      controls: [
        {
          type: 'range',
          unit: '%',
          path: `layers[1].paint['line-width']`,
          params: {
            min: "0",
            max: "20",
            step: "0.5",
            default: "3",
            units: "px"
          }
        },
      ],
    },
    {
      label: 'Casing',
      type: 'popover',
      controls: [
        {
          type: 'color',
          path: `layers[0].paint['line-color']`
        },
        {
          type: 'range',
          unit: 'px',
          path: `layers[0].paint['line-width']`,
          params: {
            min: "0",
            max: "20",
            step: "0.5",
            default: "3",
            units: "px"
          }
        },
      ],
    },
    {
      label: 'Opacity',
      type: 'inline',
      controls: [
        {
          type: 'range',
          unit: '%',
          path: `layers[1].paint['line-opacity']`,
          params: {
            min: "0",
            max: "1",
            step: "0.01",
            default: "0.75",
            units: "%",
            format: (v) => Math.round(v * 100)
          }
        },
      ],
    }
  ]
}

const layerTypeNames = {
  'fill': 'Polygons',
  'line': 'Lines',
  'circle': 'Points'
}

function StyleEditor (props) {
  const { state, setState } = React.useContext(SymbologyContext);
  const activeLayer = useMemo(() => state.symbology?.layers?.[state.symbology.activeLayer] || null, [state])
  const config = useMemo(() => typeConfigs[activeLayer.type] || []
    ,[activeLayer.type])
  

  return activeLayer && (
    <div>
      <div className='p-4'>
      <div className='font-bold tracking-wider text-sm text-slate-700'>{layerTypeNames[activeLayer.type]}</div>
      {config.map((control,i) => {
        let ControlWrapper = wrapperTypes[control.type] || wrapperTypes['inline']
        return (
          <div className='flex ' key={i}>
            <div className='w-16 text-slate-500 text-[14px] tracking-wide min-h-[32px] flex items-center'>{control.label}</div>
            <div className='flex-1 flex items-center'>
              <ControlWrapper
                label={control.label}
                controls={control.controls}
              />
            </div>
          </div>
        )
      })}

    </div>
    </div>
  )
} 

export default StyleEditor