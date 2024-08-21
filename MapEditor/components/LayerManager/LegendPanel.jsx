import React, { useMemo } from 'react'
import { SymbologyContext } from '../../'
import { Fill, Line, Circle, Eye, EyeClosed, MenuDots , CaretDownSolid, CaretUpSolid, SquareMinusSolid, SquarePlusSolid} from '../icons'
import get from 'lodash/get'
import set from 'lodash/get'
import {LayerMenu} from './LayerPanel'


function VisibilityButton ({layer}) {
  const { state, setState  } = React.useContext(SymbologyContext);
  const { activeLayer } = state.symbology;
  const visible = layer.isVisible

  return (
    <div onClick={() => {
        setState(draft => {
          draft.symbology.layers[layer.id].isVisible = !draft.symbology.layers[layer.id].isVisible
          draft.symbology.layers[layer.id].layers.forEach((d,i) => {
            let val = get(state, `symbology.layers[${layer.id}].layers[${i}].layout.visibility`,'') 
            let update = val === 'visible' ? 'none' : 'visible'
            draft.symbology.layers[layer.id].layers[i].layout =  { "visibility": update }
          })
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
  )
}

function ToggleInteractiveFilterList({
  layer,
  isListVisible,
  setIsListVisible,
}) {
  const { state, setState } = React.useContext(SymbologyContext);
  const { activeLayer } = state.symbology;

  return (
    <div
      onClick={() => {
        setIsListVisible(!isListVisible);
      }}
    >
      {isListVisible ? (
        <SquareMinusSolid
          className={` ${
            activeLayer == layer.id ? "fill-pink-100" : "fill-white"
          }  pt-[2px] cursor-pointer group-hover:fill-gray-400 group-hover:hover:fill-pink-700`}
          size={16}
        />
      ) : (
        <SquarePlusSolid
          className={` ${
            activeLayer == layer.id ? "fill-pink-100" : "fill-white"
          }  pt-[2px] cursor-pointer group-hover:fill-gray-400 group-hover:hover:fill-pink-700`}
          size={16}
        />
      )}
    </div>
  );
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

function InteractiveLegend({ layer, toggleSymbology, isListVisible }) {
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
      {isListVisible && interactiveFilters.map((iFilter,i) => {
        return (
          <div
            key={i}
            className={`w-full px-2 flex items-center hover:bg-pink-50`}
            onClick={() => {
              setState(draft => {
                draft.symbology.layers[layer.id].selectedInteractiveFilterIndex = i;
              })
            }}
          >
            <input
              type="radio"
              readOnly
              checked={!isListVisible || selectedInteractiveFilterIndex === i}
            />
            <div className="flex px-2 items-center text-center flex-1 text-slate-500 h-6 text-sm truncate">
              {iFilter.label}
            </div>
          </div>
        );
      })}
      {activeFilterLayerType === 'categories' && <CategoryLegend layer={layer} toggleSymbology={toggleSymbology}/>}
      {activeFilterLayerType === 'choropleth' && <StepLegend layer={layer} toggleSymbology={toggleSymbology}/>}
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


function LegendRow ({ layer, i, numLayers, onRowMove }) {
  const { state, setState  } = React.useContext(SymbologyContext);
  const { activeLayer } = state.symbology;

  const [isListVisible, setIsListVisible] = React.useState(true);

  let { layerType: type } = useMemo(() => {
    return {
      layerType : get(layer, `['layer-type']`)
    }
  },[state]);

  const toggleSymbology = () => {
    setState(draft => {
        draft.symbology.activeLayer = activeLayer === layer.id ? '' : layer.id
    })
  }

  const Symbol = typeSymbols[layer.type] || typeSymbols['fill']
  let paintValue = typePaint?.[layer?.type] ? typePaint?.[layer?.type](layer) : '#fff'

  return (
    <div  className={`${activeLayer == layer.id ? 'bg-pink-100' : ''} hover:border-pink-500 group border`}>
      <div className={`w-full  p-2 py-1 flex border-blue-50/50 border  items-center`}>
        {(type === 'simple' || !type) && <div onClick={toggleSymbology} className='px-1'><Symbol layer={layer} color={paintValue}/></div>}
        <div 
          onClick={toggleSymbology}
          className='text-sm text-slate-600 font-medium truncate flex-1'
        >
          {layer.name}
        </div>
        {
          type === 'interactive' && 
            <div className='text-sm pb-1 mr-1 flex items-center'>
              <ToggleInteractiveFilterList 
                isListVisible={isListVisible} 
                setIsListVisible={setIsListVisible} 
                layer={layer}
              />
            </div>
        }
        <div className='text-sm pt-1  flex items-center'>
          <LayerMenu 
            layer={layer}
            button={<MenuDots className={` ${activeLayer == layer.id ? 'fill-pink-100' : 'fill-white'} cursor-pointer group-hover:fill-gray-400 group-hover:hover:fill-pink-700`}/>}
          />
        </div>
        <div
          className={`${i === 0 ? 'pointer-events-none' : ''}`}
          onClick={() => {
            onRowMove(i, i-1)
          }}
        >
          <CaretUpSolid
            size={24}
            className={` ${activeLayer == layer.id ? 'fill-pink-100' : 'fill-white'}  pt-[2px] cursor-pointer group-hover:fill-gray-400 group-hover:hover:fill-pink-700`} />
        </div>
        <div
          className={`${i === numLayers-1 ? 'pointer-events-none' : ''}`}
          onClick={ () => {
            onRowMove(i, i+1)
          }}
        >
          <CaretDownSolid
            size={24}
            className={` ${activeLayer == layer.id ? 'fill-pink-100' : 'fill-white'} pb-[2px] cursor-pointer group-hover:fill-gray-400 group-hover:hover:fill-pink-700`}
          />
        </div>
        <VisibilityButton layer={layer}/>
      </div>
      {type === 'categories' && <CategoryLegend layer={layer} toggleSymbology={toggleSymbology}/>}
      {type === 'choropleth' && <StepLegend layer={layer} toggleSymbology={toggleSymbology}/>}
      {type === 'interactive' && <InteractiveLegend layer={layer} toggleSymbology={toggleSymbology} isListVisible={isListVisible}/>}
    </div>
  )
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

export default LegendPanel