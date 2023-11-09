import React from "react"

import get from "lodash/get"
import isEqual from "lodash/isEqual"

import { getScale, strictNaN } from "~/modules/avl-map-2/src"

import ColorEditor from "./ColorEditor"
import RangeEditor from "./RangeEditor"
import OrdinalRangeEditor from "./OrdinalRangeEditor"

import {
  calcDomain,
  useViewVariable
} from "../utils"

const getVariableEditor = (ppId, type) => {
  if (!type) return null;

  if (ppId.includes("color")) {
    return ColorEditor;
  }
  if (type === "ordinal") {
    return OrdinalRangeEditor;
  }
  return RangeEditor;
}

const VariableBox = props => {
  const {
    uniqueId,
    ppId,
    paintProperty,
    activeViewId,
    setSymbology,
    MapActions,
    layerProps,
    ...rest
  } = props;

  const activeView = React.useMemo(() => {
    return get(layerProps, ["symbology-layer", "activeView"], null);
  }, [layerProps]);

  const [variable, scale] = React.useMemo(() => {
    const { variable } = paintProperty;
    // if (ppId.includes("color") && variable.includeInLegend) {
    //   const legendId = `${ ppId }|${ variable.variableId }`;
    //   const legend = activeView.legends.reduce((a, c) => {
    //     return c.id === legendId ? c : a;
    //   }, null);
    //   return [variable, legend];
    // }
    return [variable, variable.scale];
  }, [activeView, ppId, paintProperty]);

  const activeLayer = React.useMemo(() => {
    return get(layerProps, ["symbology-layer", "activeLayer"], null);
  }, [layerProps]);

  const _updateLegend = React.useCallback(update => {
    setSymbology(prev => {
      return ({
        ...prev,
        views: prev.views.map(view => {
          if (view.viewId === activeViewId) {
            const legendId = `${ ppId }|${ variable.variableId }`;
            return {
              ...view,
              legends: view.legends.map(legend => {
                if (legend.id === legendId) {
                  return {
                    ...legend,
                    ...update
                  }
                }
                return legend;
              })
            }
          }
          return view;
        })
      })
    })
  }, [setSymbology, activeViewId, uniqueId, ppId, variable])

  const _updateVariable = React.useCallback(update => {
    setSymbology(prev => {
      return ({
        ...prev,
        views: prev.views.map(view => {
          if (view.viewId === activeViewId) {
            return {
              ...view,
              layers: view.layers.map(layer => {
                if (layer.uniqueId === uniqueId) {
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
  }, [setSymbology, activeViewId, uniqueId, ppId]);

  const _updateScale = React.useCallback(update => {
    setSymbology(prev => {
      return ({
        ...prev,
        views: prev.views.map(view => {
          if (view.viewId === activeViewId) {
            return {
              ...view,
              layers: view.layers.map(layer => {
                if (layer.uniqueId === uniqueId) {
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
                            ...update
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
  }, [setSymbology, activeViewId, uniqueId, ppId]);

  const [updateVariable, updateScale] = React.useMemo(() => {
    // if (ppId.includes("color")) {
    //   return [_updateVariable, _updateLegend];
    // }
    return [_updateVariable, _updateScale];
  }, [ppId, _updateLegend, _updateVariable, _updateScale]);

  const filteredVariableIds = React.useMemo(() => {
    return Object.keys(get(activeLayer, "filters", {}));
  }, [activeLayer]);

  const data = useViewVariable(activeViewId, variable, filteredVariableIds);

  const filtersMap = React.useMemo(() => {
    return Object.keys(get(activeLayer, "filters", {}))
      .reduce((a, c) => {
        a[c] = get(activeLayer, [c, "filter"], []);
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
    if ((scale.type === "threshold") && (scale.domain.length)) {
      return scale.domain;
    }
    return calcDomain(variable, scale, filteredData);
  }, [variable, scale, filteredData]);

  React.useEffect(() => {
    if (variable && scale && filteredData.length && d3scaleDomain.length) {

      const { variableId: vid } = variable;

      const { type, range = [], fallbackValue } = scale;

      if (!range.length) {
        if (variable.paintExpression) {
          updateVariable({ paintExpression: null });
        }
        return;
      };

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
        "coalesce",
        ["get",
          ["to-string", ["get", "ogc_fid"]],
          ["literal", dataMap]
        ],
        fallbackValue
      ];

      if (!isEqual(paintExpression, variable.paintExpression)) {
        updateVariable({ paintExpression });
      };
      if (variable.scale?.domain &&
          !variable.scale.domain.length &&
          !isEqual(domain, variable.scale.domain)
        ) {
        updateScale({ domain });
      }
    }
    else if (variable.paintExpression) {
      updateVariable({ paintExpression: null });
    }
  }, [variable, scale, filteredData, updateVariable, updateScale, d3scaleDomain, ppId]);

  const VariableEditor = React.useMemo(() => {
    return getVariableEditor(ppId, scale?.type);
  }, [ppId, scale]);

  return (
    <div>
      <div>Variable: { variable.variableId }</div>
      <div>
        { !VariableEditor ? null :
          <VariableEditor { ...props }
          variable={ variable }
          scale={ scale }
          updateScale={ updateScale }
          variableType={ variable.type }
          data={ filteredData }/>
        }
      </div>
    </div>
  )
}
export default VariableBox
