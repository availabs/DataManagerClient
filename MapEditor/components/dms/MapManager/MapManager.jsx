import React, { useContext, useMemo, Fragment, useRef} from 'react'
import { MapContext } from '../MapComponent'
// import { DamaContext } from "../../../../../../store"
import { Menu, Transition, Tab, Dialog } from '@headlessui/react'
import { Fill, Line, Circle, MenuDots , CaretUpSolid, CaretDownSolid, Plus} from '../../icons'
import get from 'lodash/get'
import { SelectSymbology } from './SymbologySelector'
// import LegendPanel from './LegendPanel'
import cloneDeep from 'lodash/cloneDeep'
import { getAttributes } from '~/pages/DataManager/Collection/attributes'
const typeIcons = {
  'fill': Fill,
  'circle': Circle,
  'line': Line
}


let iconList = [
  'fad fa-wrench',
  'fad fa-train',
  'fad fa-subway',
  'fad fa-traffic-light',
  'fad fa-traffic-cone',
  'fad fa-ship',
  'fad fa-route',
  'fad fa-road',
  'fad fa-plane-alt',
  'fad fa-parking',
  'fad fa-map-signs',
  'fad fa-map-pin',
  'fad fa-map-marker',
  'fad fa-map-marker-alt',
  'fad fa-map',
  'fad fa-location-circle',
  'fad fa-location-arrow',
  'fad fa-location',
  'fad fa-info',
  'fad fa-info-circle',
  'fad fa-industry-alt',
  'fad fa-globe',
  'fad fa-directions',
  'fad fa-car',
  'fad fa-cars',
  'fad fa-bus',
  'fad fa-truck',
  'fad fa-bicycle',
  'fad fa-layer-group',
  'fad fa-tachometer-fastest',
]

function arraymove(arr, fromIndex, toIndex) {
  var element = arr[fromIndex];
  arr.splice(fromIndex, 1);
  arr.splice(toIndex, 0, element);
}


function SymbologyMenu({button, location='left-0', width='w-36', children}) {
  

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
          <Menu.Items className={`absolute ${location} mt-1 ${width} origin-top-left divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none`}>
            {children}
          </Menu.Items>
        </Transition>
      </Menu>
  )
}


