import React, { useMemo, useContext, Fragment } from 'react'
import { SymbologyContext } from '../../'
import { DamaContext } from "../../../store"
import { Fill, Line, Eye, EyeClosed, MenuDots , CaretDown, CaretDownSolid, CaretUpSolid, CircleInfoI } from '../icons'
import get from 'lodash/get'
import set from 'lodash/get'
import { LayerMenu, LayerInfo } from './LayerPanel'
import { SourceAttributes, ViewAttributes, getAttributes } from "../../../Source/attributes"
import { Menu, Transition, Tab, Dialog } from '@headlessui/react'
import { fnumIndex } from '../LayerEditor/datamaps'

function VisibilityButton ({layer}) {
  const { state, setState  } = React.useContext(SymbologyContext);
  const { activeLayer } = state.symbology;
  const visible = layer.isVisible
  const onClick = () => {
    setState(draft => {
      draft.symbology.layers[layer.id].isVisible = !draft.symbology.layers[layer.id].isVisible
      draft.symbology.layers[layer.id].layers.forEach((d,i) => {
        let val = get(state, `symbology.layers[${layer.id}].layers[${i}].layout.visibility`,'') 
        let update = val === 'visible' ? 'none' : 'visible'
        draft.symbology.layers[layer.id].layers[i].layout =  { "visibility": update }
      })
    })
  }
  return (
    <>
      {visible ? 
        <Eye
          onClick={onClick}
          className={` ${activeLayer == layer.id ? 'fill-pink-100' : 'fill-white'} pt-[2px] cursor-pointer group-hover:fill-gray-400 group-hover:hover:fill-pink-700`}
        /> : 
        <EyeClosed
          onClick={onClick}
          className={` ${activeLayer == layer.id ? 'fill-pink-100' : 'fill-white'} pt-[2px] cursor-pointer group-hover:fill-gray-400 group-hover:hover:fill-pink-700`}
        />
      }
    </>
  )
}

const typeSymbols = {
  'fill': ({layer,color}) => {
      //let color = get(layer, `layers[1].paint['fill-color']`, '#ccc')
      return (
        <div className='pr-2'>
          <div className={'w-4 h-4 rounded '} style={{backgroundColor:color}} />
        </div>
      )
  },
  'circle': ({layer,color}) => {
      //let color = get(layer, `layers[0].paint['circle-color']`, '#ccc')
      let borderColor = get(layer, `layers[0].paint['circle-stroke-color']`, '#ccc')
      return (
        <div className='pl-0.5 pr-2'>
          <div className={'w-3 h-3 rounded-full '} style={{backgroundColor:color, borderColor}} />
        </div>
      )
  },
  'line': ({layer, color}) => {
      return (
        <div className='pr-2'>
          <div className={'w-4 h-1'} style={{backgroundColor:color}} />
        </div>
      )
  }
}

const typePaint = {
  'fill': (layer) => {

    return  get(layer, `layers[1].paint['fill-color']`, '#ccc')
  },
  'circle': (layer) => {
    return  get(layer, `layers[0].paint['circle-color']`, '#ccc')
      
  },
  'line': (layer) => {
    return get(layer, `layers[1].paint['line-color']`, '#ccc')
  }
}

function InteractiveLegend({ layer, toggleSymbology }) {
  const { state, setState } = React.useContext(SymbologyContext);

  let { interactiveFilters } = useMemo(() => {
    return {
      interactiveFilters: get(layer, `['interactive-filters']`, []),
    };
  }, [layer]);

  const selectedInteractiveFilterIndex = layer?.selectedInteractiveFilterIndex;
  const activeFilterLayerType = layer?.['interactive-filters']?.[selectedInteractiveFilterIndex]?.['layer-type'];
  return (
    <div
      className="w-full max-h-[350px] overflow-x-auto scrollbar-sm"
    >
      {activeFilterLayerType === 'categories' && <CategoryLegend layer={layer} toggleSymbology={toggleSymbology}/>}
      {activeFilterLayerType === 'choropleth' && <StepLegend layer={layer} toggleSymbology={toggleSymbology}/>}
      {activeFilterLayerType === 'circles' && (<CircleLegend layer={layer} toggleSymbology={toggleSymbology} />)}
    </div>
  );
}

