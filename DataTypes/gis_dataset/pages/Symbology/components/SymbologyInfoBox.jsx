import React from "react"

import get from "lodash/get"
import isEqual from "lodash/isEqual"

import { Legend } from "~/modules/avl-map-2/src"

import useViewVariable from "./useViewVariable"

import ColorEditor from "./ColorEditor"
import RangeEditor from "./RangeEditor"
import ColorPicker from "./ColorPicker"

import { calcDomain } from "./createLegend"

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
            { ...props } symbology={ symbology }
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

const getVariableEditor = ppId => {
  if (ppId.includes("color")) {
    return ColorEditor;
  }
  return RangeEditor;
}

const VariableBox = props => {
  const {
    layerId,
    ppId,
    paintProperty,
    activeViewId,
    setSymbology,
    MapActions,
    ...rest
  } = props;

  const { variable } = paintProperty;

  const updateScale = React.useCallback(scale => {
    setSymbology(prev => {
      return ({
        name: prev.name,
        views: prev.views.map(view => {
          if (view.viewId === activeViewId) {
            return {
              viewId: activeViewId,
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
  }, [setSymbology, activeViewId, layerId, ppId]);

  const data = useViewVariable(activeViewId, variable.variableId);

  const domain = React.useMemo(() => {
    return calcDomain(variable.scale.type, data, variable.scale.range.length)
  }, [variable, data]);

  React.useEffect(() => {
    if (domain.length && !isEqual(domain, variable.scale.domain)) {
      updateScale({ domain });
    }
  }, [updateScale, variable, domain]);

  React.useEffect(() => {
    const dl = paintProperty.variable?.scale?.domain?.length;
    const rl = paintProperty.variable?.scale?.range?.length;
    if (dl && rl && ppId.includes("color")) {
      MapActions.updateLegend({
        ...variable.scale,
        name: variable.displayName,
        isActive: true
      });
    }
    else {
      MapActions.updateLegend({ isActive: false });
    }
  }, [MapActions.updateLegend, variable, ppId]);

  const VariableEditor = React.useMemo(() => {
    return getVariableEditor(ppId);
  }, [ppId]);

  return (
    <div>
      <div>Variable: { variable.displayName }</div>
      <div>
        <VariableEditor { ...rest }
          variable={ variable }
          updateScale={ updateScale }
          variableType={ variable.type }
          data={ data }/>
      </div>
    </div>
  )
}

const ValuePicker = ({ min, max }) => {
  return (
    <div>
      Value Picker: { `${ min } | ${ max }` }
    </div>
  )
}

const getValuePicker = ppId => {
  if (ppId.includes("color")) {
    return ColorPicker;
  }
  return ValuePicker;
}

const ValueBox = props => {
  const {
    layerId,
    ppId,
    activeViewId,
    setSymbology,
    min, max,
    ...rest
  } = props;

  const Picker = React.useMemo(() => {
    return getValuePicker(ppId);
  }, [ppId]);

  const setValue = React.useCallback(value => {
    setSymbology(prev => {
      return ({
        name: prev.name,
        views: prev.views.map(view => {
          if (view.viewId === activeViewId) {
            return {
              viewId: activeViewId,
              layers: view.layers.map(layer => {
                if (layer.layerId === layerId) {
                  return {
                    ...layer,
                    paintProperties: {
                      ...layer.paintProperties,
                      [ppId]: {
                        value: value,
                        paintExpression: null,
                        variable: null
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
  }, [setSymbology, activeViewId, layerId, ppId]);

  return (
    <div>
      VALUE BOX: { `${ min } | ${ max }` }
      <div>
        <Picker { ...props } setValue={ setValue }/>
      </div>
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
    const variable = React.useMemo(() => {
      return get(props, ["paintProperty", "variable"], null);
    }, [props.paintProperty])
    return !variable ? null : <Comp { ...props }/>
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
    return { min: 0.0, max: 1.0, steps: [0.1, 0.2, 0.25] };
  }
  if (ppId.includes("radius")) {
    return { min: 0.0, max: 50, steps: [1, 2, 5] };
  }
  if (ppId.includes("width")) {
    return { min: 0.0, max: 20, steps: [1, 2, 5] };
  }
  if (ppId.includes("offset")) {
    return { min: -20, max: 20, steps: [1, 2, 5] };
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

  React.useEffect(() => {
    const dl = paintProperty.variable?.scale?.domain?.length;
    const rl = paintProperty.variable?.scale?.range?.length;
    if (!(dl && rl) || !ppId.includes("color")) {
      props.MapActions.updateLegend({ isActive: false });
    }
  }, [props.MapActions, paintProperty. ppId]);

  const limits = React.useMemo(() => {
    return getPaintPropertyLimits(ppId);
  }, [ppId]);

  return (
    <div>
      <div>
        Paint Property: { ppId }
      </div>
      <div>
        { !Editor ? null :
          <Editor ppId={ ppId } { ...limits } { ...props }
            paintProperty={ paintProperty }/>
        }
      </div>
    </div>
  )
}
