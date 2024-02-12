import React from "react"

import get from "lodash/get"

import {
  Button,
  Input,
  MultiLevelSelect,
  useTheme,
  strictNaN
} from "~/modules/avl-map-2/src"

import PaintPropertyItem from "./PaintPropertyItem"
import FilterItem from "./FilterItem"
import { NumberInput } from "../utils"

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
        <ZoomControls
          layer={ layer }
          setSymbology={ setSymbology }
          uniqueId={ uniqueId }/>
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

const ZoomControls = ({ layer, setSymbology, uniqueId }) => {

  const setMinZoom = React.useCallback(zoom => {
    setSymbology(prev => {
      return {
        ...prev,
        views: prev.views.map(view => ({
          ...view,
          layers: view.layers.map(layer => {
            if (layer.uniqueId === uniqueId) {
              return {
                ...layer,
                minZoom: zoom
              }
            }
            return layer;
          })
        }))
      }
    });
  }, [setSymbology, uniqueId]);

  const setMaxZoom = React.useCallback(zoom => {
    setSymbology(prev => {
      return {
        ...prev,
        views: prev.views.map(view => ({
          ...view,
          layers: view.layers.map(layer => {
            if (layer.uniqueId === uniqueId) {
              return {
                ...layer,
                maxZoom: zoom
              }
            }
            return layer;
          })
        }))
      }
    });
  }, [setSymbology, uniqueId]);

  const minZoom = React.useMemo(() => {

  }, []);

  const [editing, setEditing] = React.useState(false);
  const editMinZoom = React.useCallback(e => {
    setEditing("min-zoom");
  }, []);
  const editMaxZoom = React.useCallback(e => {
    setEditing("max-zoom");
  }, []);

  const stopEditing = React.useCallback(e => {
    setEditing(false);
  }, []);

  return (
    <div className="grid grid-cols-1 gap-1 mb-1">
      <ZoomEditor
        zoom={ layer.minZoom }
        setZoom={ setMinZoom }
        type="Min"
        editing={ editing === "min-zoom" }
        start={ editMinZoom }
        stop={ stopEditing }/>

      <ZoomEditor
        zoom={ layer.maxZoom }
        setZoom={ setMaxZoom }
        type="Max"
        editing={ editing === "max-zoom" }
        start={ editMaxZoom }
        stop={ stopEditing }/>
    </div>
  )
}

const ZoomEditor = ({ editing, zoom, type, start, stop, setZoom }) => {

console.log("ZOOM:", zoom);

  return (
    <div className="grid grid-cols-12">
      <div className="col-span-4">
        { type } Zoom:
      </div>
      { !editing ?
        <div className="col-span-8 flex">
          <div className="flex-1">
            { strictNaN(zoom) ? "Not set" : zoom }
          </div>
          <Button className="buttonPrimarySmall ml-1"
            onClick={ start }
          >
            <span className="fas fa-pen-to-square"/>
          </Button>
        </div> :
        <div className="col-span-8 flex">
          <NumberInput className="inputSmall"
            value={ zoom || "" }
            onChange={ setZoom }/>
          <Button className="buttonPrimarySmall ml-1"
            onClick={ stop }
          >
            <span className="fas fa-times"/>
          </Button>
        </div>
      }
    </div>
  )
}
