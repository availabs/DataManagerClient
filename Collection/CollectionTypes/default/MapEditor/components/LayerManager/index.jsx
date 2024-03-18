import React, { useContext , useMemo, useCallback, Fragment} from 'react'
import {SymbologyContext} from '../../'
import SourceSelector from './SourceSelector'
import { DndList } from '~/modules/avl-components/src'
import { Menu, Transition, Tab } from '@headlessui/react'
import { Fill, Line, Circle, Eye, EyeClosed, MenuDots} from '../icons'


const typeIcons = {
  'fill': Fill,
  'circle': Circle,
  'line': Line
}


function LayerMenu({layer, button}) {
  const { symbology, setSymbology  } = React.useContext(SymbologyContext);

  return (
      <Menu as="div" className="relative inline-block text-left">
        <Menu.Button>
          {button}
        </Menu.Button>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className='absolute left-0 mt-1 w-36 origin-top-left divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none'>
            <div className="px-1 py-1 ">
              <Menu.Item>
                {({ active }) => (
                  <div className={`${
                      active ? 'bg-blue-50 ' : ''
                    } group flex w-full items-center text-slate-600 rounded-md px-2 py-2 text-sm`}>Zoom to Fit</div>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <div 
                    className={`${
                      active ? 'bg-pink-50 ' : ''
                    } group flex w-full items-center text-red-400 rounded-md px-2 py-2 text-sm`}
                    onClick={() => {
                      setSymbology(draft => {
                        delete draft.layers[layer.id]
                        Object.values(draft.layers)
                          .sort((a, b) => b.order - a.order)
                          .forEach((l,i) => l.order = i)
                      })
                    }}
                  >Delete</div>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
  )
} 

function LayerRow ({index, layer, i}) {
  const { symbology, setSymbology  } = React.useContext(SymbologyContext);
  const { activeLayer } = symbology;
  const toggleSymbology = () => {
    setSymbology(draft => {
        draft.activeLayer = activeLayer === layer.id ? '' : layer.id
    })
  }
  const Icon = typeIcons[layer.type] || <span />
  const visible = layer.visible

  return (
    <div className={`w-full ${activeLayer == layer.id ? 'bg-pink-100' : 'bg-white'} p-2 py-1 flex border-white border hover:border-pink-500 group items-center`}>
      <div className='px-1'><Icon className='fill-slate-400' /></div>
      <div onClick={toggleSymbology} className='text-sm text-slate-600 font-medium truncate flex-1'>{layer.name}</div>
      {/*<div className='flex items-center text-xs text-slate-400'>{layer.order}</div>*/}
      <div className='text-sm pt-1 px-0.5 flex items-center'>
        <LayerMenu 
          layer={layer}
          button={<MenuDots className={` ${activeLayer == layer.id ? 'fill-pink-100' : 'fill-white'} cursor-pointer group-hover:fill-gray-400 group-hover:hover:fill-pink-700`}/>}
        />
      </div>
      <div onClick={() => {
        setSymbology(draft => {
          draft.layers[layer.id].visible = !draft.layers[layer.id].visible
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
    </div>
  )
}

function LayerManager (props) {
  const { symbology, setSymbology  } = React.useContext(SymbologyContext);
  const layers = useMemo(() => symbology?.layers || symbology?.symbology || {}, [symbology])
  //console.log('layers', layers)
  const droppedSection = React.useCallback((start, end) => {
    setSymbology(draft => {
    const sections = Object.values(draft.layers)
        
    let listLen = Object.values(draft.layers).length - 1
    let orderStart =  listLen - start
    let orderEnd = listLen - end 

    const [item] = sections.splice(orderStart, 1);
    sections.splice(orderEnd, 0, item);

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
    <>     
      {/* ------Layer Pane ----------- */}
      <div className='min-h-20 relative'>
        <DndList onDrop={droppedSection} offset={{x:16, y: 45}}>
        {Object.values(layers)
          .sort((a,b) => b.order - a.order)
          .map((layer,i) => <LayerRow key={layer.id} layer={layer} i={i} />)}
        </DndList>
      </div>
    </>
  )
}

function LeftManager () {
  
  const tabs = ['Legend', 'Layers']
  return(
    <div className='p-4'>
      <div className='bg-white w-[280px] rounded-lg drop-shadow-lg pointer-events-auto '>
        <Tab.Group>
          <div className='flex justify-between items-center border-b'>
            <Tab.List>
              {tabs.map(tabName => (
                <Tab  as={Fragment}>
                  {({ selected }) => (
                    <button
                      className={
                        `${selected ? 'text-slate-800  border-b-2 border-blue-400' : 'text-slate-400'} mx-1 text-sm p-2`
                      }
                    >
                      {tabName}
                    </button>
                  )}
                </Tab>
              ))}
            </Tab.List>
            <SourceSelector />
          </div>
          <Tab.Panels>
            <Tab.Panel><LayerManager /></Tab.Panel>
            <Tab.Panel><LayerManager /></Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  )

}



export default LeftManager