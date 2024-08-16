import React, { useMemo, useEffect, Fragment }from 'react'
import { Button } from "~/modules/avl-components/src";
import {SymbologyContext} from '../../'
import { DamaContext } from "../../../store"
import { Menu, Transition, Switch } from '@headlessui/react'
import isEqual from 'lodash/isEqual'
import { CaretDown, Close } from '../icons'
import { rgb2hex, toHex, categoricalColors, rangeColors } from '../LayerManager/utils'
import {categoryPaint, isValidCategoryPaint ,choroplethPaint} from './datamaps'
import colorbrewer from '../LayerManager/colors'//"colorbrewer"
import { StyledControl } from './ControlWrappers'
import get from 'lodash/get'
import set from 'lodash/set'
import cloneDeep from 'lodash/cloneDeep'
import { CategoryControl } from './CategoryControl';
import StyleEditor from './StyleEditor';

function ControlMenu({ button, children}) {
  const { state, setState  } = React.useContext(SymbologyContext);

  return (
      <Menu as="div" className="relative inline-block text-left w-full">
        <Menu.Button className='w-full'>
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
          <Menu.Items className='absolute -right-[10px] w-[226px] max-h-[400px] overflow-auto py-2 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-20'>
            {children}
          </Menu.Items>
        </Transition>
      </Menu>
  )
}

