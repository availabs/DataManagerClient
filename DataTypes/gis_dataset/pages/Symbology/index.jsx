import React from "react"

import get from "lodash/get"

import { Protocol, PMTiles } from '~/pages/DataManager/utils/pmtiles/index.ts'

import {
  AvlMap as AvlMap2,
  ThemeProvider,
  ComponentLibrary,
  useTheme
} from "~/modules/avl-map-2/src"

import SymbologyLayer from "./components/SymbologyLayer"
import SymbologyPanel from "./components/SymbologyPanel"

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

export const InfoBoxSidebarContainer = ({ open, children }) => {
  const theme = useTheme();
  return (
    <div className="relative h-full">
      <div className={ `
          w-96 ${ theme.bg } rounded pointer-events-auto
          max-h-full h-fit scrollbar-sm
        ` }
      >
        { children }
      </div>
    </div>
  )
}
const NewLibraryComponents = { InfoBoxSidebarContainer };

const SymbologyEditor = ({ source, views, ...props }) => {

  const [symbology, setSymbology] = React.useState(null);

  const [activeViewId, _setActiveViewId] = React.useState(null);
  const [activeLayerId, _setActiveLayerId] = React.useState(null);
  const [activePaintPropertyId, setActivePaintPropertyId] = React.useState(null);
  const [paintPropertyActions, setPaintPropertyActions] = React.useState(null);

  const reset = React.useCallback(() => {
    _setActiveViewId(null);
    _setActiveLayerId(null);
    setActivePaintPropertyId(null);
    setPaintPropertyActions(null);
  }, []);

  const setActiveViewId = React.useCallback(vid => {
    _setActiveViewId(vid);
    setActiveLayerId(null);
    setActivePaintPropertyId(null);
    setPaintPropertyActions(null);
  }, []);
  const activeView = React.useMemo(() => {
    return get(symbology, "views", [])
      .reduce((a, c) => {
        return +c.viewId === +activeViewId ? c : a;
      }, null);
  }, [symbology, activeViewId]);

  const setActiveLayerId = React.useCallback(lid => {
    _setActiveLayerId(lid);
    setActivePaintPropertyId(null);
    setPaintPropertyActions(null);
  }, []);
  const activeLayer = React.useMemo(() => {
    return get(activeView, "layers", [])
      .reduce((a, c) => {
        return c.layerId === activeLayerId ? c : a;
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

  React.useEffect(() => {
    if (!symbology) {
      setActiveViewId(null);
    }
    else if (!activeViewId) {
      setActiveViewId(get(symbology, ["views", 0, "viewId"], null));
      setActiveLayerId(null);
      setActivePaintPropertyId(null);
      setPaintPropertyActions(null);
    }
  }, [symbology, activeViewId]);
  React.useEffect(() => {
    if (!symbology) {
      setActiveLayerId(null);
    }
    else if (activeView && !activeLayerId) {
      setActiveLayerId(get(activeView, ["layers", 0, "layerId"], null));
      setActivePaintPropertyId(null);
      setPaintPropertyActions(null);
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
        if (prev && (ppId in prev)) {
          return { [ppId]: prev[ppId] };
        }
        return null;
      });
    }
  }, [symbology, activeLayer, activePaintPropertyId]);
  React.useEffect(() => {
    if (!symbology) {
      setPaintPropertyActions(null);
    }
    else if (activePaintPropertyId && !activePaintPropertyAction) {
      setActivePaintPropertyAction(activePaintPropertyId, "variable");
    }
  }, [symbology, activePaintPropertyId, setActivePaintPropertyAction]);

  const startNewSymbology = React.useCallback(() => {
    reset();
    setSymbology({
      name: "",
      views: views.map((view, i) => ({
        viewId: view.view_id,
        version: view.version || `View ID ${ view.view_id }`,
        layers: get(view, ["metadata", "tiles", "layers"], [])
          .map(layer => ({
            layerId: layer.id,
            type: layer.type,
            show: true,
            minZoom: null,
            maxZoom: null,
            paintProperties: {}
          }))
      }))
    })
  }, [views, reset]);

  const layers = React.useMemo(() => {
    return [new SymbologyLayer(views)];
  }, [views]);

  const layerProps = React.useMemo(() => {
    return {
      "symbology-layer": {
        source, setSymbology, startNewSymbology, symbology,
        activeViewId, /*setActiveViewId,*/ activeView,
        activeLayerId, setActiveLayerId, activeLayer,
        activePaintPropertyId, setActivePaintPropertyId, activePaintProperty,
        paintPropertyActions, activePaintPropertyAction, setActivePaintPropertyAction
      }
    }
  }, [source, setSymbology, startNewSymbology, symbology,
        activeViewId, /*setActiveViewId,*/ activeView,
        activeLayerId, setActiveLayerId, activeLayer,
        activePaintPropertyId, setActivePaintPropertyId, activePaintProperty,
        paintPropertyActions, activePaintPropertyAction, setActivePaintPropertyAction
      ]
  );

  return (
    <div className="w-full h-[800px]">
      <ComponentLibrary components={ NewLibraryComponents }>
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
      </ComponentLibrary>
    </div>
  )
}

export default SymbologyEditor