function CategoryLegend({ layer, toggleSymbology }) {
  const Symbol = typeSymbols[layer.type] || typeSymbols['fill']
  let  legenddata = layer?.['legend-data'] || []
  if(!legenddata || legenddata.length === 0 ) {
    legenddata = []
  }
  return (
    <div
      className='w-full max-h-[250px] overflow-x-auto'
      onClick={toggleSymbology}
    >
      {legenddata.map((d,i) => (
        <div key={i} className='w-full flex items-center hover:bg-pink-50'>
          <div className='flex items-center h-6 w-10 justify-center  '>
            <Symbol color={d.color} />
          </div>
          <div className='flex items-center text-center flex-1 px-4 text-slate-500 h-6 text-sm truncate'>{d.label}</div>
        </div> 
      ))}
    </div>
  )
}

function CircleLegend({ layer, toggleSymbology }) {
 // console.log("CircleLegend", layer);
  let { minRadius, maxRadius, lowerBound, upperBound, isLoadingColorbreaks, dataColumn } = useMemo(() => {
    return {
      isLoadingColorbreaks: get(layer, `['is-loading-colorbreaks']`, false),
      minRadius: get(layer,`['min-radius']`, 8),
      maxRadius: get(layer,`['max-radius']`, 128),
      lowerBound: get(layer,`['lower-bound']`, null),
      upperBound: get(layer,`['upper-bound']`, null),
      dataColumn: get(layer, `['data-column']`, null)
    };
  }, [layer]);
  if (isLoadingColorbreaks) {
    return (
      <div className="w-full max-h-[250px] overflow-x-auto scrollbar-sm">
        <div className="flex w-full justify-center overflow-hidden pb-2">
          Creating legend...
          <span
            style={{ fontSize: "1.5rem" }}
            className={`ml-2 fa-solid fa-spinner fa-spin`}
          />
        </div>
      </div>
    );
  }
  return (
    <div
      className="w-[100%] text-sm max-h-[250px] overflow-x-auto scrollbar-sm px-4"
      onClick={toggleSymbology}
    >
      <div className="w-[33%] text-sm max-h-[250px] overflow-x-auto scrollbar-sm px-4">
        <div className="flex w-full justify-between">
          <div>{minRadius}px</div>
          <div>{maxRadius}px</div>
        </div>
        <div className="ml-8">
          <i
            class="fa-solid fa-arrow-right-long"
            style={{ transform: "scaleX(3)" }}
          ></i>
        </div>
        <div className="flex w-full justify-between">
          <div>{fnumIndex(lowerBound)}</div>
          <div>{fnumIndex(upperBound)}</div>
        </div>
      </div>
      <div>{dataColumn}</div>
    </div>
  );
}

function StepLegend({ layer, toggleSymbology }) {
  //console.log('StepLegend', layer)
  const { state, setState  } = React.useContext(SymbologyContext);
  let { legenddata, isLoadingColorbreaks } = useMemo(() => {
    return {
      legenddata : get(layer, `['legend-data']`, []),
      isLoadingColorbreaks: get(layer, `['is-loading-colorbreaks']`, false)
    }
  },[state]);
  const Symbol = typeSymbols[layer.type] || typeSymbols['fill']``

  if(isLoadingColorbreaks){
    return (
      <div className='w-full max-h-[250px] overflow-x-auto scrollbar-sm'>
        <div className="flex w-full justify-center overflow-hidden pb-2" >
          Creating legend...
          <span style={ { fontSize: "1.5rem" } } className={ `ml-2 fa-solid fa-spinner fa-spin` }/> 
        </div>
      </div>
    )
  }

  return (
    <div
      className='w-full max-h-[250px] overflow-x-auto scrollbar-sm'
      onClick={toggleSymbology}
    >
      {legenddata.map((d,i) => (
        <div key={i} className='w-full flex items-center hover:bg-pink-50'>
          <div className='flex items-center h-6 w-10 justify-center  '>
            <Symbol color={d.color} />
          </div>
          <div className='flex items-center text-center flex-1 px-4 text-slate-500 h-6 text-sm truncate'>{d.label}</div>
        </div> 
      ))}
    </div>
  )
}

