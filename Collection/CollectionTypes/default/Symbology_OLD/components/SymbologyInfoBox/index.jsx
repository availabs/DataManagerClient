import React from "react"

import get from "lodash/get"
import isEqual from "lodash/isEqual"

import { DamaContext } from "~/pages/DataManager/store"

import PaintPropertyBox from "./PaintPropertyBox"

const SymbologyInfoBox = props => {
  const symbology = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "symbology"], null);
  }, [props]);
  const setSymbology = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "setSymbology"], null);
  }, [props]);
  return (
    <div>
      { !symbology ? "Start a new symbology..." :
        <SymbologyBox { ...props }
          symbology={ symbology }
          setSymbology={ setSymbology }/>
      }
    </div>
  )
}
export default SymbologyInfoBox;

const SymbologyBox = ({ symbology, ...props }) => {
  const activeView = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "activeView"], null);
  }, [props]);
  return (
    <div>
      <div>
        { !activeView ? null :
          <ViewBox key={ activeView.viewId }
            { ...props } symbology={ symbology }
            view={ activeView }/>
        }
      </div>
    </div>
  )
}

const ViewBox = ({ view, ...props }) => {
  const activeLayer = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "activeLayer"], null);
  }, [props]);
  return (
    <div>
      <div>View ID: { view.viewId }</div>
      <div className="ml-4">
        { !activeLayer ? null :
          <LayerBox key={ activeLayer.uniqueId }
            { ...props } layer={ activeLayer }
            activeViewId={ view.viewId }/>
        }
      </div>
    </div>
  )
}

const LayerBox = ({ layer, ...props }) => {
  const activePaintPropertyId = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "activePaintPropertyId"], null);
  }, [props]);
  const activePaintProperty = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "activePaintProperty"], null);
  }, [props]);
  return (
    <div>
      <div>Layer ID: { layer.layerId }</div>
      <div className="ml-4">
        <div>Layer Type: { layer.type }</div>
        <div className="ml-4">
          { !activePaintProperty ? null :
            <PaintPropertyBox key={ activePaintPropertyId } { ...props }
              uniqueId={ layer.uniqueId }
              ppId={ activePaintPropertyId }
              paintProperty={ activePaintProperty }/>
          }
        </div>
      </div>
    </div>
  )
}
