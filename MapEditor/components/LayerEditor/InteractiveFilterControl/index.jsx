import React, { useMemo, useEffect }from 'react'
import { Button } from "~/modules/avl-components/src";
import {SymbologyContext} from '../../../'
import { Close } from '../../icons'
import get from 'lodash/get'
import set from 'lodash/set'
import StyleEditor from '../StyleEditor';

function InteractiveFilterControl({ path, params = {} }) {
  const { state, setState } = React.useContext(SymbologyContext);
  const { value: interactiveFilters, selectedInteractiveFilterIndex, layerName, activeLayer } = useMemo(() => {
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
      activeLayer: get(state,`symbology.layers[${state?.symbology?.activeLayer}]`, {})
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
            //TODO lookin ok here, still a little dicey
            //TODO fix issue with default colors when adding new simple layer, its using old color data
            const newInteractiveFilter = {
              ...activeLayer,
              "layer-type": 'simple',
              "label": `${layerName}`,
              selectedInteractiveFilterIndex: undefined
            }
            const newInteractiveFilters = [...interactiveFilters, newInteractiveFilter];
            set(draft,`symbology.layers[${state.symbology.activeLayer}].${path}`, newInteractiveFilters )
            set(draft,`symbology.layers[${state.symbology.activeLayer}]['selectedInteractiveFilterIndex']`, newInteractiveFilters.length-1 )
          })

        }}
      >
        Add interactive filter
      </Button>
      {
        interactiveFilters.map((iFilter,i) => {
          const isSelectedFilter = selectedInteractiveFilterIndex === i;
          //TODO some small style changes -- if a certain filter is selected, the `hover` effect is not noticeable
          return (
            <div
              key={`ifilter_row_${i}`}
              className={`group/title w-full text-sm grid grid-cols-12 items-center rounded mb-2 ${isSelectedFilter && 'bg-blue-100'}`}
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
                className="col-span-1 flex items-center cursor-pointer group-hover/title:fill-slate-700 hover:bg-slate-100 rounded group/icon p-0.5"
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
                  className="m-0.5 cursor-pointer group-hover/icon:fill-slate-900 "
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
      Editing: <b>{interactiveFilters[selectedInteractiveFilterIndex]?.label}</b>
      <StyleEditor
        type={"interactive"}
        pathPrefix={`['interactive-filters'][${selectedInteractiveFilterIndex}]`}
      />
    </>
  );
};


export {InteractiveFilterControl}