function HorizontalLegend({ layer, toggleSymbology }) {
  const { state, setState  } = React.useContext(SymbologyContext);
  let { legenddata, isLoadingColorbreaks, showOther } = useMemo(() => {
    return {
      legenddata : get(layer, `['legend-data']`, []),
      isLoadingColorbreaks: get(layer, `['is-loading-colorbreaks']`, false),
      showOther: get(layer, `['category-show-other']`, '#ccc')
    }
  },[state]);
  const isShowOtherEnabled = showOther === '#ccc'

  if(isLoadingColorbreaks){
    return (
      <div className='w-full max-h-[250px] overflow-x-auto scrollbar-sm'>
        <div className="flex w-full justify-center overflow-hidden pb-2" >
          Creating legend...
          <span style={ { fontSize: "1.5rem" } } className={ `ml-2 fa-solid fa-spinner fa-spin` }/> 
        </div>
      </div>
    )
  }

  return (
    <div
      className="w-full max-h-[350px] overflow-x-auto scrollbar-sm"
      onClick={toggleSymbology}
    >
      <div
        className={`flex-1 flex w-full p-2`}
      >
        {legenddata.map((d, i) => (
          <div className="flex-1 h-6" key={`horizontal_legend_item_${i}`}>
            <div className='flex justify-self-end text-xs h-4'>
              { isShowOtherEnabled && i === legenddata.length-1 ? 'N/A' : legenddata[i].label}
            </div>

            <div
              key={i}
              className="flex-1 h-2"
              style={{ backgroundColor: d.color }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function LegendRow ({ layer, i, numLayers, onRowMove }) {
  const { state, setState  } = React.useContext(SymbologyContext);
  const { falcor, falcorCache, pgEnv, baseUrl } = useContext(DamaContext);
  const { activeLayer } = state.symbology;

  let { layerType: type, legendOrientation,  selectedInteractiveFilterIndex, interactiveFilters, dataColumn, filterGroup, filterGroupLegendColumn,filterGroupName, viewGroup, viewGroupName, sourceId, dynamicFilters } = useMemo(() => {
    return {
      initialViewId: get(layer,`initial-view-id`),
      sourceId: get(layer,`source_id`),
      legendOrientation: get(layer, `['legend-orientation']`, 'vertical'),
      layerType : get(layer, `['layer-type']`),
      selectedInteractiveFilterIndex: get(layer, `['selectedInteractiveFilterIndex']`),
      interactiveFilters: get(layer, `['interactive-filters']`, []),
      dataColumn: get(layer, `['data-column']`, []),
      filterGroup: get(layer, `['filter-group']`, []),
      filterGroupName: get(layer, `['filter-group-name']`, ''),
      filterGroupLegendColumn: get(layer, `['filter-group-legend-column']`, ''),
      viewGroup: get(layer, `['filter-source-views']`, []),
      viewGroupName: get(layer, `['view-group-name']`, ''),
      dynamicFilters:get(layer, `['dynamic-filters']`, []),
    }
  },[state, layer]);
  const toggleSymbology = () => {
    setState(draft => {
        draft.symbology.activeLayer = activeLayer === layer.id ? '' : layer.id
    })
  }
  const shouldDisplayColorSquare =
    type === "simple" ||
    (type === "interactive" &&
      interactiveFilters?.[selectedInteractiveFilterIndex]?.["layer-type"] ===
        "simple") ||
    !type;
  const Symbol = typeSymbols[layer.type] || typeSymbols['fill']
  let paintValue = typePaint?.[layer?.type] ? typePaint?.[layer?.type](layer) : '#fff'
  const layerTitle = layer.name ?? filterGroupName;
  const layerSource = useMemo(
    () => get(falcorCache, ["dama", pgEnv, "sources", "byId", sourceId], {}),
    [sourceId, falcorCache]
  );

  const legendTitle = (
    <div className='flex justify-between items-center justify w-full' onClick={toggleSymbology} >
      {shouldDisplayColorSquare && <div className='pl-1 flex'><Symbol layer={layer} color={paintValue}/>{layerTitle}</div>}
      {!shouldDisplayColorSquare && layerTitle}
      <div className='flex'>
        <div className='text-sm pt-1  flex items-center'>
          <LayerInfo
            source={layerSource}
            layer={layer}
            baseUrl={baseUrl}
            button={<CircleInfoI size={16} className={` ${activeLayer == layer.id ? 'fill-pink-100' : 'fill-white'} collapse group-hover:visible pb-[2px] cursor-pointer group-hover:fill-gray-400 group-hover:hover:fill-pink-700`}/>}
          />
        </div>
        <div className='text-sm pt-1  flex items-center'>
          <LayerMenu 
            layer={layer}
            button={<MenuDots className={` ${activeLayer == layer.id ? 'fill-pink-100' : 'fill-white'} pb-[2px] cursor-pointer group-hover:fill-gray-400 group-hover:hover:fill-pink-700`}/>}
          />
        </div>
        <CaretUpSolid
          onClick={() => {
            onRowMove(i, i-1)
          }}
          size={24}
          className={`${i === 0 ? 'pointer-events-none' : ''} mr-[-6px] ${activeLayer == layer.id ? 'fill-pink-100' : 'fill-white'}  pt-[2px] cursor-pointer group-hover:fill-gray-400 group-hover:hover:fill-pink-700`} 
        />
        <CaretDownSolid
          onClick={ () => {
            onRowMove(i, i+1)
          }}
          size={24}
          className={`${i === numLayers-1 ? 'pointer-events-none' : ''} mr-[-3px] ${activeLayer == layer.id ? 'fill-pink-100' : 'fill-white'} pb-[2px] cursor-pointer group-hover:fill-gray-400 group-hover:hover:fill-pink-700`}
        />
        <VisibilityButton layer={layer}/>
      </div>
    </div>
  );

  //----------------------------------
  // -- get selected source views
  // ---------------------------------
  React.useEffect(() => {
    async function fetchData() {
      //console.time("fetch data");
      const lengthPath = ["dama", pgEnv, "sources", "byId", sourceId, "views", "length"];
      const resp = await falcor.get(lengthPath);
      return await falcor.get([
        "dama", pgEnv, "sources", "byId", sourceId, "views", "byIndex",
        { from: 0, to: get(resp.json, lengthPath, 0) - 1 },
        "attributes", Object.values(ViewAttributes)
      ]);
    }
    if(sourceId) {
      fetchData();
    }
  }, [sourceId, falcor, pgEnv]);

  const views = React.useMemo(() => {
    return Object.values(get(falcorCache, ["dama", pgEnv, "sources", "byId", sourceId, "views", "byIndex"], {}))
      .map(v => getAttributes(get(falcorCache, v.value, { "attributes": {} })["attributes"]));
  }, [falcorCache, sourceId, pgEnv]);

  const groupSelectorElements = [];
  if (type === "interactive") {
    groupSelectorElements.push(
      <div
        key={`symbrow_${layer.id}_interactive`}
        className="text-slate-600 font-medium truncate flex-1"
      >
        <div className='text-xs text-black'>Filters:</div>
        <div className="rounded-md h-[36px] pl-0 flex w-full w-[216px] items-center border border-transparent cursor-pointer hover:border-slate-300">
          <select
            className="w-full bg-transparent"
            value={selectedInteractiveFilterIndex}
            onChange={(e) => {
              setState((draft) => {
                draft.symbology.layers[
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
    )
  } 
  if(layer.filterGroupEnabled) {
    groupSelectorElements.push(
      <div
        key={`symbrow_${layer.id}_filtergroup`}
        className="text-slate-600 font-medium truncate flex-1 items-center"
      >
        <div className='text-xs text-black'>{filterGroupName}:</div>
        <div className="rounded-md h-[36px] pl-0 flex w-full w-[216px] items-center border border-transparent cursor-pointer hover:border-slate-300">
          <select
            className="w-full bg-transparent"
            value={dataColumn}
            onChange={(e) => {
              setState((draft) => {
                if(type === 'interactive'){
                  draft.symbology.layers[layer.id]['interactive-filters'][selectedInteractiveFilterIndex]["data-column"] = e.target.value

                  if(draft.symbology.layers[layer.id]['interactive-filters'][selectedInteractiveFilterIndex]['layer-type'] === 'categories') {
                    draft.symbology.layers[layer.id]['interactive-filters'][selectedInteractiveFilterIndex]['categories'] = {};
                  }
                } else {
                  draft.symbology.layers[layer.id]["data-column"] = e.target.value

                  if(type === 'categories') {
                    draft.symbology.layers[layer.id]['categories'] = {};
                  }
                }
              });
            }}
          >
            {filterGroup.map((gFilter, i) => {
              const itemSuffix =
                filterGroupLegendColumn === gFilter.column_name
                  ? "**"
                  : !!filterGroupLegendColumn
                  ? ` (${filterGroupLegendColumn})`
                  : "";
              return (
                <option key={i} value={gFilter.column_name}>
                  {gFilter.display_name} {itemSuffix}
                </option>
              );
            })}
          </select>
        </div>
      </div>
    );
  }
  if(layer.viewGroupEnabled) {
    groupSelectorElements.push(
      <div
        key={`symbrow_${layer.id}_viewgroup`}
        className="text-slate-600 font-medium truncate flex-1 items-center"
      >
        <div className='text-xs text-black'>{viewGroupName}: </div>
        <div className="rounded-md h-[36px] pl-0 flex w-full w-[216px] items-center border border-transparent cursor-pointer hover:border-slate-300">
          <select
            className="w-full bg-transparent"
            value={layer.view_id}
            onChange={(e) => {
              setState((draft) => {
                //draft.symbology.layers[layer.id].layers[0].source
                //draft.symbology.layers[layer.id].layers[0].source-layer
                //draft.symbology.layers[layer.id].layers[1].source
                //draft.symbology.layers[layer.id].layers[1].source-layer
                const newLayer = JSON.parse(
                  JSON.stringify(draft.symbology.layers[layer.id].layers).replaceAll(
                    layer.view_id,
                    e.target.value
                  )
                );
                draft.symbology.layers[layer.id].layers = newLayer;

                //sources[0].id
                //sources[0].source.tiles
                const newSources = JSON.parse(
                  JSON.stringify(
                    draft.symbology.layers[layer.id].sources
                  ).replaceAll(layer.view_id, e.target.value)
                );
                draft.symbology.layers[layer.id].sources = newSources;

                draft.symbology.layers[layer.id].view_id = e.target.value
              });
            }}
          >
            {viewGroup.map((view_id, i) => {
              const curView = views.find((v) => v.view_id === view_id);
              return (
                <option key={i} value={view_id}>
                  {curView?.version ?? curView?.view_id}
                </option>
              );
            })}
          </select>
        </div>
      </div>
    );
  }
  if(dynamicFilters.length > 0) {
    groupSelectorElements.push(<DynamicFilter key={`${layer.id}_dynamic_filter`} layer={layer}/>)
  }
  return (
    <div
      className={`${
        activeLayer == layer.id ? "bg-pink-100" : ""
      } hover:border-pink-500 group border`}
    >
      <div
        className={`w-full pl-2 pt-1 pb-0 flex border-blue-50/50 border justify-between items-center ${
          type === "interactive" && !shouldDisplayColorSquare ? "pl-[3px]" : ""
        }`}
      >
        <div className="text-sm mr-1 flex flex-col justify-start align-start content-start flex-wrap w-full">
          {legendTitle}
          {groupSelectorElements}
        </div>
      </div>
      {
        legendOrientation !== "none" && (
          legendOrientation === "horizontal" ? (
            <HorizontalLegend layer={layer} toggleSymbology={toggleSymbology} />
          ) : (
            <>
              {type === "categories" && (
                <CategoryLegend layer={layer} toggleSymbology={toggleSymbology} />
              )}
              {type === 'circles' && (
                  <CircleLegend layer={layer} toggleSymbology={toggleSymbology} />
              )}
              {(type === "choropleth") && (
                <StepLegend layer={layer} toggleSymbology={toggleSymbology} />
              )}
              {type === "interactive" && (
                <InteractiveLegend
                  layer={layer}
                  toggleSymbology={toggleSymbology}
                />
              )}
            </>
          )
        )
      }
    </div>
  );
}

function LegendPanel (props) {
  const { state, setState  } = React.useContext(SymbologyContext);
  const layers = useMemo(() => state.symbology?.layers ||  {}, [state])
  //console.log('layers', layers)
  
  const droppedSection = React.useCallback((start, end) => {
    setState(draft => {
      const sections = Object.values(draft.symbology.layers);
      sections.sort((a,b) => b.order - a.order)
      const [item] = sections.splice(start, 1);
      sections.splice(end, 0, item);
      sections.reverse().forEach((item, i) => {
        item.order = i
      })
      draft.symbology.layers = sections.reverse()
        .reduce((out,sec) => {
          out[sec.id] = sec;
          return out 
        },{})
    });
  }, []);

  const numLayers = useMemo(() => {
    return Object.values(layers).length;
  }, [layers]);
  return (
    <>     
      {/* ------ Legend Pane ----------- */}
      <div className='min-h-20 relative max-h-[calc(100vh_-_220px)] scrollbar-sm '>
        {Object.values(layers)
          .sort((a,b) => b.order - a.order)
          .map((layer,i) => <LegendRow key={layer.id} layer={layer} i={i} numLayers={numLayers} onRowMove={droppedSection}/>)}
      </div>
    </>
  )
}

const DynamicFilter = ({layer}) => {
  const { state, setState  } = React.useContext(SymbologyContext);
  const { falcor, falcorCache, pgEnv } = useContext(DamaContext);
  let { layerType, dynamicFilters, viewId } = useMemo(() => {
    return {
      viewId:get(layer,`view_id`),
      layerType : get(layer, `['layer-type']`),
      dynamicFilters:get(layer, `['dynamic-filters']`, []),
    }
  },[state, layer]);

  const selectedColumnNames = dynamicFilters?.map(dynamicF => dynamicF.column_name);

  React.useEffect(() => {
    if(selectedColumnNames.length > 0) {
      selectedColumnNames.forEach(colName => {
        const options = JSON.stringify({
          groupBy: [(colName).split('AS ')[0]],
          exclude: {[(colName).split('AS ')[0]]: ['null']},
          orderBy: {"2": 'desc'}
        })
        falcor.get([
          'dama',pgEnv,'viewsbyId', viewId, 'options', options, 'databyIndex', { from: 0, to: 200},[colName, 'count(1)::int as count']
        ]) 
      })
    }
  },[selectedColumnNames, layerType, viewId]);
  return (
    <div className="flex my-2 flex-col">
      <b>Dynamic Filters:</b>
      {
        dynamicFilters.map((dFilter, i) => {
          const colName  = dFilter.column_name;
          const options = JSON.stringify({
            groupBy: [(colName).split('AS ')[0]],
            exclude: {[(colName).split('AS ')[0]]: ['null']},
            orderBy: {"2": 'desc'}
          })
          const sampleData =  Object.values(
            get(falcorCache, [
              'dama',pgEnv,'viewsbyId', viewId, 'options', options, 'databyIndex'], [])
          ).map(v =>  v?.[colName]).filter(val => typeof val !== "object");

          sampleData.sort();
          return (
            <div key={`${colName}_${i}_legend_filter_option_row`} className='w-full'>
              <DynamicFilterControl
                layer={layer}
                filterIndex={i}
                sampleData={sampleData}
                button={
                  <div className='flex w-full p-1 pl-0 rounded items-center justify-between border-transparent border hover:border-gray-300'>{dFilter.display_name} <CaretDown  className=''/> </div>
                } 
              />
            </div> 
          )
        })
      }
    </div>
  )
}



function DynamicFilterControl({button, layer, sampleData, filterIndex}) {
  const { state, setState  } = React.useContext(SymbologyContext);

  const {filterValues} = useMemo(() => {
    return {
      filterValues:get(layer, `['dynamic-filters'][${filterIndex}].values`, []),
    }
  }, [state, filterIndex])
  return (
    <Menu as="div" className="relative inline-block text-left w-full">
      <Menu.Button as="div">{button}</Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          anchor="right"
          className="absolute w-48 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none"
        >
          <div className=" p-2 max-h-[250px] overflow-auto ">
            {sampleData.map((datum) => {
              return (
                <Menu.Item key={`menu_item_${datum}`}>
                  {({ active }) => (
                    <div
                      className={`${
                        active ? "bg-pink-50 " : ""
                      } group flex w-full items-center rounded-md px-1 py-1 text-sm`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={filterValues.includes(datum)}
                        onChange={(e) => {
                          if (filterValues.includes(datum)) {
                            setState((draft) => {
                              draft.symbology.layers[layer.id][
                                "dynamic-filters"
                              ][filterIndex].values = filterValues.filter(
                                (val) => val !== datum
                              );
                            });
                          } else {
                            const newValues = [...filterValues];
                            newValues.push(datum);

                            setState((draft) => {
                              console.log(
                                JSON.parse(
                                  JSON.stringify(
                                    draft.symbology.layers[layer.id]
                                  )
                                )
                              );
                              draft.symbology.layers[layer.id][
                                "dynamic-filters"
                              ][filterIndex].values = newValues;
                            });
                          }
                        }}
                      />
                      <div className="truncate flex items-center text-[15px] px-4 py-1">
                        {datum}
                      </div>
                    </div>
                  )}
                </Menu.Item>
              );
            })}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
} 
export default LegendPanel