import React from "react"

import get from "lodash/get"

import {
  MultiLevelSelect,
  useTheme
} from "~/modules/avl-map-2/src"

import PaintPropertyItem from "./PaintPropertyItem"
import FilterItem from "./FilterItem"

const PaintProperties = {
  fill: ["fill-color", "fill-opacity"],
  circle: ["circle-color", "circle-opacity", "circle-radius"],
  line: ["line-color", "line-opacity", "line-width", "line-offset"]
}

const MultiSelectDisplay = ({ children }) => {
  return (
    <div className="px-2 py-1 bg-white outline outline-1 outline-current rounded">
      { children }
    </div>
  )
}

const VariableAccessor = v => v.variableId;

const LayerItem = ({ layer, setSymbology, variables, ...props }) => {

  const { uniqueId, type: layerType  } = layer;

  const paintProperties = React.useMemo(() => {
    return get(PaintProperties, layerType, []);
  }, [layerType]);

  const activePaintPropertyId = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "activePaintPropertyId"], null);
  }, [props.layerProps]);
  const setActivePaintPropertyId = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "setActivePaintPropertyId"], null);
  }, [props.layerProps]);

  const activeFilterVariableId = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "activeFilterVariableId"], null);
  }, [props.layerProps]);
  const setActiveFilterVariableId = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "setActiveFilterVariableId"], null);
  }, [props.layerProps]);

  const addPaintProperty = React.useCallback(ppId => {
    setActivePaintPropertyId(ppId);
    setSymbology(prev => {
      return {
        ...prev,
        views: prev.views.map(view => ({
          ...view,
          layers: view.layers.map(layer => {
            if (layer.uniqueId === uniqueId) {
              return {
                ...layer,
                paintProperties: {
                  ...layer.paintProperties,
                  [ppId]: {
                    value: null,
                    paintExpression: null,
                    variable: null
                  }
                }
              }
            }
            return layer;
          })
        }))
      }
    });
  }, [setSymbology, uniqueId, setActivePaintPropertyId]);

  const removePaintProperty = React.useCallback(ppId => {
    if (activePaintPropertyId === ppId) {
      setActivePaintPropertyId(null);
    }
    setSymbology(prev => {
      return {
        ...prev,
        views: prev.views.map(view => ({
          ...view,
          layers: view.layers.map(layer => {
            if (layer.uniqueId === uniqueId) {
              const paintProperties = {
                ...layer.paintProperties
              }
              delete paintProperties[ppId];
              return {
                ...layer,
                paintProperties
              }
            }
            return layer;
          })
        }))
      }
    });
  }, [setSymbology, uniqueId, activePaintPropertyId, setActivePaintPropertyId]);

  const addFilter = React.useCallback(vid => {
    setActiveFilterVariableId(vid);
    setSymbology(prev => {
      return {
        ...prev,
        views: prev.views.map(view => ({
          ...view,
          layers: view.layers.map(layer => {
            if (layer.uniqueId === uniqueId) {
              return {
                ...layer,
                filters: {
                  ...layer.filters,
                  [vid]: {
                    filter: [],
                    filterExpression: null
                  }
                }
              }
            }
            return layer;
          })
        }))
      }
    });
  }, [setSymbology, uniqueId, setActiveFilterVariableId]);

  const removeFilter = React.useCallback(vid => {
    if (activeFilterVariableId === vid) {
      setActiveFilterVariableId(null);
    }
    setSymbology(prev => {
      return {
        ...prev,
        views: prev.views.map(view => ({
          ...view,
          layers: view.layers.map(layer => {
            if (layer.uniqueId === uniqueId) {
              const filters = {
                ...layer.filters
              }
              delete filters[vid];
              return {
                ...layer,
                filters
              }
            }
            return layer;
          })
        }))
      }
    });
  }, [setSymbology, uniqueId, activeFilterVariableId, setActiveFilterVariableId]);

  const metaVariables = React.useMemo(() => {
    return variables.filter(v => {
      return v.type === "meta-variable";
    })
  }, [variables]);

  return (
    <div>
      <div className="ml-4">
        <div>Layer Type: { layer.type }</div>

        <div className="relative">
          <div className="mb-1">
            <MultiLevelSelect isDropdown
              options={ paintProperties }
              onChange={ addPaintProperty }
            >
              <MultiSelectDisplay>
                Add a Paint Property
              </MultiSelectDisplay>
            </MultiLevelSelect>
          </div>
          <div className="ml-4 grid grid-cols-1 gap-1">
            { Object.keys(layer.paintProperties)
                .map((pp, i)=> (
                  <PaintPropertyItem key={ pp } { ...props }
                    layer={ layer }
                    ppId={ pp }
                    variables={ variables }
                    paintProperty={ layer.paintProperties[pp] }
                    setSymbology={ setSymbology }
                    removePaintProperty={ removePaintProperty }/>
                ))
            }
          </div>
        </div>

        { !metaVariables.length ? null :
          <div className="relative">
            <div className="mb-1">
              <MultiLevelSelect isDropdown
                options={ metaVariables }
                displayAccessor={ VariableAccessor }
                valueAccessor={ VariableAccessor }
                onChange={ addFilter }
              >
                <MultiSelectDisplay>
                  Add a Filter
                </MultiSelectDisplay>
              </MultiLevelSelect>
            </div>
            <div className="ml-4 grid grid-cols-1 gap-1">
              { Object.keys(layer.filters)
                  .map((vid, i)=> (
                    <FilterItem key={ vid } { ...props }
                      layer={ layer }
                      variableId={ vid }
                      filter={ layer.filters[vid] }
                      setSymbology={ setSymbology }
                      removeFilter={ removeFilter }/>
                  ))
              }
            </div>
          </div>
        }

      </div>
    </div>
  )
}
export default LayerItem
