import React from "react"

import get from "lodash/get"

import { DamaContext } from "~/pages/DataManager/store"

import { AvlLayer, getScale } from "~/modules/avl-map-2/src"

import SymbologyInfoBox from "./SymbologyInfoBox"

const SymbologyLayerRenderComponent = ({ maplibreMap, resourcesLoaded, ...props }) => {

  const symbology = get(props, ["layerProps", "symbology"], null);

  const [activeViewId, setActiveViewId] = React.useState(null);
  const [variables, setVariables] = React.useState([]);

  const { pgEnv, falcor, falcorCache  } = React.useContext(DamaContext);

  const getDataById = React.useCallback(() => {
    return get(falcorCache, ["dama", pgEnv, "viewsbyId", activeViewId, "databyId"], {});
  }, [falcorCache, pgEnv, activeViewId]);

  React.useEffect(() => {
    if (!activeViewId) return;
    falcor.get(["dama", pgEnv, "viewsbyId", activeViewId, "data", "length"])
  }, [falcor, pgEnv, activeViewId]);

  const [dataLength, setDataLength] = React.useState(0);
  React.useEffect(() => {
    if (!activeViewId) return;
    const dl = get(falcorCache, ["dama", pgEnv, "viewsbyId", activeViewId, "data", "length"], 0);
    setDataLength(dl);
  }, [falcorCache, pgEnv, activeViewId]);

  React.useEffect(() => {
    if (!(dataLength && variables.length)) return;
    falcor.get([
      "dama", pgEnv, "viewsbyId", activeViewId, "databyIndex",
      { from: 0, to: dataLength - 1 }, variables
    ])
  }, [falcor, pgEnv, activeViewId, dataLength, variables]);

  React.useEffect(() => {
    if (!symbology) return;

    const [view] = symbology.views;
    setActiveViewId(view.viewId);

    const variables = [];

    view.layers.forEach(layer => {
      Object.keys(layer.paintProperties || {})
        .forEach(ppId => {
          const variable = get(layer, ["paintProperties", ppId, "variable"], null);
          if (variable) {
            variables.push(variable.variableId);
            const scale = get(variable,"scale", null);
          }
        })
    });

    setVariables(variables);
  }, [symbology]);

  React.useEffect(() => {
    if (!symbology) return;
    if (!maplibreMap) return;
    if (!resourcesLoaded) return;

    symbology.views.forEach(view => {
      if (view.viewId !== activeViewId) return;

      view.layers.forEach(layer => {
        Object.keys(layer.paintProperties)
          .forEach(ppId => {
            const variable = get(layer, ["paintProperties", ppId, "variable"], null);
            if (variable) {
              const { type, domain, range } = variable.scale;

              const scale = getScale(type, domain, range);

              const dataById = getDataById();

              const colors = Object.keys(dataById)
                .reduce((a, c) => {
                  const value = get(dataById, [c, variable.variableId], null);
                  if ((value !== 'null') && (value !== null)) {
                    a[c] = scale(value);
                  }
                  return a;
                }, {});

              const exp = ["get", ["to-string", ["get", "ogc_fid"]], ["literal", colors]];
              maplibreMap.setPaintProperty(layer.layerId, ppId, exp);
              maplibreMap.setLayoutProperty(layer.layerId, "visibility", "visible");
            }
          })
      })
    })

  }, [maplibreMap, resourcesLoaded, symbology, activeViewId, getDataById])

  return null;
}

const SymbologyInfoBoxHeader = props => {
  const symName = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "symbology", "name"], null) || "Unnamed Symbology"
  }, [props.layerProps]);
  return (
    <div>
      { symName }
    </div>
  )
}

class SymbologyLayer extends AvlLayer {
  constructor(views) {
    super();

    this.id = "symbology-layer";
    this.name = "Symbology Layer";

    this.startActive = true;

    const [sources, layers] = views.reduce((a, c) => {
      const sources = get(c, ["metadata", "tiles", "sources"], []);
      a[0].push(...sources);
      const layers = get(c, ["metadata", "tiles", "layers"], [])
        .map(layer => ({ ...layer, layout: { visibility: "none" } }));
      a[1].push(...layers);
      return a;
    }, [[], []]);

    this.sources = sources;
    this.layers = layers;
  }
  RenderComponent = SymbologyLayerRenderComponent;
  infoBoxes = [
    { Header: SymbologyInfoBoxHeader,
      Component: SymbologyInfoBox
    }
  ]
}
export default SymbologyLayer;
