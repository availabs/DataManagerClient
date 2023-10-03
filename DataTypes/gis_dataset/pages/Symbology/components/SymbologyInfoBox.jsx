import React from "react"

import get from "lodash/get"
import isEqual from "lodash/isEqual"

import { Legend } from "~/modules/avl-map-2/src"

import useViewVariable from "./useViewVariable"

import ColorEditor from "./ColorEditor"
import RangeEditor from "./RangeEditor"

import { calcDomain, createLegend } from "./createLegend"

const SymbologyInfoBox = props => {

  const symbology = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "symbology"], null);
  }, [props]);
  const setSymbology = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "setSymbology"], null);
  }, [props]);

  const updateScale = React.useCallback((viewId, layerId, ppId, varId, scale) => {
    setSymbology(prev => {
      return ({
        name: prev.name,
        views: prev.views.map(view => {
          if (view.viewId === viewId) {
            return {
              viewId,
              layers: view.layers.map(layer => {
                if (layer.layerId === layerId) {
                  return {
                    ...layer,
                    paintProperties: {
                      ...layer.paintProperties,
                      [ppId]: {
                        ...layer.paintProperties[ppId],
                        variable: {
                          ...layer.paintProperties[ppId].variable,
                          scale: {
                            ...layer.paintProperties[ppId].variable.scale,
                            ...scale
                          }
                        }
                      }
                    }
                  }
                }
                return layer;
              })
            }
          }
          return view;
        })
      })
    })
  }, [setSymbology]);

  return (
    <div>
      { !symbology ? "Start a new symbology..." :
        <SymbologyBox { ...props }
          symbology={ symbology }
          updateScale={ updateScale }/>
      }
    </div>
  )
}
export default SymbologyInfoBox;

const SymbologyBox = ({ symbology, ...props }) => {

  const activeViewId = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "activeViewId"], null);
  }, [props]);
  const activeView = React.useMemo(() => {
    return get(symbology, "views", [])
      .reduce((a, c) => {
        return c.viewId === activeViewId ? c : a;
      }, null)
  }, [symbology, activeViewId]);

  return (
    <div>
      <div>
        { !activeView ? null :
          <ViewBox key={ activeView.viewId }
            { ...props }
            view={ activeView }/>
        }
      </div>
    </div>
  )
}

const ViewBox = ({ view, ...props }) => {
  const activeLayerId = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "activeLayerId"], null);
  }, [props]);
  const avtiveLayer = React.useMemo(() => {
    return get(view, "layers", [])
      .reduce((a, c) => {
        return c.layerId === activeLayerId ? c : a;
      }, null);
  }, [view, activeLayerId]);
  return (
    <div>
      <div>View ID: { view.viewId }</div>
      <div className="ml-4">
        { !avtiveLayer ? null :
          <LayerBox key={ avtiveLayer.layerId }
            { ...props } layer={ avtiveLayer }
            activeViewId={ view.viewId }/>
        }
      </div>
    </div>
  )
}
const LayerBox = ({ layer, ...props }) => {
  const ppId = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "activePaintProperty"], null);
  }, [props]);
  const paintProperty = React.useMemo(() => {
    return get(layer, ["paintProperties", ppId], null);
  }, [layer, ppId])
  return (
    <div>
      <div>Layer ID: { layer.layerId }</div>
      <div className="ml-4">
        <div>Layer Type: { layer.type }</div>
        <div className="ml-4">
          { !ppId ? null :
            <PaintPropertyBox key={ ppId } { ...props }
              layerId={ layer.layerId }
              ppId={ ppId }
              paintProperty={ paintProperty }/>
          }
        </div>
      </div>
    </div>
  )
}

const getEditor = ppId => {
  if (ppId.includes("color")) {
    return ColorEditor
  }
  if (ppId.includes("opacity")) {
    return RangeEditor
  }
  if (ppId.includes("radius")) {
    return RangeEditor
  }
  if (ppId.includes("width")) {
    return RangeEditor
  }
  if (ppId.includes("offset")) {
    return RangeEditor
  }
}

const VariableBox = props => {
  const {
    layerId,
    ppId,
    variable,
    activeViewId,
    updateScale,
    ...rest
  } = props;

  const doUpdateScale = React.useCallback(scale => {
    updateScale(activeViewId, layerId, ppId, variable.variableId, scale);
  }, [updateScale, activeViewId, layerId, ppId, variable.variableId]);

  const data = useViewVariable(activeViewId, variable.variableId);

  const domain = React.useMemo(() => {
    return calcDomain(variable.scale.type, data, variable.scale.range.length)
  }, [variable, data]);

  React.useEffect(() => {
    if (domain.length && !isEqual(domain, variable.scale.domain)) {
      doUpdateScale({ domain });
    }
  }, [doUpdateScale, variable, domain]);

  const Editor = React.useMemo(() => {
    return getEditor(ppId);
  }, [ppId]);

  return (
    <div>
      <div>Variable: { variable.displayName }</div>
      <div>
        <Editor { ...rest }
          variable={ variable }
          updateScale={ doUpdateScale }
          variableType={ variable.type }
          data={ data }/>
      </div>
    </div>
  )
}

const ValueBox = ({ min, max }) => {
  return (
    <div>
      VALUE BOX: { `${ min } | ${ max }` }
    </div>
  )
}
const ExpressionBox = ({ min, max }) => {
  return (
    <div>
      EXPRESSION BOX: { `${ min } | ${ max }` }
    </div>
  )
}

const VariableBoxWrapper = Comp => {
  return props => {
    return !props.variable ? null : <Comp { ...props }/>
  }
}

const VariableActionMap = {
  value: ValueBox,
  expression: ExpressionBox,
  variable: VariableBoxWrapper(VariableBox)
}

const getPaintPropertyLimits = ppId => {
  if (ppId.includes("color")) {
    return {};
  }
  if (ppId.includes("opacity")) {
    return { min: 0.0, max: 1.0 };
  }
  if (ppId.includes("radius")) {
    return { min: 0.0, max: Infinity };
  }
  if (ppId.includes("width")) {
    return { min: 0.0, max: Infinity };
  }
  if (ppId.includes("offset")) {
    return { min: -Infinity, max: Infinity };
  }
}

const PaintPropertyBox = ({ ppId, paintProperty, layerProps, ...props }) => {

  const paintPropertyActions = React.useMemo(() => {
    return get(layerProps, ["symbology-layer", "paintPropertyActions"], null);
  }, [layerProps]);
  const setPaintPropertyActions = React.useMemo(() => {
    return get(layerProps, ["symbology-layer", "setPaintPropertyActions"], null);
  }, [layerProps]);

  const action = React.useMemo(() => {
    return get(paintPropertyActions, ppId, "variable");
  }, [paintPropertyActions, ppId]);

  const Editor = React.useMemo(() => {
    return get(VariableActionMap, action, null);
  }, [action]);

  const limits = React.useMemo(() => {
    return getPaintPropertyLimits(ppId);
  }, [ppId]);

console.log("LIMITS:", limits)

  return (
    <div>
      <div>
        Paint Property: { ppId }
      </div>
      <div>
        { !Editor ? null :
          <Editor ppId={ ppId } { ...limits } { ...props }
            paintProperty={ paintProperty }
            variable={ paintProperty.variable }/>
        }
      </div>
    </div>
  )
}
