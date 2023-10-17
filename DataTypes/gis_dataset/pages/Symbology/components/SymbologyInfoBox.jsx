import React from "react"

import get from "lodash/get"
import isEqual from "lodash/isEqual"

import { DamaContext } from "~/pages/DataManager/store"

import ckmeans from "~/pages/DataManager/utils/ckmeans";

import { Legend, getScale, strictNaN } from "~/modules/avl-map-2/src"

import useViewVariable from "./useViewVariable"

import ColorEditor from "./ColorEditor"
import RangeEditor from "./RangeEditor"
import OrdinalRangeEditor from "./OrdinalRangeEditor"
import ColorPicker from "./ColorPicker"

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

const getVariableEditor = (ppId, type) => {
  if (ppId.includes("color")) {
    return ColorEditor;
  }
  if (type === "ordinal") {
    return OrdinalRangeEditor;
  }
  return RangeEditor;
}

const ordinalSort = (a, b) => {
  return String(a).localeCompare(String(b));
}
export const calcDomain = (variable, data) => {
  const { scale, variableId: vid } = variable;
  const { type, range = [] } = scale;
  const values = data.map(d => strictNaN(d[vid]) ? d[vid] : +d[vid])
    .filter(v => (v !== "") && (v !== null) && (v !== "null"));
  if (!values.length) return [];
  switch (type) {
    case "threshold": {
      return ckmeans(values, range.length || 7).slice(1);
    }
    case "ordinal":
      return [...new Set(values)].sort(ordinalSort);
    default:
      return values;
  }
}

const VariableBox = props => {
  const {
    layerId,
    ppId,
    paintProperty,
    activeViewId,
    setSymbology,
    MapActions,
    layerProps,
    ...rest
  } = props;

    const { variable } = paintProperty;

  const activeLayer = React.useMemo(() => {
    return get(layerProps, ["symbology-layer", "activeLayer"], null);
  }, [layerProps]);
  const filteredVariableIds = React.useMemo(() => {
    return Object.keys(get(activeLayer, "filters", {}));
  }, [activeLayer]);

  const updateVariable = React.useCallback(update => {
    setSymbology(prev => {
      return ({
        ...prev,
        views: prev.views.map(view => {
          if (view.viewId === activeViewId) {
            return {
              ...view,
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
        ...prev,
        views: prev.views.map(view => {
          if (view.viewId === activeViewId) {
            return {
              ...view,
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

  const data = useViewVariable(activeViewId, variable, filteredVariableIds);

  const filtersMap = React.useMemo(() => {
    const filters = get(activeLayer, "filters", {});
    return Object.keys(filters)
      .reduce((a, c) => {
        a[c] = get(filters, [c, "filter"], []);
        return a;
      }, {});
  }, [activeLayer, data]);

  const filteredOgcFids = React.useMemo(() => {
    return data.reduce((a, c) => {
      Object.keys(filtersMap).forEach(vid => {
        const filter = get(filtersMap, vid, []);
        const value = get(c, vid, null);
        if (filter.includes(value)) {
          a.add(c.id);
        }
      })
      return a;
    }, new Set());
  }, [activeLayer, data, filtersMap]);

  const filteredData = React.useMemo(() => {
    return data.filter(d => !filteredOgcFids.has(d.id));
  }, [data, filteredOgcFids]);

  const d3scaleDomain = React.useMemo(() => {
    return calcDomain(variable, filteredData);
  }, [variable, filteredData]);

  React.useEffect(() => {
    if (variable.scale && filteredData.length && d3scaleDomain.length) {

      const { variableId: vid, scale = {} } = variable;

      const { type, range = [] } = scale;

      if (!range.length) return;

      const d3scale = getScale(type, d3scaleDomain, range);

      let domain = d3scale.domain();
      if (type === "quantile") {
        domain = d3scale.range().map(r => d3scale.invertExtent(r)[1]);
      }

      const dataMap = filteredData.reduce((a, c) => {
        if ((type ==="ordinal") && c[vid]) {
          a[c.id] = d3scale(c[vid]);
        }
        else if (!strictNaN(c[vid])) {
          a[c.id] = d3scale(c[vid]);
        }
        return a;
      }, {});

      const paintExpression = [
        "get",
        ["to-string", ["get", "ogc_fid"]],
        ["literal", dataMap]
      ];

      if (!isEqual(paintExpression, variable.paintExpression)) {
        updateVariable({ paintExpression });
      };
      if (!isEqual(domain, variable.scale?.domain)) {
        updateScale({ domain });
      }
    }
  }, [variable, filteredData, updateVariable, updateScale, d3scaleDomain]);

  const VariableEditor = React.useMemo(() => {
    return getVariableEditor(ppId, variable?.scale?.type);
  }, [ppId, variable]);

  return (
    <div>
      <div>Variable: { variable.variableId }</div>
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
        ...prev,
        views: prev.views.map(view => {
          if (view.viewId === activeViewId) {
            return {
              ...view,
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
            paintProperty={ paintProperty }
            layerProps={ layerProps }/>
        }
      </div>
    </div>
  )
}
