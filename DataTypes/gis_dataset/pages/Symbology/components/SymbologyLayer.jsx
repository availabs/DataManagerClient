import React from "react"

import get from "lodash/get"

import { DamaContext } from "~/pages/DataManager/store"

import {
  AvlLayer,
  Button,
  getScale
} from "~/modules/avl-map-2/src"

import SymbologyInfoBox from "./SymbologyInfoBox"
import MetaVariableFilterEditor from "./MetaVariableFilterEditor"
import SymbologyLegend from "./SymbologyLegend"

import { DAMA_HOST } from "~/config"

export const SymbologyLayerRenderComponent = props => {

  const {
    maplibreMap,
    resourcesLoaded,
    setLayerVisibility,
    layer: avlLayer
  } = props;

  const activeView = get(props, ["layerProps", "activeView"], null);

  const [legend, setLegend] = React.useState(null);

  React.useEffect(() => {
    if (!maplibreMap) return;
    if (!resourcesLoaded) return;
    if (!activeView) return;

    let legend = null;

    const defaultPaints = avlLayer.layers.reduce((a, c) => {
      a[c.id] = c.paint;
      return a;
    }, {});

    avlLayer.layers.forEach(layer => {
      setLayerVisibility(layer.id, "none");
    });

    activeView.layers.forEach(layer => {
      const defaultPaint = { ...defaultPaints[layer.layerId] };

      Object.keys(layer.paintProperties)
        .forEach(ppId => {

          const paintProperty = get(layer, ["paintProperties", ppId], {});

          const {
            value,
            paintExpression,
            variable
          } = paintProperty;

          if (value) {
            delete defaultPaint[ppId];
            maplibreMap.setPaintProperty(layer.layerId, ppId, value);
          }
          else if (paintExpression) {
            delete defaultPaint[ppId];
            maplibreMap.setPaintProperty(layer.layerId, ppId, paintExpression);
          }
          else if (variable) {
            delete defaultPaint[ppId];

            const { paintExpression, scale } = variable;

            if (ppId.includes("color")) {
              legend = {
                name: variable.displayName,
                ...scale
              };
            }

            maplibreMap.setPaintProperty(layer.layerId, ppId, paintExpression);
          }
        })

        Object.values(layer.filters || {})
          .forEach(({ filterExpression }) => {
            maplibreMap.setFilter(layer.layerId, filterExpression)
          })
      setLayerVisibility(layer.layerId, "visible");

      Object.keys(defaultPaint)
        .forEach(ppId => {
          maplibreMap.setPaintProperty(layer.layerId, ppId, defaultPaint[ppId]);
        })
    })

    setLegend(legend);

  }, [maplibreMap, resourcesLoaded, activeView,
      setLayerVisibility, avlLayer
    ]
  )

  return !legend ? null : (
    <div className="p-1 pointer-events-auto bg-gray-100 rounded min-w-fit"
      style={ {
        width: "100%",
        maxWidth: legend.isVertical ? "10rem" : "25rem"
      } }
    >
      <div className="bg-gray-300 border border-current rounded p-1">
        <div className="font-bold">
          { legend.name }
        </div>
        <div>
          <SymbologyLegend { ...legend }/>
        </div>
      </div>
    </div>
  );
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

const $HOST = `${ DAMA_HOST }/tiles`

const getValidSources = sources => {
  return sources.map(src => {
    const { id, source: { url, type } } = src;
    return {
      id,
      source: {
        type,
        url: url.replace("$HOST", $HOST)
      }
    }
  });
}

const SymbologyEditorModal = props => {

  const symbology = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "symbology"], null);
  }, [props.layerProps]);
  const setSymbology = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "setSymbology"], null);
  }, [props.layerProps]);

  const [edit, setEdit] = React.useState(JSON.stringify(symbology, null, 3));
  const onChange = React.useCallback(e => {
    setEdit(e.target.value);
  }, []);

  const saveSymbology = React.useCallback(e => {
    setSymbology(JSON.parse(edit));
  }, [setSymbology, edit]);

  return (
    <div className="whitespace-pre-wrap relative h-fit"
      style={ {
        width: "calc(100vw - 320px)",
        minHeight: "calc(100vh - 180px)"
      } }
    >
      <Button className="buttonPrimary mb-1"
        onClick={ saveSymbology }
      >
        Save Symbology
      </Button>
      <div className="absolute mt-9 inset-0">
        <textarea className="block w-full h-full p-1 rounded scrollbar"
          style={ { resize: "none" } }
          value={ edit }
          onChange={ onChange }/>
      </div>
    </div>
  )
}

class SymbologyLayer extends AvlLayer {
  constructor(views) {
    super();

    this.id = "symbology-layer";
    this.name = "Symbology Layer";

    this.startActive = true;

    // const [sources, layers] = views.reduce((a, c) => {
    //   const sources = get(c, ["metadata", "tiles", "sources"], []);
    //   a[0].push(...sources);
    //   const layers = get(c, ["metadata", "tiles", "layers"], [])
    //     .map(layer => ({ ...layer, layout: { visibility: "none" } }));
    //   a[1].push(...layers);
    //   return a;
    // }, [[], []]);
    //
    // this.sources = getValidSources(sources);
    // this.layers = layers;
  }
  // RenderComponent = SymbologyLayerRenderComponent;
  infoBoxes = [
    { Header: SymbologyInfoBoxHeader,
      Component: SymbologyInfoBox
    },
    { Header: "Filter Editor",
      Component: MetaVariableFilterEditor,
      startOpen: false,
      isActive: props => {
        const activeFilter = get(props, ["layerProps", "symbology-layer", "activeFilter"], null);
        return Boolean(activeFilter);
      }
    }
  ]
  modals = {
    "symbology-editor": {
      Component: SymbologyEditorModal,
      Header: "Symbology Editor (Edit at your own risk!!!)",
      startPos: [160, 90]
    }
  }
}
export default SymbologyLayer;