export function SelectTypeControl({path, datapath, params={}}) {
  const { state, setState } = React.useContext(SymbologyContext);
  const { falcor, falcorCache, pgEnv } = React.useContext(DamaContext);
  //console.log('select control', {path, datapath, params})

  const pathBase =
    params?.version === "interactive"
      ? `symbology.layers[${state.symbology.activeLayer}]${params.pathPrefix}`
      : `symbology.layers[${state.symbology.activeLayer}]`;

  let { value, viewId, sourceId,paintValue, column, categories, categorydata, colors, colorrange, numCategories, numbins, method, showOther, symbology_id, choroplethdata } = useMemo(() => {
    return {
      value: get(state, `${pathBase}.${path}`, {}),
      viewId: get(state,`symbology.layers[${state.symbology.activeLayer}].view_id`),
      sourceId: get(state,`symbology.layers[${state.symbology.activeLayer}].source_id`),
      paintValue : get(state, `${pathBase}.${datapath}`, {}),
      column: get(state, `${pathBase}['data-column']`, ''),
      categories: get(state, `${pathBase}['categories']`, {}),
      categorydata: get(state, `${pathBase}['category-data']`, {}),
      choroplethdata: get(state, `${pathBase}['choroplethdata']`),
      colors: get(state, `${pathBase}['color-set']`, categoricalColors['cat1']),
      colorrange: get(state, `${pathBase}['color-range']`, colorbrewer['seq1'][9]),
      numbins: get(state, `${pathBase}['num-bins']`, 9),
      method: get(state, `${pathBase}['bin-method']`, 'ckmeans'),
      numCategories: get(state, `${pathBase}['num-categories']`, 10),
      showOther: get(state, `${pathBase}['category-show-other']`, '#ccc'),
      symbology_id: get(state, `symbology_id`),
    }
  },[state])

  useEffect(() => {
    //console.log('getmetadat', sourceId)
    if(sourceId) {
      falcor.get([
          "dama", pgEnv, "sources", "byId", sourceId, "attributes", "metadata"
      ])//.then(d => console.log('source metadata sourceId', sourceId, d));
    }
  },[sourceId])

  const metadata = useMemo(() => {
    //console.log('getmetadata', falcorCache)
      let out = get(falcorCache, [
          "dama", pgEnv, "sources", "byId", sourceId, "attributes", "metadata", "value", "columns"
      ], [])
      if(out.length === 0) {
        out = get(falcorCache, [
          "dama", pgEnv, "sources", "byId", sourceId, "attributes", "metadata", "value"
        ], [])
      }
      return out

  }, [sourceId,falcorCache])

  const options = useMemo(() => {
    //console.log('metadata',metadata)
    const hasCols = metadata?.length > 0 
    const hasNumber = metadata?.reduce((out,curr) => {
      if(['integer', 'number'].includes(curr.type)){
        out = true
      }
      return out
    },false)

    return  [
      {name:'Simple', value: 'simple'},
      hasCols ? {name:'Categories', value: 'categories'} : null,
      hasNumber ? {name:'Color Range', value: 'choropleth'} : null,
      //TODO filter out interactive here, when its the sub-menu
      {name:'Interactive', value: 'interactive'}
    ].filter(d => d)
  },[metadata])

  React.useEffect(() => {
    const setPaint = async () => {
      if (value === 'categories') {
        let { paint, legend } = categories?.paint && categories?.legend
          ? cloneDeep(categories)
          : categoryPaint(
            column,
            categorydata,
            colors,
            numCategories,
            metadata
          );

        if (!(paint.length % 2)) {
          paint.push(showOther);
        } else {
          paint[paint.length-1] = showOther;
        }

        const isShowOtherEnabled = showOther === '#ccc';
        if(isShowOtherEnabled && legend) {
          if(legend[legend.length-1]?.label !== "Other") {
            legend.push({color: showOther, label: "Other"});
          }
          legend[legend.length-1].color = showOther;
        } else {
          if(legend[legend.length-1].label === "Other") {
            legend.pop();
          }
        }

        if(isValidCategoryPaint(paint) && !isEqual(paint,paintValue)) {
          setState(draft => {
            set(draft, `${pathBase}['categories']`, { paint, legend })
            set(draft, `${pathBase}.${datapath}`, paint)
            set(draft, `${pathBase}['legend-data']`, legend)
          })
        }
      } else if(value === 'choropleth') {
        const domainOptions = {
          column,
          viewId,
          numbins,
          method
        }

        let colorBreaks; 

        if(choroplethdata && Object.keys(choroplethdata).length === 2 ) {
          colorBreaks = choroplethdata;
        }
        else {
          setState(draft => {
            set(draft, `${pathBase}['is-loading-colorbreaks']`, true)
          })
          const res = await falcor.get([
            "dama", pgEnv, "symbologies", "byId", [symbology_id], "colorDomain", "options", JSON.stringify(domainOptions)
          ]);
          colorBreaks = get(res, [
            "json","dama", pgEnv, "symbologies", "byId", [symbology_id], "colorDomain", "options", JSON.stringify(domainOptions)
          ])
          setState(draft => {
            set(draft, `${pathBase}['is-loading-colorbreaks']`, false)
          })
        }
        let { paint, legend } = choroplethPaint(column, colorBreaks['max'], colorrange, numbins, method, colorBreaks['breaks'], showOther);
        const isShowOtherEnabled = showOther === '#ccc';
        if(isShowOtherEnabled) {
          if(legend[legend.length-1].label !== "No data") {
            legend.push({color: showOther, label: "No data"});
          }
          legend[legend.length-1].color = showOther;
        } else {
          if(legend[legend.length-1].label === "No data") {
            legend.pop();
          }
        }
        if(isValidCategoryPaint(paint) && !isEqual(paint, paintValue)) {
          setState(draft => {
            set(draft, `${pathBase}.${datapath}`, paint)
            set(draft, `${pathBase}['legend-data']`, legend)
            set(draft, `${pathBase}['choroplethdata']`, colorBreaks)
          })
        }
      } else if( value === 'simple' && typeof paintValue !== 'string') {
        // console.log('switch to simple')
        setState(draft => {
          set(draft, `${pathBase}.${datapath}`, rgb2hex(null))
        })
      }
    }
    if(value !== 'interactive'){
      console.log("value of state before repaint::", state)
      setPaint();
    }

  }, [categories, value, column, categorydata, colors, numCategories, showOther, colorrange, numbins, method, choroplethdata])

  return (
    <label className='flex w-full'>
      <div className='flex w-full items-center'>
        <select
          className='w-full p-2 bg-transparent'
          value={get(state, `${pathBase}.${path}`, params.default || params?.options?.[0]?.value )}
          onChange={(e) => setState(draft => {
            if(!column && e.target.value === 'categories') {
              const defaultColorColumn = metadata.filter(col => !['integer', 'number'].includes(col.type))[0]?.name ?? metadata[0]?.name;
              set(draft, `${pathBase}['data-column']`, defaultColorColumn)
            } else if (e.target.value === 'choropleth') {
              const currentColumn = metadata.find(col => col.name === column);
              if(!['integer', 'number'].includes(currentColumn?.type)) {
                const defaultColorColumn = metadata.filter(col => ['integer', 'number'].includes(col.type))[0]?.name ?? metadata[0]?.name;
                set(draft, `${pathBase}['data-column']`, defaultColorColumn)
              }
            }
            set(draft, `${pathBase}.${path}`, e.target.value)
          })}
        >
          {(options || []).map((opt,i) => {
            return (
              <option key={i} value={opt.value}>{opt.name}</option>
            )
          })}
        </select>
      </div>
    </label>
  )
} 

