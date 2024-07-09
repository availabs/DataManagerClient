import React, { useContext , useMemo, Fragment, useEffect}from 'react'
import {SymbologyContext} from '../../'
import { DamaContext } from "../../../store"
import { Plus, Close, MenuDots } from '../icons'
import { rgb2hex, toHex, categoricalColors } from '../LayerManager/utils'
import { LayerMenu } from '../LayerManager/LayerPanel'
import { isValidCategoryPaint } from './datamaps'
import colorbrewer from '../LayerManager/colors'//"colorbrewer"
import { StyledControl } from './ControlWrappers'
import { Menu, Transition, Tab, Dialog } from '@headlessui/react'
import get from 'lodash/get'
import set from 'lodash/set'
import StyleEditor from './StyleEditor'
import PopoverEditor from './PopoverEditor'
import LegendEditor from './LegendEditor'
import FilterEditor from './FilterEditor'


function LayerManager (props) {
  const { state, setState } = React.useContext(SymbologyContext);
  const { falcor, falcorCache, pgEnv } = React.useContext(DamaContext);

  const { layerType, viewId, sourceId, colors, showOther, numbins, method, column, colorrange, numCategories, symbology_id: symbologyId, activeLayer, paintOverride } = useMemo(() => ({
    layerType: get(state,`symbology.layers[${state.symbology.activeLayer}]['layer-type']`),
    symbology_id: get(state,`symbology_id`),
    viewId: get(state,`symbology.layers[${state.symbology.activeLayer}].view_id`),
    sourceId: get(state,`symbology.layers[${state.symbology.activeLayer}].source_id`),
    colors: get(state, `symbology.layers[${state.symbology.activeLayer}]['color-set']`, categoricalColors['cat1']),
    numCategories: get(state, `symbology.layers[${state.symbology.activeLayer}]['num-categories']`, 10),
    showOther: get(state, `symbology.layers[${state.symbology.activeLayer}]['category-show-other']`, '#ccc'),
    numbins: get(state, `symbology.layers[${state.symbology.activeLayer}]['num-bins']`, 9),
    method: get(state, `symbology.layers[${state.symbology.activeLayer}]['bin-method']`, 'ckmeans'),
    colorrange: get(state, `symbology.layers[${state.symbology.activeLayer}]['color-range']`, colorbrewer['seq1'][9]),
    categories: get(state, `symbology.layers[${state.symbology.activeLayer}]['categories']`, {}),
    column: get(state, `symbology.layers[${state.symbology.activeLayer}]['data-column']`, null ),
    activeLayer: get(state, `symbology.layers[${state.symbology.activeLayer}]`, null ),
    paintOverride: get(state,`symbology.layers[${state.symbology.activeLayer}]['paint-override']`, {})
  }),[state]);

  const metadata = useMemo(() => {
    let out = get(falcorCache, [
          "dama", pgEnv, "sources", "byId", sourceId, "attributes", "metadata", "value", "columns"
      ], [])
    if(out.length === 0) {
        out = get(falcorCache, [
          "dama", pgEnv, "sources", "byId", sourceId, "attributes", "metadata", "value"
        ], [])
      }
    return out
  }, [sourceId,falcorCache]);

  const paintOptions = useMemo(() => {
    if(layerType === "choropleth"){
      return JSON.stringify({
        layerType,
        column,
        view_id: viewId,
        numbins,
        method,
        colorrange,
        paintOverride
      });
    }
    else {
      return JSON.stringify({
        layerType,
        column,
        view_id: viewId,
        colors,
        numCategories,
        showOther: showOther ? '#ccc' : 'rgba(0,0,0,0)',
        metadata,
        paintOverride
      });
    }
  }, [state]);

  useEffect(() => {
    const getSymbologyPaint = async () => {
      console.log("getting new paint for symbology::",symbologyId)
      falcor.get([
        'dama', pgEnv, 'symbologies', 'byId', symbologyId, 'paint', 'options', paintOptions
      ]);
    }

    if(column){
      getSymbologyPaint()
    }
  },[
    layerType,
    column,
    viewId,
    colors,
    numCategories,
    numbins,
    showOther,
    method,
    metadata,
    colorrange,
    paintOverride
  ]);

  const newCatPaint = useMemo(() => {
    return get(falcorCache, [
      'dama', pgEnv, 'symbologies', 'byId', symbologyId, 'paint', 'options', paintOptions, 'value'
    ], {});
  }, [falcorCache]);
  useEffect(() => {
    setState((draft) => {
      set(
        draft,
        `symbology.layers[${state.symbology.activeLayer}].categories`,
        newCatPaint
      );
      set(
        draft,
        `symbology.layers[${state.symbology.activeLayer}]['legend-data']`,
        newCatPaint?.legend
      );
    });
  }, [newCatPaint]);






  const tabs = ['Style', 'Legend','Popup','Filter']
  return activeLayer && (
    <div className='p-4'>
      <div className='bg-white/95 w-[312px] rounded-lg drop-shadow-lg pointer-events-auto min-h-[400px] max-h-[calc(100vh_-_161px)]  '>
        <div className='flex justify-between items-center border-b'>
          <div className='flex text-slate-700 p-2 '>
            <input 
            type="text"
            className='block w-[220px] border border-transparent hover:border-slate-200 outline-2 outline-transparent rounded-md bg-transparent py-1 px-2 text-slate-800 placeholder:text-gray-400 focus:outline-pink-300 sm:leading-6'
            placeholder={'Select / Create New Map'}
            value={state?.symbology?.layers?.[state?.symbology?.activeLayer]?.name}
            onChange={(e) => setState(draft => { 
              if(draft.symbology.activeLayer && draft.symbology.layers[draft.symbology.activeLayer].name){
                draft.symbology.layers[draft.symbology.activeLayer].name = e.target.value 
              }
            })}
          />
          </div>
          <div className='text-sm pt-1.5 px-1.5  hover:bg-slate-100 flex items-center'>
            <LayerMenu
              location={'right-0'}
              layer={activeLayer}
              button={<MenuDots className={` cursor-pointer group-hover:fill-gray-400 group-hover:hover:fill-pink-700`}/>}
            />
          </div>
          <div 
            onClick={() => setState(draft => {  draft.symbology.activeLayer = null})} 
            className='p-2.5 rounded hover:bg-slate-100 m-1 cursor-pointer'>
              <Close className='fill-slate-500' /> 
          </div>
        </div>
        <div className='min-h-20 relative'>
         <Tab.Group>
          <div className='flex justify-between items-center border-b'>
            <Tab.List>
              {tabs.map(tabName => (
                <Tab  key={tabName} as={Fragment}>
                  {({ selected }) => (
                    <button
                      className={`
                        ${selected ? 
                          'text-slate-600 border-b font-medium border-slate-600' : 
                          'text-slate-400'} mx-1 text-sm p-2 cursor-pointer
                      `}
                    >
                      {tabName}
                    </button>
                  )}
                </Tab>
              ))}
            </Tab.List>
          </div>
          <Tab.Panels>
            <Tab.Panel><StyleEditor /></Tab.Panel>
            <Tab.Panel><LegendEditor /></Tab.Panel>
            <Tab.Panel><PopoverEditor /></Tab.Panel>
            <Tab.Panel><FilterEditor /></Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
        </div>
      </div>
    </div>
  )
} 

export default LayerManager