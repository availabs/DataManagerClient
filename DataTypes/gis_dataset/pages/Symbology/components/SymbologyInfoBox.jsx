import React from "react"

import get from "lodash/get"
import isEqual from "lodash/isEqual"

import { DamaContext } from "~/pages/DataManager/store"

import { Legend, getScale, strictNaN } from "~/modules/avl-map-2/src"

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
          <LayerBox key={ activeLayer.layerId }
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
              layerId={ layer.layerId }
              ppId={ activePaintPropertyId }
              paintProperty={ activePaintProperty }/>
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

  const updateVariable = React.useCallback(update => {
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
                          ...update
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

  const dataDomain = React.useMemo(() => {
    return calcDomain(variable, data)
  }, [variable, data]);

  // React.useEffect(() => {
  //   if (domain.length && !isEqual(domain, variable.scale?.domain)) {
  //     updateScale({ domain });
  //   }
  // }, [updateScale, variable, domain]);

  React.useEffect(() => {

  }, [variable, updateScale]);

  React.useEffect(() => {
    if (variable.scale && data.length && dataDomain.length) {

      const { type, range = [] } = variable.scale;

      if (!range.length) return;

      const scale = getScale(type, dataDomain, range);

      let domain = scale.domain();
      if (type === "quantile") {
        domain = scale.range().map(r => scale.invertExtent(r)[1]);
      }

      const dataMap = data.reduce((a, c) => {
        if (!strictNaN(c.value)) {
          a[c.id] = scale(c.value);
        }
        return a;
      }, {});

      const paintExpression = [
        "get",
        ["to-string", ["get", "ogc_fid"]],
        ["literal", dataMap]
      ];

      if (isEqual(paintExpression, variable.paintExpression)) return;

      updateVariable({
        paintExpression,
        scale: {
          ...variable.scale,
          domain
        }
      });
    }
  }, [variable, data, updateVariable, dataDomain]);

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

  const action = React.useMemo(() => {
    return get(layerProps, ["symbology-layer", "activePaintPropertyAction"], null);
  }, [layerProps]);

  const Editor = React.useMemo(() => {
    return get(VariableActionMap, action, null);
  }, [action]);

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
