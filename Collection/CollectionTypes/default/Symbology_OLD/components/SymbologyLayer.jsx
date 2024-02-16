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

  const [legends, setLegends] = React.useState([]);

  React.useEffect(() => {
    if (!maplibreMap) return;
    if (!resourcesLoaded) return;
    if (!activeView) return;

    const legends = activeView.layers.reduce((a, c) => {
      return Object.values(c.paintProperties)
        .reduce((aa, cc) => {
          if (cc.variable && cc.variable.includeInLegend) {
            aa.push({
              name: cc.variable.displayName,
              ...cc.variable.scale
            })
          }
          return aa;
        }, a)
    }, []);

    setLegends(legends);

  }, [maplibreMap, resourcesLoaded, activeView]);

  return !legends.length ? null : (
    <div className="p-1 pointer-events-auto bg-gray-100 rounded min-w-fit grid grid-cols-1 gap-1"
      style={ {
        width: "100%",
        maxWidth: "25rem"
      } }
    >
      { legends.map((legend, i) => (
          <div key={ i } className="bg-gray-300 border border-current rounded p-1">
            <div className="font-bold">
              { legend.name }
            </div>
            <div>
              <SymbologyLegend { ...legend }/>
            </div>
          </div>
        ))
      }
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

const ExpressionEditorModal = props => {

  const setSymbology = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "setSymbology"], null);
  }, [props.layerProps]);

  const activeViewId = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "activeViewId"], null);
  }, [props.layerProps]);
  const activeLayerId = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "activeLayerId"], null);
  }, [props.layerProps]);
  const activePaintPropertyId = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "activePaintPropertyId"], null);
  }, [props.layerProps]);

  const activePaintProperty = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "activePaintProperty"], null);
  }, [props.layerProps]);

  const currentExpression = React.useMemo(() => {
    if (activePaintProperty.paintExpression) {
      return JSON.stringify(activePaintProperty.paintExpression);
    }
    return "";
  }, [activePaintProperty]);

  const [expression, setExpression] = React.useState(currentExpression);

  const onChange = React.useCallback(e => {
    setExpression(e.target.value);
  }, []);

  const saveExpression = React.useCallback(e => {
    setSymbology(prev => {
      return {
        ...prev,
        views: prev.views.map(view => {
          if (view.viewId === activeViewId) {
            return {
              ...view,
              layers: view.layers.map(layer => {
                if (layer.uniqueId === activeLayerId) {
                  return {
                    ...layer,
                    paintProperties: {
                      ...layer.paintProperties,
                      [activePaintPropertyId]: {
                        paintExpression: JSON.parse(expression)
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
      }
    });
  }, [setSymbology, expression, activeViewId, activeLayerId, activePaintProperty]);

  return (
    <div className="whitespace-pre-wrap relative h-fit"
      style={ {
        width: "calc(100vw - 320px)",
        minHeight: "calc(100vh - 180px)"
      } }
    >
      <Button className="buttonPrimary mb-1"
        onClick={ saveExpression }
        disabled={ !expression }
      >
        Save Expression
      </Button>
      <div className="absolute mt-9 inset-0">
        <textarea className="block w-full h-full p-1 rounded scrollbar"
          style={ { resize: "none" } }
          value={ expression }
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
  }
  RenderComponent = SymbologyLayerRenderComponent;
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
    },
    "expression-editor": {
      Component: ExpressionEditorModal,
      Header: "Expression Editor",
      startPos: [160, 90]
    }
  }
}
export default SymbologyLayer;
