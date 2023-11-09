import React from "react"

import get from "lodash/get"

import { DamaContext } from "~/pages/DataManager/store"

import { Protocol, PMTiles } from '~/pages/DataManager/utils/pmtiles/index.ts'

import {
  AvlMap as AvlMap2,
  ThemeProvider,
  ComponentLibrary,
  useTheme,
  getColorRange
} from "~/modules/avl-map-2/src"

import SymbologyLayer from "./components/SymbologyLayer"
import SymbologyPanel from "./components/SymbologyPanel"

import ViewLayer from "./components/ViewLayer"

const PMTilesProtocol = {
  type: "pmtiles",
  protocolInit: maplibre => {
    const protocol = new Protocol();
    maplibre.addProtocol("pmtiles", protocol.tile);
    return protocol;
  },
  sourceInit: (protocol, source, maplibreMap) => {
    const p = new PMTiles(source.url);
    protocol.add(p);
  }
}

const getSymbologyId = symbology => {
  return get(symbology, "views", [])
    .reduce((a, c) => {
      a.push(c.viewId);
      return get(c, "layers", [])
        .reduce((aa, cc) => {
          aa.push(cc.layerId);
          return Object.keys(get(cc, "paintProperties", {}))
            .reduce((aaa, ccc) => {
              aaa.push(ccc);
              const v = get(cc, ["paintProperties", ccc, "variable"], null);
              if (v.variableId) {
                aaa.push(v.variableId);
              }
              return aaa;
            }, aa);
        }, a);
    }, [`${ symbology.name.replace(/\s+/g, "_") }|${ Date.now() }`]).join("|")
}
const setSymbologyId = symbology => {
  symbology.id = symbology.id || getSymbologyId(symbology);
  return symbology;
}