function SymbologyRow ({tabIndex, row, rowIndex}) {
  const { state, setState, falcorCache, pgEnv  } = React.useContext(MapContext);
  // const { activeLayer } = state.symbology;

  const { symbology, layer, selectedInteractiveFilterIndex, layerType, interactiveFilters } = useMemo(() => {
    const symbology = get(state, `symbologies[${row.symbologyId}]`, {});
    const layer = get(symbology,`symbology.layers[${Object.keys(symbology?.symbology?.layers || {})[0]}]`, {});
    return {
      symbology,
      layer,
      selectedInteractiveFilterIndex: get(layer, `['selectedInteractiveFilterIndex']`),
      layerType:get(layer, `['layer-type']`, 'simple'),
      interactiveFilters: get(layer, `['interactive-filters']`, [])
    }
  },[row, state])

  //const Icon = typeIcons?.[layer?.type] || typeIcons['Line']
  const visible = state?.symbologies?.[symbology.symbology_id]?.isVisible

  // console.log('testing', visible)
  const toggleVisibility = useMemo(() => {
    return () => setState(draft => {
      draft.symbologies[symbology.symbology_id].isVisible  = !draft.symbologies[symbology.symbology_id].isVisible
      Object.keys(draft.symbologies[symbology.symbology_id].symbology.layers).forEach(layerId => {
        draft.symbologies[symbology.symbology_id].symbology.layers[layerId].layers.forEach((d,i) => {
          let val = get(state, `symbologies[${symbology.symbology_id}].symbology.layers[${layerId}].layers[${i}].layout.visibility`,'') 
          let update = val === 'visible' ? 'none' : 'visible'
          draft.symbologies[symbology.symbology_id].symbology.layers[layerId].layers[i].layout =  { "visibility": update }
        })
      })
    })
  }, [state, setState]);


  const symbologies = useMemo(() => {
    return Object.values(get(falcorCache, ["dama", pgEnv, "symbologies", "byIndex"], {}))
      .map(v => getAttributes(get(falcorCache, v.value, { "attributes": {} })["attributes"]));
  }, [falcorCache, pgEnv]);

  const numRows = useMemo(() => {
    return state.tabs[tabIndex].rows.length;
  }, [state.tabs[tabIndex].length]);

  let interactiveElement = <></>;
  if (layerType === "interactive") {
    interactiveElement = (
      <div className="text-slate-600 font-medium truncate flex-1 pl-3 pr-1 pb-1">
        <div className="text-xs text-black">Filters:</div>
        <div className="rounded-md h-[36px] text-xs pl-0 pr-1 flex w-full w-[216px] items-center border border-transparent cursor-pointer hover:border-slate-300">
          <select
            className="w-full bg-transparent"
            value={selectedInteractiveFilterIndex}
            onChange={(e) => {
              setState((draft) => {
                draft.symbologies[row.symbologyId].symbology.layers[
                  layer.id
                ].selectedInteractiveFilterIndex = parseInt(e.target.value);
              });
            }}
          >
            {interactiveFilters.map((iFilter, i) => {
              return (
                <option key={i} value={i}>
                  {iFilter.label}
                </option>
              );
            })}
          </select>
        </div>
      </div>
    );
  }

  if(tabIndex === 0) {
    console.log(state)

    console.log({numRows, rowIndex})
  }

  return (
    <div className='border-white/85 border hover:border-pink-500 group'>
      <div className={`w-full  px-2 flex  items-center`}>
        <div className='pr-2 flex items-center'><input 
          type='checkbox'
          checked={visible}
          className='h-4 w-4 rounded border-slate-300 text-pink-600 focus:ring-pink-600'
          onChange={toggleVisibility}
        /></div>
        <div 
          onClick={state.isEdit ? () => {}: toggleVisibility}
          className='text-[13px] cursor-pointer font-regular hover:text-slate-900 text-slate-600 truncate flex items-center flex-1'
        >
          { state.isEdit ? (
              <input
                className="block w-[240px] flex flex-1 bg-transparent text-slate-800 placeholder:text-gray-400  focus:border-0"
                value={symbology?.name}
                placeholder='Layer Name'
                type='text'
                onChange={(e) => {
                  const layerName = e.target.value;
                  setState(draft => {
                    const newLayers = Object.keys(draft.symbologies[row.symbologyId].symbology.layers).reduce((acc, layerKey) => {
                      acc[layerKey] = {...draft.symbologies[row.symbologyId].symbology.layers[layerKey], name: layerName}
                      return acc;
                    }, {})
                    draft.symbologies[row.symbologyId].symbology.layers = newLayers;
                    draft.symbologies[row.symbologyId].name = layerName;
                    draft.tabs[tabIndex].rows[rowIndex].name =  layerName;
                  })
                }}
              />
            ) : 
              symbology?.name || ' no name'
          }
        </div>
        {state.isEdit &&
          <>
            <div
              className={`${rowIndex === 0 ? 'pointer-events-none' : ''}`}
              onClick={ () => {
                setState(draft => {
                  arraymove(draft.tabs[tabIndex].rows, rowIndex, rowIndex-1);
                })
              }}
            >
              <CaretUpSolid
                className={`pt-[2px] fill-white cursor-pointer group-hover:fill-gray-400 group-hover:hover:fill-pink-700`} 
                size={20}
              />
            </div>
            <div
              className={`${rowIndex === numRows-1 ? 'pointer-events-none' : ''}`}
              onClick={() => {
                setState(draft => {
                  arraymove(draft.tabs[tabIndex].rows, rowIndex, rowIndex+1);
                })
              }}
            >
              <CaretDownSolid
                className={`pb-[2px] fill-white cursor-pointer group-hover:fill-gray-400 group-hover:hover:fill-pink-700`}
                size={20}
              />
            </div>
          </>
        }
        {state.isEdit && (<div className='text-sm pt-1 px-0.5 flex items-center'>
          <SymbologyMenu 
            button={<MenuDots className={ `fill-white cursor-pointer group-hover:fill-gray-400 group-hover:hover:fill-pink-700`}/>}
          >
            <div className="px-1 py-1 ">
                <Menu.Item >
                  {({ active }) => (
                    <div 
                      className={`${
                        active ? 'bg-pink-50 ' : ''
                      } group flex w-full items-center text-red-400 rounded-md px-2 py-2 text-sm`}
                      onClick={() => {
                        setState(draft => {
                          delete draft.symbologies[symbology.symbology_id]
                          draft.tabs[tabIndex].rows.splice(rowIndex, 1)
                        })
                      }}
                    >Remove</div>
                  )}
                </Menu.Item>
              </div>
              <div className="px-1 py-1 ">
                <Menu.Item >
                  {({ active }) => (
                    <div 
                      className={`${
                        active ? 'bg-pink-50 ' : ''
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      onClick={async () => {
                        console.log("updating symbology for::", row.symbologyId);
                        setState(draft => {
                          let newSymbology = cloneDeep(symbologies.find(d => +d.symbology_id === +row.symbologyId))
                    
                          Object.keys(newSymbology.symbology.layers).forEach(layerId => {
                            newSymbology.symbology.layers[layerId].layers.forEach((d,i) => {
                              const val = get(state, `symbologies[${symbology.symbology_id}].symbology.layers[${layerId}].layers[${i}].layout.visibility`,'')
                              newSymbology.symbology.layers[layerId].layers[i].layout =  { "visibility": val }
                            })
                          })
                    
                          draft.symbologies[''+row.symbologyId] = newSymbology;
                          draft.symbologies[symbology.symbology_id].isVisible = visible;
                        })
                      }}
                    >Update symbology</div>
                  )}
                </Menu.Item>
              </div>
          </SymbologyMenu>
        </div>)}
      </div>
      {interactiveElement}
    </div>
  )
}

function CategoryRow ({row}) {
  return (
     <div>{row.name}</div>
  )
}

const rowTypes = {
  'symbology': SymbologyRow,
  'category': CategoryRow
}
export const INITIAL_NEW_MAP_MODAL_STATE = {
  open: false,
  symbologyId: null
};
function TabPanel ({tabIndex, tab}) {
  const { state, setState } = React.useContext(MapContext);
  const menuButtonContainerClassName = ' p-1 rounded hover:bg-slate-100 group';
  const [addSymbologyModalState, setAddSymbologyModalState] = React.useState(INITIAL_NEW_MAP_MODAL_STATE);

  const numTabs = useMemo(() => {
    return state.tabs.length;
  }, [state.tabs.length]);

  return (
    <div className='w-full'>
      {/* --- Header --- */}
      <div className='flex'>
        <div className='flex-1 items-center'>
         <input 
            type="text"
            className='border w-[180px] font-medium border-transparent hover:border-slate-200 outline-2 outline-transparent rounded-md bg-transparent py-1 px-2 text-slate-800 placeholder:text-gray-400 focus:outline-pink-300 sm:leading-6'
            value={tab.name}
            onChange={(e) => setState(draft => { 
               
                draft.tabs[tabIndex].name = e.target.value                           
            })}
          />
        </div>
        {state.isEdit && (
          <div className='w-[28px] h-[28px] justify-center m-1 rounded hover:bg-slate-100 flex items-center flex'
            onClick={() => {
              setAddSymbologyModalState({...addSymbologyModalState, open: true})}
            }
          >
            <Plus className='fill-slate-500 hover:fill-pink-300 hover:cursor-pointer' 
          />
          </div>
        )}
        {state.isEdit && (<>
          <SymbologyMenu 
            button={
              <div 
                className='w-[28px] h-[28px] justify-center m-1 rounded hover:bg-slate-100 flex items-center' 
              >
                <MenuDots className='fill-slate-500 hover:fill-pink-300' />
              </div>
            }
          >
            <div className="px-1 py-1 ">
                <Menu.Item >
                  {({ active }) => (
                    <div 
                      className={`${
                        active ? 'bg-pink-50 ' : ''
                      } group flex w-full items-center text-red-400 rounded-md px-2 py-2 text-sm`}
                      onClick={() => {
                        setState(draft => {
                          console.log('remove tab', state, tabIndex)
                          draft.tabs.splice(tabIndex,1)
                        })
                      }}
                    >Remove</div>
                  )}
                </Menu.Item>
              </div>
              {tabIndex !== 0 && <div className="px-1 py-1 ">
                <Menu.Item >
                  {({ active }) => (
                    <div 
                      className={`${
                        active ? 'bg-pink-50 ' : ''
                      } group flex w-full items-center  rounded-md px-2 py-2 text-sm`}
                      onClick={() => {
                        setState(draft => {
                          arraymove(draft.tabs, tabIndex, tabIndex-1);
                        })
                      }}
                    >Move section up</div>
                  )}
                </Menu.Item>
              </div>}
              {tabIndex !== numTabs-1 && <div className="px-1 py-1 ">
                <Menu.Item >
                  {({ active }) => (
                    <div  
                      className={`${
                        active ? 'bg-pink-50 ' : ''
                      } group flex w-full items-center  rounded-md px-2 py-2 text-sm`}
                      onClick={() => {
                        setState(draft => {
                          arraymove(draft.tabs, tabIndex, tabIndex+1);
                        })
                      }}
                    >Move section down</div>
                  )}
                </Menu.Item>
              </div>}
          </SymbologyMenu>
          <SymbologyMenu 
            button={
              <div 
                className='w-[28px] h-[28px] justify-center m-1 rounded hover:bg-slate-100 flex items-center' 
              >
                  <i className={`text-lg text-slate-400 hover:text-pink-300 ${tab?.icon || 'fad fa-layer-group'} fa-fw mx-auto`} />
              </div>
            }
            width={'w-[190px]'}
          >
            <div className="px-1 py-1 flex flex-wrap">
                {iconList.map(icon => {
                  return (
                    <Menu.Item key={icon}>
                      {({ active }) => (
                        <div 
                          className={`${
                            active ? 'bg-pink-50 ' : ''
                          } rounded-md p-1 text-lg`}
                          onClick={() => {
                            setState(draft => {
                              draft.tabs[tabIndex].icon = icon
                              //console.log('remove tab', state, tabIndex)
                              //draft.tabs.splice(tabIndex,1)
                            })
                          }}
                        >
                          <div className={` cursor-pointer w-[28px] h-[28px] justify-center rounded hover:bg-slate-100 flex items-center ${icon}`} />
                          
                        </div>
                      )}
                    </Menu.Item>
                  )
                })}
              </div>
          </SymbologyMenu>
          <div className='flex items-center ml-1'>
            <SelectSymbology
              tabIndex={tabIndex}
              className={menuButtonContainerClassName}
              modalState={addSymbologyModalState}
              setModalState={setAddSymbologyModalState}
            />
          </div>
        </>
        )}
      </div>
      {/* --- Rows --- */}
      {/* --   -- */}
      <div className='flex flex-col '>
        {(tab?.rows || []).map((row,i) => {
          let RowComp = rowTypes[row.type] || rowTypes['category']
          return (
            <RowComp row={row} rowIndex={i} tabIndex={tabIndex} key={i} />
          )
        })}
      </div>
    </div>

  )
}


function MapManager () {
  const { state, setState } = React.useContext(MapContext);
  
  // console.log('MapManager', state)

  return(
    <div className='p-4'>
      <div className='bg-white/95 w-[340px] overflow-x-auto overflow-x-visible rounded-lg drop-shadow-lg pointer-events-auto  min-h-[400px] max-h-[calc(100vh_-_111px)] scrollbar-sm '>
        <Tab.Group className='flex'>
          <div className='flex flex-col justify-between items-center border-r'>
            <Tab.List className='flex w-[40px] flex-1 flex-col '>
              {state.tabs.map((tab,i) => (
                <Tab  key={tab.name} as={Fragment}>
                  {({ selected }) => (
                    <div
                      className={`
                        ${selected ? 
                          'text-blue-500 border-r-2 border-blue-600' : 
                          'text-slate-400'} text-sm cursor-pointer
                      `}
                    >
                      <div className='w-full flex items-center'>
                        <i className={`text-lg hover:text-blue-500 ${tab?.icon || 'fad fa-layer-group'} fa-fw mx-auto`} />
                      </div>
                      
                    </div>
                  )}
                </Tab>
              ))}
            </Tab.List>
            {
              state.isEdit && (
              <>
                <div className='w-[28px] h-[28px] cursor-pointer justify-center m-1 rounded hover:bg-slate-100 flex items-center flex'
                  title="Set initial viewport"
                  onClick={() => {
                    setState(draft => {
                      draft.setInitialBounds = true;
                    })
                  }}
                >
                  <i 
                    className="fa-regular fa-circle-location-arrow text-slate-500 hover:text-pink-700"
                  />
                </div>
                <div 
                  className='p-1 rounded hover:bg-slate-100 m-1 cursor-pointer' 
                  onClick={() => setState(draft => {
                    draft.tabs.push({name: `Layers ${state.tabs.length - 1}`, icon: 'fad fa-layer-group' ,rows:[]})
                  })}
                >
                  <Plus className='fill-slate-500 hover:fill-pink-700' />
                </div>
              </>
          )}  
          </div>

          <Tab.Panels className='flex-1 w-[220px] '>
            {state.tabs.map((tab,i) => (
              <Tab.Panel key={i} className='w-full'>
                <TabPanel  tab={tab} tabIndex={i} />
              </Tab.Panel>)
            )}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  )
}



export default MapManager