import React from "react"

import get from "lodash/get"

import {
  Button,
  MultiLevelSelect,
  useTheme
} from "~/modules/avl-map-2/src"

import LayerItem from "./LayerItem"

import { getDisplayItem } from "./index"

const ViewItem = ({ view, ...props }) => {
  const setSymbology = get(props, ["layerProps", "symbology-layer", "setSymbology"], null);
  const activeView = get(props, ["layerProps", "symbology-layer", "activeView"], null);
  const activeLayerId = get(props, ["layerProps", "symbology-layer", "activeLayerId"], null);
  const setActiveLayerId = get(props, ["layerProps", "symbology-layer", "setActiveLayerId"], null);
  const activeLayer = get(props, ["layerProps", "symbology-layer", "activeLayer"], null);

  const copyLayer = React.useCallback(e => {
    e.stopPropagation();
    const maxCopy = activeView.layers
      .filter(l => l.layerId === activeLayer.layerId)
      .reduce((a, c) => {
        return Math.max(+a, +c.copy);
      }, 0)
    const layer = {
      uniqueId: `${ activeLayer.layerId }-${ Date.now() }-${ performance.now() }`,
      copy: maxCopy + 1,
      layerId: activeLayer.layerId,
      type: activeLayer.type,
      show: true,
      minZoom: null,
      maxZoom: null,
      paintProperties: {},
      filters: {}
    }
    setSymbology(prev => {
      return {
        ...prev,
        views: prev.views.map(view => {
          if (view.viewId === activeView.viewId) {
            return {
              ...view,
              layers: [
                ...view.layers,
                layer
              ]
            }
          }
          return view;
        })
      }
    })
    setActiveLayerId(layer.uniqueId);
  }, [setSymbology, activeView, activeLayer, setActiveLayerId]);

  const removeLayerCopy = React.useCallback(uid => {
    if (uid === activeLayer.uniqueId) {
      setActiveLayerId(null);
    }
    setSymbology(prev => {
      return {
        ...prev,
        views: prev.views.map(view => {
          if (view.viewId === activeView.viewId) {
            return {
              ...view,
              layers: view.layers.filter(layer => layer.uniqueId !== uid)
            }
          }
          return view;
        })
      }
    })
  }, [setSymbology, activeView, activeLayer, setActiveLayerId]);

  const Options = React.useMemo(() => {
    return view.layers.map(layer => {
      if (layer.copy) {
        return {
          ...layer,
          DisplayItem: getDisplayItem(removeLayerCopy)
        }
      }
      return layer;
    })
  }, [view.layers, removeLayerCopy]);

  return (
    <div>
      <div className="ml-4 pt-1">
        <div className="flex items-center">
          <div className="flex-1 mr-1">
            <MultiLevelSelect
              removable={ false }
              options={ Options }
              value={ activeLayerId }
              onChange={ setActiveLayerId }
              displayAccessor={ v => `Layer ID: ${ v.layerId } (${ v.copy })` }
              valueAccessor={ v => v.uniqueId }/>
          </div>
          <Button className="button"
            onClick={ copyLayer }
          >
            <span className="fas fa-plus"/>
          </Button>
        </div>
        { !activeLayer ? null :
          <LayerItem key={ activeLayer.uniqueId }
            { ...props } layer={ activeLayer }/>
        }
      </div>
    </div>
  )
}
export default ViewItem;