const SymbologyEditor = ({ source, views, ...props }) => {

  const [symbology, setSymbology] = React.useState(null);

  React.useEffect(() => {
    if (!symbology) return;
    
    const needsFallbackValue = symbology.views.reduce((a, c) => {
      return c.layers.reduce((aa, cc) => {
        if (cc.paintProperties) {
          return Object.keys(cc.paintProperties)
            .reduce((aaa, ccc) => {
              const pp = cc.paintProperties[ccc];
              if (pp.variable?.scale) {
                return pp.variable.scale.fallbackValue === undefined;
              }
              return aaa;
            }, aa)
        }
      }, a);
    }, false);

    if (needsFallbackValue) {
      setSymbology(prev => ({
        ...prev,
        views: prev.views.map(view => ({
          ...view,
          layers: view.layers.map(layer => ({
            ...layer,
            paintProperties: {
              ...Object.keys(layer.paintProperties)
                .reduce((a, ppId) => {
                  a[ppId] = {
                    ...layer.paintProperties[ppId],
                    variable: {
                      ...layer.paintProperties[ppId].variable,
                      scale: {
                        ...layer.paintProperties[ppId].variable.scale,
                        fallbackValue: ppId.includes("color") ? "rgba(0, 0, 0, 0)" : 0
                      }
                    }
                  }
                  return a;
                }, {})
            }
          }))
        }))
      }))
    }

  }, [symbology]);

  const [activeViewId, _setActiveViewId] = React.useState(null);

  const [activeLayerId, _setActiveLayerId] = React.useState(null);

  const [activePaintPropertyId, setActivePaintPropertyId] = React.useState(null);
  const [paintPropertyActions, setPaintPropertyActions] = React.useState({});

  const [activeFilterVariableId, setActiveFilterVariableId] = React.useState(null);

  const { falcor, pgEnv } = React.useContext(DamaContext);

  const savedSymbologies = React.useMemo(() => {
    const symbologies = views.reduce((a, c) => {
      if (c.metadata?.symbologies?.length) {
        a.push(...JSON.parse(JSON.stringify(c.metadata.symbologies)));
      }
      return a;
    }, []);
    return symbologies.map(setSymbologyId);
  }, [activeViewId, views]);

  const reset = React.useCallback(() => {
    _setActiveViewId(null);
    _setActiveLayerId(null);
    setActivePaintPropertyId(null);
    setPaintPropertyActions({});
  }, []);

  const setActiveViewId = React.useCallback(vid => {
    _setActiveViewId(vid);
    setActiveLayerId(null);
    setActivePaintPropertyId(null);
    setPaintPropertyActions({});
  }, []);
  const activeView = React.useMemo(() => {
    return get(symbology, "views", [])
      .reduce((a, c) => {
        return c.viewId == activeViewId ? c : a;
      }, null);
  }, [symbology, activeViewId]);

  const setActiveLayerId = React.useCallback(lid => {
    _setActiveLayerId(lid);
    setActivePaintPropertyId(null);
    setPaintPropertyActions({});
  }, []);
  const activeLayer = React.useMemo(() => {
    return get(activeView, "layers", [])
      .reduce((a, c) => {
        return c.uniqueId === activeLayerId ? c : a;
      }, null);
  }, [activeView, activeLayerId]);

  const activePaintProperty = React.useMemo(() => {
    return get(activeLayer, ["paintProperties", activePaintPropertyId], null);
  }, [activeLayer, activePaintPropertyId]);

  const setActivePaintPropertyAction = React.useCallback((ppId, action) => {
    setPaintPropertyActions(prev => ({ ...prev, [ppId]: action }));
    setActivePaintPropertyId(ppId);
  }, [setPaintPropertyActions, setActivePaintPropertyId]);

  const activePaintPropertyAction = React.useMemo(() => {
    return get(paintPropertyActions, activePaintPropertyId, null);
  }, [activePaintPropertyId, paintPropertyActions]);

  const activeFilter = React.useMemo(() => {
    return get(activeLayer, ["filters", activeFilterVariableId], null);
  }, [activeLayer, activeFilterVariableId]);

  React.useEffect(() => {
    if (!symbology) {
      setActiveViewId(null);
    }
    else if (!activeViewId) {
      setActiveViewId(get(symbology, ["views", 0, "viewId"], null));
      setActiveLayerId(null);
      setActivePaintPropertyId(null);
      setPaintPropertyActions({});
    }
  }, [symbology, activeViewId]);
  React.useEffect(() => {
    if (!symbology) {
      setActiveLayerId(null);
    }
    else if (activeView && !activeLayerId) {
      setActiveLayerId(get(activeView, ["layers", 0, "uniqueId"], null));
      setActivePaintPropertyId(null);
      setPaintPropertyActions({});
    }
  }, [symbology, activeView, activeLayerId]);
  React.useEffect(() => {
    if (!symbology) {
      setActivePaintPropertyId(null);
    }
    else if (activeLayer && !activePaintPropertyId) {
      const [ppId = null] = Object.keys(activeLayer.paintProperties);
      setActivePaintPropertyId(ppId);
      setPaintPropertyActions(prev => {
        if (ppId in prev) {
          return { [ppId]: prev[ppId] };
        }
        return {};
      });
    }
  }, [symbology, activeLayer, activePaintPropertyId]);
  React.useEffect(() => {
    if (!symbology) {
      setPaintPropertyActions({});
    }
    else if (activePaintPropertyId && !activePaintPropertyAction) {
      setActivePaintPropertyAction(activePaintPropertyId, "variable");
    }
  }, [symbology, activePaintPropertyId, setActivePaintPropertyAction]);
  React.useEffect(() => {
    if (!symbology) {
      setActiveFilterVariableId(null);
    }
    else if (activeLayer && !activeFilterVariableId) {
      const [vid = null] = Object.keys(activeLayer.filters);
      setActiveFilterVariableId(vid);
    }
  }, [symbology, activeLayer, activeFilterVariableId]);

  const startNewSymbology = React.useCallback(() => {
    reset();
    const newSym = {
      name: "",
      views: views.map((view, i) => ({
        viewId: view.view_id,
        version: view.version || `View ID ${ view.view_id }`,
        legends: [],
        layers: get(view, ["metadata", "tiles", "layers"], [])
          .map(layer => ({
            uniqueId: `${ layer.id }-${ Date.now() }-${ performance.now() }`,
            copy: 0,
            layerId: layer.id,
            type: layer.type,
            show: true,
            minZoom: null,
            maxZoom: null,
            paintProperties: {},
            filters: {}
          }))
      }))
    };
    newSym.id = getSymbologyId(newSym);
    setSymbology(newSym);
  }, [views, reset]);

  const loadSavedSymbology = React.useCallback(sym => {
    reset();
    setSymbology(sym);
  }, [reset]);

  const symbologyLayer = React.useMemo(() => {
    return new SymbologyLayer(views);
  }, [views]);

  const [symbologyViewMap, setSymbologyViewMap] = React.useState({});

  React.useEffect(() => {
    const viewsMap = views.reduce((a, c) => {
      a[c.view_id] = c;
      return a;
    }, {});
    setSymbologyViewMap(prev => {
      return get(symbology, "views", [])
        .reduce((a, c) => {
          return c.layers.reduce((aa, cc) => {
            if (cc.uniqueId in prev) {
              aa[cc.uniqueId] = prev[cc.uniqueId];
            }
            else {
              aa[cc.uniqueId] = new ViewLayer(cc, viewsMap[c.viewId]);
            }
            return aa;
          }, a);
        }, {});
    })
  }, [symbology, views]);

  const layers = React.useMemo(() => {
    return [
      symbologyLayer,
      ...Object.values(symbologyViewMap)
    ]
  }, [symbologyLayer, symbologyViewMap]);

  const symbologyLayersMap = React.useMemo(() => {
    return get(symbology, "views", []).reduce((a, c) => {
      return c.layers.reduce((aa, cc) => {
        aa[cc.uniqueId] = { symbologyLayer: cc };
        return aa;
      }, a);
    }, {});
  }, [symbology]);

// CREATE LEGENDS
  // React.useEffect(() => {
  //   if (!symbology) return;
  //   if (!activeView) return;
  //
  //   const legendIds = activeView.layers.reduce((aa, cc) => {
  //     return Object.keys(cc.paintProperties)
  //       .filter(ppId => ppId.includes("color"))
  //       .reduce((aaa, ccc) => {
  //         const hasVar = Boolean(cc.paintProperties[ccc]?.variable);
  //         const inLgnd = hasVar && Boolean(cc.paintProperties[ccc].variable.includeInLegend);
  //         if (hasVar && inLgnd) {
  //           const vid = cc.paintProperties[ccc].variable.variableId;
  //           const id = `${ ccc }|${ vid }`;
  //           if (!aaa.includes(id)) {
  //             aaa.push(id);
  //           }
  //         }
  //         return aaa;
  //       }, aa);
  //   }, []);
  //
  //   const [neededLegendId] = legendIds.filter(lid => {
  //     return !activeView.legends.filter(l => l.id === lid).length;
  //   });
  //
  //   if (neededLegendId) {
  //     const [ppId, variableId] = neededLegendId.split("|");
  //     setSymbology(prev => {
  //       return {
  //         ...prev,
  //         views: prev.views.map(view => {
  //           if (view === activeView) {
  //             return {
  //               ...view,
  //               legends: [
  //                 ...view.legends,
  //                 { id: neededLegendId,
  //                   name: variableId,
  //                   color: "BrBG",
  //                   range: getColorRange(7, "BrBG"),
  //                   defaultValue: "rgba(0, 0, 0, 0)",
  //                   type: "quantile",
  //                   domain: [],
  //                   reverse: false
  //                 }
  //               ]
  //             }
  //           }
  //           return view;
  //         })
  //       }
  //     });
  //   }
  //
  //   const [unneededLegendId] = activeView.legends
  //     .filter(l => !legendIds.includes(l.id))
  //     .map(l => l.id);
  //
  //   if (unneededLegendId) {
  //     setSymbology(prev => {
  //       return {
  //         ...prev,
  //         views: prev.views.map(view => {
  //           if (view === activeView) {
  //             return {
  //               ...view,
  //               legends: view.legends.filter(l => l.id !== unneededLegendId)
  //             }
  //           }
  //           return view;
  //         })
  //       }
  //     });
  //   }
  //
  // }, [setSymbology, symbology, activeView]);

  const layerProps = React.useMemo(() => {
    return {
      "symbology-layer": {
        source, setSymbology, startNewSymbology, symbology, savedSymbologies,
        activeViewId, setActiveViewId, activeView, loadSavedSymbology,
        activeLayerId, setActiveLayerId, activeLayer,
        activePaintPropertyId, setActivePaintPropertyId, activePaintProperty,
        paintPropertyActions, activePaintPropertyAction, setActivePaintPropertyAction,
        activeFilterVariableId, setActiveFilterVariableId, activeFilter
      },
      ...layers.slice(1).reduce((a, c) => {
        a[c.id] = symbologyLayersMap[c.id]
        return a;
      }, {})
    }
  }, [source, setSymbology, startNewSymbology, symbology, savedSymbologies,
        activeViewId, setActiveViewId, activeView, loadSavedSymbology,
        activeLayerId, setActiveLayerId, activeLayer,
        activePaintPropertyId, setActivePaintPropertyId, activePaintProperty,
        paintPropertyActions, activePaintPropertyAction, setActivePaintPropertyAction,
        activeFilterVariableId, setActiveFilterVariableId, activeFilter,
        symbologyLayersMap
      ]
  );

  return (
    <div className="w-full h-[800px]">
      <AvlMap2
        layers={ layers }
        layerProps={ layerProps }
        mapOptions={ {
          center: [-76, 43.3],
          zoom: 6,
          protocols: [PMTilesProtocol]
        } }
        mapActions={ false }
        leftSidebar={ {
          Panels: [{
            Panel: SymbologyPanel,
            icon: "fas fa-gears"
          }]
        } }/>
    </div>
  )
}

export default SymbologyEditor
