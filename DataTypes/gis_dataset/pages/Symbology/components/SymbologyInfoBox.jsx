import React from "react"

import get from "lodash/get"
import isEqual from "lodash/isEqual"

import { Legend } from "~/modules/avl-map-2/src"

import useViewVariable from "./useViewVariable"
import createLegend from "./createLegend"

import ColorEditor from "./ColorEditor"

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
  return (
    <div>
      <div>
        { symbology.views.map(view => (
            <ViewBox key={ view.viewId }
              { ...props }
              view={ view }/>
          ))
        }
      </div>
    </div>
  )
}

const ViewBox = ({ view, ...props }) => {
  return (
    <div>
      <div>View ID: { view.viewId }</div>
      <div className="ml-4">
        { view.layers.map(layer => (
            <LayerBox key={ layer.layerId }
              { ...props } layer={ layer }
              activeViewId={ view.viewId }/>
          ))
        }
      </div>
    </div>
  )
}
const LayerBox = ({ layer, ...props }) => {
  return (
    <div>
      <div>Layer ID: { layer.layerId }</div>
      <div className="ml-4">
        <div>Layer Type: { layer.type }</div>
        <div className="ml-4">
          { Object.keys(layer.paintProperties)
              .map((pp, i) => (
                <PaintPropertyBox key={ i } { ...props }
                  layerId={ layer.layerId }
                  ppId={ pp }
                  paintProperty={ layer.paintProperties[pp] }/>
              ))
          }
        </div>
      </div>
    </div>
  )
}
const PaintPropertyBox = ({ ppId, paintProperty, ...props }) => {
  return (
    <div>
      <div>
        Paint Property: { ppId }
      </div>
      <div>
        { !paintProperty.variable ? null :
          <VariableBox ppId={ ppId } { ...props }
            paintProperty={ paintProperty }
            variable={ paintProperty.variable }/>
        }
      </div>
    </div>
  )
}

const RangeEditor = ({ paintProperty, variable, min, max }) => {
  return (
    <div>
      RangeEditor: { `${min}, ${max}` }
    </div>
  )
}

const PaintProperties = {
  color: {
    Editor: ColorEditor
  },
  opacity: {
    Editor: RangeEditor,
    min: 0.0,
    max: 1.0
  },
  radius: {
    Editor: RangeEditor,
    min: 0.0,
    max: Infinity
  },
  width: {
    Editor: RangeEditor,
    min: 0.0,
    max: Infinity
  },
  offset: {
    Editor: RangeEditor,
    min: 0.0,
    max: Infinity
  }
}

const VariableBox = props => {
  const {
    layerId,
    ppId,
    paintProperty,
    variable,
    activeViewId,
    updateScale,
    legend,
    MapActions,
    ...rest
  } = props;

  const doUpdateScale = React.useCallback(scale => {
    updateScale(activeViewId, layerId, ppId, variable.variableId, scale);
  }, [updateScale, activeViewId, layerId, ppId, variable.variableId]);

  const { Editor, ...editorProps } = React.useMemo(() => {
    const [, prop] = ppId.split("-");
    return get(PaintProperties, prop, null);
  }, [activeViewId]);

  const data = useViewVariable(activeViewId, variable.variableId);

  React.useEffect(() => {
    if (!legend) return;
    if (!isEqual(legend.domain, variable.scale.domain)) {
      doUpdateScale({ ...variable.scale, domain: legend.domain });
    }
  }, [doUpdateScale, variable.scale, legend]);

  React.useEffect(() => {
    const legend = createLegend(variable, data);
    if (legend) {
      MapActions.updateLegend({ ...legend, isActive: true });
    }
    else {
      MapActions.updateLegend({ isActive: false });
    }
  }, [data, MapActions.updateLegend, variable, doUpdateScale]);

  return (
    <div>
      <div>Variable: { variable.displayName }</div>
      <div>
        <Editor { ...editorProps }
          scale={ variable.scale }
          updateScale={ doUpdateScale }
          variableType={ variable.type }/>
      </div>
    </div>
  )
}
