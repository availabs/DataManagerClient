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

const SymbologyEditor = ({ source, views }) => {

  const [symbology, setSymbology] = React.useState(null);

  const [activeViewId, _setActiveViewId] = React.useState(null);
  const [activeLayerId, _setActiveLayerId] = React.useState(null);
  const [activePaintProperty, setActivePaintProperty] = React.useState(null);
  const [paintPropertyActions, setPaintPropertyActions] = React.useState({});

  const reset = React.useCallback(() => {
    _setActiveViewId(null);
    _setActiveLayerId(null);
    setActivePaintProperty(null);
  }, []);

  const setActiveViewId = React.useCallback(vid => {
    _setActiveViewId(vid);
    setActiveLayerId(null);
    setActivePaintProperty(null);
  }, []);
  const setActiveLayerId = React.useCallback(lid => {
    _setActiveLayerId(lid);
    setActivePaintProperty(null);
  }, []);

  React.useEffect(() => {
    if (!symbology) {
      setActiveViewId(null);
    }
    else if (!activeViewId) {
      setActiveViewId(get(symbology, ["views", 0, "viewId"], null));
      setActiveLayerId(null);
      setActivePaintProperty(null);
    }
  }, [symbology, activeViewId]);
  React.useEffect(() => {
    if (!symbology) {
      setActiveLayerId(null);
    }
    else if (activeViewId && !activeLayerId) {
      const activeView = symbology.views
        .reduce((a, c) => {
          return c.viewId === activeViewId ? c : a;
        }, null);
      setActiveLayerId(get(activeView, ["layers", 0, "layerId"], null));
    }
  }, [symbology, activeViewId, activeLayerId]);
  React.useEffect(() => {
    if (!symbology) {
      setActivePaintProperty(null);
    }
    else if (activeViewId && activeLayerId && !activePaintProperty) {
      const activeView = symbology.views
        .reduce((a, c) => {
          return c.viewId === activeViewId ? c : a;
        }, null);
      const activeLayer = activeView.layers
        .reduce((a, c) => {
          return c.layerId === activeLayerId ? c : a;
        }, null);
      const [paintProperty] = Object.keys(activeLayer.paintProperties);
      setActivePaintProperty(paintProperty);
    }
  }, [symbology, activeViewId, activeLayerId, activePaintProperty]);

  const startNewSymbology = React.useCallback(() => {
    reset();
    setSymbology({
      name: "",
      views: views.map(view => ({
        viewId: view.view_id,
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
        activeViewId, setActiveViewId,
        activeLayerId, setActiveLayerId,
        activePaintProperty, setActivePaintProperty,
        paintPropertyActions, setPaintPropertyActions
      }
    }
  }, [source, setSymbology, startNewSymbology, symbology,
        activeViewId, setActiveViewId,
        activeLayerId, setActiveLayerId,
        activePaintProperty, setActivePaintProperty,
        paintPropertyActions, setPaintPropertyActions
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
