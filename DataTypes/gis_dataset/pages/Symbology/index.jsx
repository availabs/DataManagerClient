import React from "react"

import get from "lodash/get"

import { Protocol, PMTiles } from '~/pages/DataManager/utils/pmtiles/index.ts'

import {
  AvlMap as AvlMap2,
  ThemeProvider,
  ComponentLibrary,
  useTheme
} from "~/modules/avl-map-2/src"

import SymbologyPanel from "./components/SymbologyPanel"
import SymbologyLayer from "./components/SymbologyLayer"

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
  const [legend, setLegend] = React.useState(null);

  const startNewSymbology = React.useCallback(() => {
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
  }, [views]);

  const layers = React.useMemo(() => {
    return [new SymbologyLayer(views)];
  }, [views]);

  const layerProps = React.useMemo(() => {
    return {
      "symbology-layer": {
        source, setSymbology, startNewSymbology, symbology, legend, setLegend
      }
    }
  }, [source, setSymbology, startNewSymbology, symbology, legend, setLegend]);

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