function ColorControl({path,params={}}) {
  const { state, setState } = React.useContext(SymbologyContext);

  const pathBase =
    params?.version === "interactive"
      ? `symbology.layers[${state.symbology.activeLayer}]${params.pathPrefix}`
      : `symbology.layers[${state.symbology.activeLayer}]`;

  return (
    <label className='flex'>
      <div className='flex items-center'>
        <input
          type='color' 
          value={toHex(get(state, `${pathBase}.${path}`, '#ccc'))}
          onChange={(e) => setState(draft => {
            set(draft, `${pathBase}.${path}`, e.target.value)
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
  
  const pathBase =
    params?.version === "interactive"
      ? `symbology.layers[${state.symbology.activeLayer}]${params.pathPrefix}`
      : `symbology.layers[${state.symbology.activeLayer}]`;

  return (
    <div className='flex w-full  items-center'>
      <div className='flex-1 flex w-full'>
        <input
          className='w-full flex-1 accent-slate-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700">'
          type='range'
          min={params.min || "0"}
          max={params.max || "1"}
          step={params.step || "0.01"}
          value={get(state, `${pathBase}].${path}`, params.default || "1")}
          onChange={(e) => setState(draft => {
            set(draft, `${pathBase}].${path}`, +e.target.value)
          })}
        />
      </div>
      <div className='pl-2'>
        <input 
          className='w-14 px-2 py-1 bg-transparent'
          value={`${f(get(state, `${pathBase}].${path}`, params.default || "1"))}${params.units ? params.units : ''}`} 
          onChange={() => {}}
        />
      </div>
    </div>
  )
}

function SimpleControl({path, params={}}) {
  const { state, setState } = React.useContext(SymbologyContext);

  const pathBase =
    params?.version === "interactive"
      ? `symbology.layers[${state.symbology.activeLayer}]${params.pathPrefix}`
      : `symbology.layers[${state.symbology.activeLayer}]`;

  return (
    <label className='flex'>
      <div className='flex items-center'>
        <input
          className='w-full'
          type='text' 
          value={get(state, `${pathBase}.${path}`, params?.default ?? '#ccc')}
          onChange={(e) => setState(draft => {
            set(draft, `${pathBase}.${path}`, e.target.value)
          })}
        />
      </div>
    </label>
  )
}

export function SelectControl({path, params={}}) {
  //console.log("select control path::", path)
  const { state, setState } = React.useContext(SymbologyContext);
  //console.log('select control', params)
  const pathBase =
    params?.version === "interactive"
      ? `symbology.layers[${state.symbology.activeLayer}]${params.pathPrefix}`
      : `symbology.layers[${state.symbology.activeLayer}]`;

  return (
    <label className='flex w-full'>
      <div className='flex w-full items-center'>
        <select
          className='w-full py-2 bg-transparent'
          value={get(state, `${pathBase}.${path}`, params.default || params?.options?.[0]?.value )}
          onChange={(e) => setState(draft => {
            set(draft, `${pathBase}.${path}`, e.target.value)
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



function SelectViewColumnControl({path, datapath, params={}}) {
  const { state, setState } = React.useContext(SymbologyContext);
  const { falcor, falcorCache, pgEnv } = React.useContext(DamaContext);

  const pathBase =
    params?.version === "interactive"
      ? `symbology.layers[${state.symbology.activeLayer}]${params.pathPrefix}`
      : `symbology.layers[${state.symbology.activeLayer}]`;

  const {layerType, viewId, sourceId} = useMemo(() => ({
    layerType: get(state,`${pathBase}['layer-type']`),
    viewId: get(state,`symbology.layers[${state.symbology.activeLayer}].view_id`),
    sourceId: get(state,`symbology.layers[${state.symbology.activeLayer}].source_id`)
  }),[state])

  const column = useMemo(() => {
    return get(state, `${pathBase}.${path}`, null )
  },[state, path])

  useEffect(() => {
    if(sourceId) {
      falcor.get([
          "dama", pgEnv, "sources", "byId", sourceId, "attributes", "metadata"
      ]);
    }
  },[pgEnv, sourceId])

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
  }, [pgEnv, sourceId, falcorCache])

  useEffect(() => {
    if(column && layerType === 'categories') {
      const options = JSON.stringify({
        groupBy: [(column).split('AS ')[0]],
        exclude: {[(column).split('AS ')[0]]: ['null']},
        orderBy: {"2": 'desc'}
      })
      falcor.get([
        'dama',pgEnv,'viewsbyId', viewId, 'options', options, 'databyIndex',{ from: 0, to: 100},[column, 'count(1)::int as count']
      ])      
    }
  },[column, layerType, viewId])

  useEffect(() => {
    if(column && layerType === 'categories') {
      const options = JSON.stringify({
        groupBy: [(column).split('AS ')[0]],
        exclude: {[(column).split('AS ')[0]]: ['null']},
        orderBy: {"2": 'desc'}
      })
      let data = get(falcorCache, [
           'dama',pgEnv,'viewsbyId', viewId, 'options', options, 'databyIndex'
      ], {})
      setState(draft => {
        set(draft, `${pathBase}['category-data']`, data)
      })
    }

  }, [column, layerType, viewId, falcorCache])

  return (
    <label className='flex w-full'>
      <div className='flex w-full items-center'>
        <select
          className='w-full p-2 bg-transparent'
          value={column}
          onChange={(e) => setState(draft => {
            let sourceTiles = get(state, `${pathBase}.sources[0].source.tiles[0]`, 'no source tiles').split('?')[0]
            
            if(sourceTiles !== 'no source tiles') {
              set(draft, `${pathBase}.sources[0].source.tiles[0]`, sourceTiles+`?cols=${e.target.value}`)
            }

            set(draft, `${pathBase}['choroplethdata']`, {});
            set(draft, `${pathBase}['categories']`, {});
            set(draft, `${pathBase}.${path}`, e.target.value)
          })}
        >
          {(metadata || [])
            .filter(d => {
              if(layerType === 'choropleth' && !['integer', 'number'].includes(d.type)){
                return false
              }
              return true
            })
            .filter(d => !['wkb_geometry'].includes(d.name))
            .map((col,i) => {
            return (
              <option key={i} value={col.name}>{col.display_name || col.name}</option>
            )
          })}
        </select>
      </div>
    </label>
  )
}

function ColorRangeControl({path, params={}}) {
  const { state, setState } = React.useContext(SymbologyContext);
  
  const pathBase =
    params?.version === "interactive"
      ? `symbology.layers[${state.symbology.activeLayer}]${params.pathPrefix}`
      : `symbology.layers[${state.symbology.activeLayer}]`;

  let rangeColorKey = get(state, `${pathBase}['range-key']`,colorbrewer.schemeGroups.sequential[0])
  let numbins = get(state, `${pathBase}['num-bins']`, 9)
  // console.log('select control', colorbrewer,rangeColorKey, numbins)
  let value = get(state, `${pathBase}.${path}`, colorbrewer[rangeColorKey][numbins])
  
  // console.log('value', value, path, colorbrewer)

  return (
      <div className='flex w-full items-center'>
        <ControlMenu 
          button={<div className='flex items-center w-full cursor-pointer flex-1'>
            <div className='flex-1 flex justify-center '>
              {(value.map ? value : []).map((d,i) => <div key={i} className='flex-1 h-4' style={{backgroundColor: d}} />)}
            </div>
            <div className='flex items-center px-1 border-2 border-transparent h-8  hover fill-slate-400 hover:fill-slate-800 cursor-pointer'> 
              <CaretDown  className=''/> 
            </div>
          </div>
          }
        >
          <Menu.Item className='z-20'>
            <div className='px-4 font-semibold text-sm text-slate-600'>SEQUENTIAL</div>
          </Menu.Item>
          {[
            ...colorbrewer.schemeGroups.sequential,
            ...colorbrewer.schemeGroups.singlehue
            ].map(colorKey => {
            //console.log('color', colorKey)
            return (
              <Menu.Item className='z-20' key={colorKey}>
                {({ active }) => (
                  <div className={`${active ? 'bg-blue-50 ' : ''} flex`} >
                    <div className='w-4 h-4' />
                    <div
                      className = {`flex-1 flex w-full p-2`}
                      onClick={() => setState(draft => {
                        set(draft, `${pathBase}.${path}`, colorbrewer[colorKey][numbins])
                        set(draft, `${pathBase}['range-key']`, colorKey)
                      })}
                    >
                      {colorbrewer[colorKey][numbins].map((d,i) => <div key={i} className='flex-1 h-4' style={{backgroundColor: d}} />)}
                    </div>
                  </div>
                )}
              </Menu.Item>
            )
          })}
          <Menu.Item className='z-20'>
            <div className='px-4 font-semibold text-sm text-slate-600'>Diverging</div>
          </Menu.Item>
          {colorbrewer.schemeGroups.diverging.map(colorKey => {
            return (
              <Menu.Item className='z-20' key={colorKey}>
                {({ active }) => (
                  <div className={`${active ? 'bg-blue-50 ' : ''} flex`} >
                    <div className='w-4 h-4' />
                    <div
                      className = {`flex-1 flex w-full p-2`}
                      onClick={() => setState(draft => {
                        set(draft, `${pathBase}.${path}`, colorbrewer[colorKey][numbins])
                        set(draft, `${pathBase}['range-key']`, colorKey)
                      })}
                    >
                      {colorbrewer[colorKey][numbins].map((d,i) => <div key={i} className='flex-1 h-4' style={{backgroundColor: d}} />)}
                    </div>
                  </div>
                )}
              </Menu.Item>
            )
          })}
        </ControlMenu>
      </div>
    )
}

function CategoricalColorControl({path, params={}}) {
  const { state, setState } = React.useContext(SymbologyContext);
  // console.log('select control', params)
  let colors = categoricalColors;

  const pathBase =
    params?.version === "interactive"
      ? `symbology.layers[${state.symbology.activeLayer}]${params.pathPrefix}`
      : `symbology.layers[${state.symbology.activeLayer}]`;

  let { value, categories } = useMemo(() => {
    return {
      value: get(state, `${pathBase}.${path}`, colors['cat1']),
      categories: get(state, `${pathBase}['categories']`, {}),
    }
  }, [state]);

  const replaceCategoryPaint = (oldCategories, newColors) => {
    const newLegend = oldCategories.legend.map((row, i) => {
      return { ...row, color: toHex(newColors[i]) };
    });

    const newPaint = oldCategories.paint.map((row, i) => {
      if (i < 3 || i === oldCategories.paint.length - 1) {
        return row;
      } else if (i % 2 === 1) {
        return toHex(newColors[((i + 1) / 2 - 2) % newColors.length]);
      } else {
        return row;
      }
    });
    return { paint: newPaint, legend: newLegend };
  };

  // console.log('value', value, path)
  return (
      <div className='flex w-full items-center'>
        <ControlMenu 
          button={<div className='flex items-center w-full cursor-pointer flex-1'>
            <div className='flex-1 flex justify-center '>
              {(value.map ? value : []).map((d,i) => <div key={i} className='w-4 h-4' style={{backgroundColor: d}} />)}
            </div>
            <div className='flex items-center px-1 border-2 border-transparent h-8  hover fill-slate-400 hover:fill-slate-800 cursor-pointer'> 
              <CaretDown  className=''/> 
            </div>
          </div>
          }
        >
          {Object.keys(colors).map(colorKey => {
            return (
              <Menu.Item className='z-20' key={colorKey}>
                {({ active }) => (
                  <div className={`${active ? 'bg-blue-50 ' : ''} flex`} >
                    <div className='w-4 h-4' />
                    <div
                      className = {`flex-1 flex w-full p-2`}
                      onClick={() => {
                        setState(draft => {
                          const newCategories = replaceCategoryPaint(categories, colors[colorKey]);
                          set(draft, `${pathBase}.${path}`, colors[colorKey]);
                          set(draft, `${pathBase}['categories']`, newCategories);
                        });
                      }}
                    >
                      {colors[colorKey].map((d,i) => <div key={i} className='w-4 h-4' style={{backgroundColor: d}} />)}
                    </div>
                  </div>
                )}
              </Menu.Item>
            )
          })}
        </ControlMenu>
      </div>
    )
}



function roundToNearestTen(v) {
  return Math.pow(10, Math.round(Math.log10(v)));
}

function ChoroplethControl({path, params={}}) {
  const { state, setState } = React.useContext(SymbologyContext);
  const { falcor, falcorCache, pgEnv } = React.useContext(DamaContext);
  // console.log('select control', params)
  //let colors = categoricalColors
  const pathBase =
    params?.version === "interactive"
      ? `symbology.layers[${state.symbology.activeLayer}]${params.pathPrefix}`
      : `symbology.layers[${state.symbology.activeLayer}]`;

  let { numbins, method, colorKey, legenddata, showOther, choroplethdata, isLoadingColorbreaks } = useMemo(() => {
    return {
      numbins: get(state, `${pathBase}['num-bins']`, 9),
      colorKey: get(state, `${pathBase}['range-key']`, 'seq1'),
      method: get(state, `${pathBase}['bin-method']`, 'ckmeans'),
      legenddata: get(state, `${pathBase}['legend-data']`),
      choroplethdata: get(state, `${pathBase}['choroplethdata']`, { breaks: [] }),
      showOther: get(state, `${pathBase}['category-show-other']`, '#ccc'),
      isLoadingColorbreaks: get(state, `${pathBase}['is-loading-colorbreaks']`, false)
    }
  },[state])

  const { breaks, max } = choroplethdata;
  const categories = breaks?.map((d,i) => {
    return {color: legenddata[i].color, label: `${breaks[i]} - ${breaks[i+1] || max}`}
  })
  .filter(d => d);

  const isShowOtherEnabled = showOther === '#ccc'

  /**
   * categories[0] is breaks[0] to breaks[1]
   * categories[n-1] (last element) is breaks[n-1] to max
   * minimum value of non-first break, is the value of the prior break + 1
   * max value of non-last break, is the value of the next break - 1
   */
  const rangeInputs = categories?.map((category, catIndex) => {
    return (
      <div key={`range_input_${catIndex}`}>
        <div
          key={catIndex}
          className="w-full flex items-center hover:bg-slate-100 cursor-auto"
        >
          <div className="flex items-center h-8 w-8 justify-center  border-r border-b ">
            <div
              className="w-4 h-4 rounded border-[0.5px] border-slate-600"
              style={{ backgroundColor: category.color }}
            />
          </div>
          <div className="flex items-center justify-between text-center flex-1 px-2 text-slate-600 border-b h-8 truncate overflow-auto w-full">
            <div className='px-2 w-[10px]'>
              {
                catIndex !== 0 && 
                  <i 
                    className="fa-solid fa-chevron-left cursor-pointer hover:text-pink-700"
                    onClick={() => {
                      console.log("move lower bound for range::", category.label);
                      setState((draft) => {
                        const minBreakValue = breaks[catIndex-1] + 1;
                        const newBreaks = [...breaks];
                        newBreaks[catIndex] = catIndex !== 0 ? Math.max(newBreaks[catIndex] - roundToNearestTen(newBreaks[catIndex]/10), minBreakValue) : newBreaks[catIndex] - roundToNearestTen(newBreaks[catIndex]/10);
                        set(draft, `${pathBase}['choroplethdata']['breaks']`, newBreaks)
                      })
                    }}
                  />
              }
            </div>
            {category.label}
            <div className='px-2 w-[10px]'>
              {
                catIndex !== categories.length-1 && 
                  <i 
                    className="fa-solid fa-chevron-right cursor-pointer hover:text-pink-700"
                    onClick={() => {
                      console.log("move upper bound for range::", category.label);
                      setState((draft) => {
                        const newBreaks = [...breaks];
                        if(catIndex !== categories.length-1){
                          const maxBreakValue = catIndex === categories.length-2 ? max - 1 : breaks[catIndex+2] - 1;
                          newBreaks[catIndex+1] = Math.min(newBreaks[catIndex+1] + roundToNearestTen(newBreaks[catIndex+1]/10), maxBreakValue);
                          set(draft, `${pathBase}['choroplethdata']['breaks']`, newBreaks)
                        }
                        else {
                          //adjust max
                          const newMax = max + roundToNearestTen(max/10);
                          set(draft, `${pathBase}['choroplethdata']['max']`, newMax)
                        }
                      })
                    }}
                  />
              }
            </div>
          </div>
        </div>
      </div>
    );
  });
  
  return (
      <div className=' w-full items-center'>
        <div className='flex items-center'>
          <div className='text-sm text-slate-400 px-2'>Showing</div>
          <div className='border border-transparent hover:border-slate-200 m-1 rounded '>
            <select
              className='w-full p-2 bg-transparent text-slate-700 text-sm'
              value={numbins}
              onChange={(e) => setState(draft => {
                // console.log('SelectViewColumnControl set column path', path, e.target.value)
                set(draft, `${pathBase}.['num-bins']`, e.target.value)
                set(draft, `${pathBase}.['choroplethdata']`, {});
                set(draft, `${pathBase}.['color-range']`, colorbrewer[colorKey][e.target.value])
              })}
            >
              {(Object.keys(colorbrewer[colorKey]) || [])
                .map((val,i) => {
                  return (
                    <option key={i} value={val}>{val}</option>
                  )
              })}
            </select>
          </div>
        </div>
        <div className='flex items-center'>
          <div className='text-sm text-slate-400 px-2'>Method</div>
          <div className='border border-transparent hover:border-slate-200 m-1 rounded '>
            <select
              className='w-full p-2 bg-transparent text-slate-700 text-sm'
              value={method}
              onChange={(e) => setState(draft => {
                set(draft, `${pathBase}.['choroplethdata']`, {});
                set(draft, `${pathBase}['bin-method']`, e.target.value)
              })}
            >
              <option  value={'ckmeans'}>ck-means</option>
              <option  value={'pretty'}>Pretty Breaks</option>
              <option  value={'equalInterval'}>Equal Interval</option>
             
            </select>
          </div>
        </div>
        <div className='flex items-center pb-2'>
          <div className='text-sm text-slate-400 px-2'>Show missing data</div>
          <div className='flex items-center'>
            <Switch
              checked={isShowOtherEnabled}
              onChange={()=>{
                setState(draft=> {
                  const update = isShowOtherEnabled ? 'rgba(0,0,0,0)' : '#ccc';
                  set(draft, `${pathBase}['category-show-other']`,update)
                })
              }}
              className={`${
                isShowOtherEnabled ? 'bg-blue-500' : 'bg-gray-200'
              } relative inline-flex h-4 w-8 items-center rounded-full `}
            >
              <span className="sr-only">Show other</span>
              <div
                className={`${
                  isShowOtherEnabled ? 'translate-x-5' : 'translate-x-0'
                } inline-block h-4 w-4  transform rounded-full bg-white transition border-[0.5] border-slate-600`}
              />
            </Switch>

          </div>

        </div>
        <div className='w-full max-h-[250px] overflow-auto'>
          {
            isLoadingColorbreaks ?  (
                <div className="flex w-full justify-center overflow-hidden pb-2" >
                  Creating scale...
                  <span style={ { fontSize: "1.5rem" } } className={ `ml-2 fa-solid fa-spinner fa-spin` }/> 
                </div>
              ) : rangeInputs
          }
          {isShowOtherEnabled && <div className='w-full flex items-center hover:bg-slate-100'>
            <div className='flex items-center h-8 w-8 justify-center  border-r border-b '>
              <div className='w-4 h-4 rounded border-[0.5px] border-slate-600' style={{backgroundColor: showOther }}/>
            </div>
            <div className='flex items-center text-center flex-1 px-4 text-slate-600 border-b h-8 truncate'>No data</div>
            </div>
          }
        </div>
      </div>
    )
}

function InteractiveFilterControl({ path, params = {} }) {
  const { state, setState } = React.useContext(SymbologyContext);
  const { value: interactiveFilters, selectedInteractiveFilterIndex, layerName } = useMemo(() => {
    return {
      value: get(
        state,
        `symbology.layers[${state.symbology.activeLayer}].${path}`,
        []
      ),
      selectedInteractiveFilterIndex: get(
        state,
        `symbology.layers[${state.symbology.activeLayer}]['selectedInteractiveFilterIndex']`
      ),
      layerName: get(
        state,
        `symbology.layers[${state.symbology.activeLayer}]['name']`,
        ''
      ),
    };
  }, [state]);

  useEffect(() => {
    if(selectedInteractiveFilterIndex !== undefined && !interactiveFilters[selectedInteractiveFilterIndex]){
      setState(draft => {
        set(draft, `symbology.layers[${state.symbology.activeLayer}]['selectedInteractiveFilterIndex']`, undefined)
      })
    }
  }, [interactiveFilters])

  const shouldDisplayInteractiveBuilder = selectedInteractiveFilterIndex !== undefined && selectedInteractiveFilterIndex !== null;
  return (
    <div className=" w-full items-center">
      <Button
        themeOptions={{ size: "xs", color: 'primary' }}
        className={"col-span-2 capitalize mb-2"}
        onClick={() => {
          setState(draft => {
            //TODO better way of defaulting some values
            const newInteractiveFilter = {
              "label": `${layerName} simple`,
              "layer-type": 'simple',
              paint : {
                'line-color': "#fff",
                'line-width': 3
              }
            }

            set(draft,`symbology.layers[${state.symbology.activeLayer}].${path}`, [...interactiveFilters, newInteractiveFilter] )
          })

        }}
      >
        Add interactive filter
      </Button>
      {
        interactiveFilters.map((iFilter,i) => {
          const isSelectedFilter = selectedInteractiveFilterIndex === i;
          return (
            <div
              key={`ifilter_row_${i}`}
              className={`group/title w-full text-sm grid grid-cols-12 items-center  mb-2 ${isSelectedFilter && 'bg-blue-100'}`}
            >
              <div
                className="truncate col-span-1 flex justify-center items-center"
              >
                <input
                  type="radio"
                  checked={isSelectedFilter}
                  onChange={() => {
                    setState(draft => {
                      set(draft, `symbology.layers[${state.symbology.activeLayer}]['selectedInteractiveFilterIndex']`, i)
                    })
                  }}
                />
              </div>  
              <div className="truncate col-span-10">
                <input
                  type="text"
                  className=" px-2  border text-sm border-transparent hover:border-slate-200 outline-2 outline-transparent rounded-md bg-transparent text-slate-700 placeholder:text-gray-400 focus:outline-pink-300 sm:leading-6"
                  value={iFilter.label}
                  onChange={(e) => {
                    setState(draft => {
                      set(draft,`symbology.layers[${state.symbology.activeLayer}].${path}[${i}]['label']`, e.target.value )
                    })
                  }}
                />
              </div>
              <div
                className="col-span-1 flex items-center cursor-pointer fill-black group-hover/title:fill-slate-300 hover:bg-slate-100 rounded group/icon p-0.5"
                onClick={() => {
                  setState(draft => {
                    const oldInteractiveFilters = get(
                      draft,
                      `symbology.layers[${state.symbology.activeLayer}].${path}`
                    )
                    oldInteractiveFilters.splice(i,1);
                    set(draft,`symbology.layers[${state.symbology.activeLayer}].${path}`, oldInteractiveFilters )
                  })
                }}
              >
                <Close
                  size={20}
                  className="m-0.5 cursor-pointer group-hover/icon:fill-slate-500 "
                />
              </div>
            </div>
          )
        })
      }
      {
        shouldDisplayInteractiveBuilder && <InteractiveFilterbuilder />
      }
    </div>
  );
}

export const InteractiveFilterbuilder = () => {
  const { state, setState } = React.useContext(SymbologyContext);
  const { interactiveFilters, selectedInteractiveFilterIndex } = useMemo(() => {
    return {
      interactiveFilters: get(
        state,
        `symbology.layers[${state.symbology.activeLayer}]['interactive-filters']`,
        []
      ),
      selectedInteractiveFilterIndex: get(
        state,
        `symbology.layers[${state.symbology.activeLayer}]['selectedInteractiveFilterIndex']`,
        []
      ),
    };
  }, [state]);
  return (
    <>
      Editing {interactiveFilters[selectedInteractiveFilterIndex]?.label}
      <StyleEditor
        type={"interactive"}
        pathPrefix={`['interactive-filters'][${selectedInteractiveFilterIndex}]`}
      />
    </>
  );
};


//RYAN TODO -- make sure this doesn't blow up somehow with new Interactive Filters
export const AddColumnSelectControl = ({setState, availableColumnNames}) => {
  return (
    <>
      <div className='text-slate-500 text-[14px] tracking-wide min-h-[32px] flex items-center ml-4'>
          Add Column
      </div>
      <div className="flex-1 flex items-center mx-4">
        <StyledControl>
        <label className='flex w-full'>
            <div className='flex w-full items-center'>
              <select
                className='w-full py-2 bg-transparent'
                value={''}
                onChange={(e) =>
                  setState(e.target.value)
                }
              >
                <option key={-1} value={""}></option>
                {(availableColumnNames || []).map((opt, i) => (
                  <option key={i} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </label>
        </StyledControl>
      </div>
    </>
  )
}

export const controlTypes = {
  'color': ColorControl,
  'categoricalColor': CategoricalColorControl,
  'rangeColor': ColorRangeControl,
  'categoryControl': CategoryControl,
  'choroplethControl':ChoroplethControl, 
  'interactiveFilterControl': InteractiveFilterControl,
  'range': RangeControl,
  'simple': SimpleControl,
  'select': SelectControl,
  'selectType': SelectTypeControl,
  'selectViewColumn': SelectViewColumnControl
}
