import React from "react"

import get from "lodash/get"
import isEqual from "lodash/isEqual"

import {
  MultiLevelSelect,
  BooleanSlider,
  ColorRanges,
  ColorBar,
  useTheme
} from "~/modules/avl-map-2/src";

import { useViewVariable } from "./utils"

const MetaVariableFilterEditor = props => {

  const setSymbology = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "setSymbology"], null);
  }, [props]);
  const activeViewId = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "activeViewId"], null);
  }, [props]);
  const activeLayerId = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "activeLayerId"], null);
  }, [props]);
  const activeFilterVariableId = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "activeFilterVariableId"], null);
  }, [props]);
  const activeFilter = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "activeFilter"], null);
  }, [props]);

  const filter = get(activeFilter, "filter", []);

  const updateVariableFilter = React.useCallback(update => {
    setSymbology(prev => {
      return {
        ...prev,
        views: prev.views.map(view => ({
          ...view,
          layers: view.layers.map(layer => {
            if (layer.uniqueId === activeLayerId) {
              return {
                ...layer,
                filters: Object.keys(layer.filters)
                  .reduce((a, vid) => {
                    if (vid === activeFilterVariableId) {
                      a[vid] = {
                        ...layer.filters[vid],
                        ...update
                      }
                    }
                    else {
                      a[vid] = layer.filters[vid];
                    }
                    return a;
                  }, {})
              }
            }
            return layer;
          })
        }))
      }
    })
  }, [setSymbology, activeLayerId, activeFilterVariableId]);

  const data = useViewVariable(activeViewId, activeFilterVariableId);

  const allDomainValues = React.useMemo(() => {
    const dataSet = data.reduce((a, c) => {
      a.add(get(c, activeFilterVariableId, null))
      return a;
    }, new Set())
    return [...dataSet].filter(Boolean).sort((a, b) => {
      return String(a).localeCompare(String(b));
    });
  }, [data, activeFilterVariableId]);

  const toggle = React.useCallback(v => {
    const update = filter.includes(v) ? filter.filter(d => d !== v) : [...filter, v];
    updateVariableFilter({ filter: update });
  }, [updateVariableFilter, filter]);

  const filtered = React.useMemo(() => {
    return allDomainValues.filter(d => !filter.includes(d));
  }, [filter, allDomainValues]);

  React.useEffect(() => {
    const vid = activeFilterVariableId;

    if (filter.length && allDomainValues.length) {
        const filterMap = data.reduce((a, c) => {
          if (c[vid] && filtered.includes(c[vid])) {
            a[c.id] = c[vid];
          }
          return a;
        }, {});

        const filterExpression = [
          "in",
          [
            "get",
            ["to-string", ["get", "ogc_fid"]],
            ["literal", filterMap]
          ],
          ["literal", filtered]
        ];

        if (!isEqual(filterExpression, activeFilter.filterExpression)) {
          updateVariableFilter({ filterExpression });
        };
    }
    else {
      updateVariableFilter({ filterExpression: null });
    }
  }, [filter, data, allDomainValues, filtered, updateVariableFilter]);

  return (
    <div>
      <div className="grid grid-cols-1">
        <div className="font-bold">
          { activeFilterVariableId } filter
        </div>
        <div className="border-b border-current mb-1">Domain:</div>
        { allDomainValues.map(d => (
            <DomainItem key={ d }
              domain={ allDomainValues }
              filtered={ filtered }
              value={ d }
              toggle={ toggle }/>
          ))
        }
      </div>
    </div>
  )
}
export default MetaVariableFilterEditor;

const DomainItem = ({ domain, value, toggle, filtered }) => {
  const isActive = React.useMemo(() => {
    return filtered.includes(value);
  }, [filtered, value]);
  const onClick = React.useCallback(e => {
    toggle(value);
  }, [toggle, value]);
  return (
    <div onClick={ onClick }
      className={ `
        ml-8 px-4 rounded hover:bg-gray-200 cursor-pointer flex
      ` }
    >
      <div className={ isActive ? null : "line-through" }>
        &nbsp;&nbsp;&nbsp;{ value }&nbsp;&nbsp;&nbsp;
      </div>
    </div>
  )
}
