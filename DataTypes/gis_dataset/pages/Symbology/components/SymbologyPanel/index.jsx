import React from "react"

import get from "lodash/get"

import { DamaContext } from "~/pages/DataManager/store"

import {
  Button,
  MultiLevelSelect,
  useTheme
} from "~/modules/avl-map-2/src"

import SymbologyItem from "./SymbologyItem"

const NameRegex = /^\w+/;

const paintPropertyHasValue = paintProperty => {
  if (paintProperty.value !== null) return true;
  if (paintProperty.paintExpression !== null) return true;
  return Boolean(get(paintProperty, ["variable", "paintExpression", "length"], 0));
}

const SymbologyButtons = props => {

  const {
    startNewSymbology,
    symbology,
    savedSymbologies,
    activeViewId,
    MapActions,
    startLoading,
    stopLoading
  } = props;

  const okToSave = React.useMemo(() => {
    if (!symbology) return false;
    if (!symbology.name) return false;
    if (!NameRegex.test(symbology.name)) return false;
    const length = get(symbology, "views", [])
      .filter(view => view.viewId == activeViewId)
      .filter(view => {
        return view.layers.reduce((a, c) => {
          return Object.keys(c.paintProperties)
            .reduce((aa, cc) => {
              return aa || paintPropertyHasValue(c.paintProperties[cc]);
            }, a)
        }, false)
      }).length;
    return Boolean(length);
  }, [symbology, activeViewId]);

  const { falcor, pgEnv } = React.useContext(DamaContext);

  const saveSymbology = React.useCallback(() => {
    startLoading();
    const toSave = {
      name: symbology.name,
      id: symbology.id,
      views: symbology.views
        .filter(view => view.viewId == activeViewId)
    };
    const symbologies = [
      ...savedSymbologies.filter(s => s.id !== toSave.id),
      toSave
    ];
    falcor.call(
      ["dama", "views", "metadata", "update"],
      [pgEnv, activeViewId, { symbologies }]
    ).then(() => stopLoading())
  }, [falcor, pgEnv, activeViewId, symbology, savedSymbologies,
      startLoading, stopLoading
      ]
  );

  const openEditModal = React.useCallback(e => {
    MapActions.openModal("symbology-layer", "symbology-editor");
  }, [MapActions.openModal]);

  return (
    !symbology ? (
      <Button className="buttonBlock"
        onClick={ startNewSymbology }
      >
        Start New Symbology
      </Button>
    ) : (
      <div className="flex">
        <div className="flex-1 mr-1">
          <Button className="buttonBlock"
            onClick={ saveSymbology }
            disabled={ !okToSave }
          >
            Save Symbology
          </Button>
        </div>
        <div className="mr-1">
          <Button className="buttonDanger"
            onClick={ startNewSymbology }
          >
            New
          </Button>
        </div>
        <Button className="buttonPrimary"
          onClick={ openEditModal }
        >
          <span className="fas fa-pen-to-square"/>
        </Button>
      </div>
    )
  )
}

export const getDisplayItem = remove =>
  ({ children, value }) => {

    const [seconds, setSeconds] = React.useState(0);
    const timeout = React.useRef();

    React.useEffect(() => {
      if (seconds > 0) {
        timeout.current = setTimeout(setSeconds, 1000, seconds - 1);
      }
    }, [seconds]);

    const stopPropagation = React.useCallback(e => {
      e.stopPropagation();
    }, []);

    const onClick = React.useCallback(e => {
      e.stopPropagation();
      if (seconds === 0) {
        setSeconds(3);
      }
      else {
        setSeconds(0);
        clearTimeout(timeout.current);
        remove(value);
      }
    }, [value, seconds]);

    return (
      <div className="flex bg-gray-200 hover:bg-gray-300 px-2 py-1 items-center">
        <div className="flex-1">{ children }</div>
        <div className="relative">
          { !seconds ? null :
            <span className={ `
                absolute inset-0 flex items-center justify-center
                text-white font-bold pointer-events-none
              ` }
            >
              { seconds }
            </span>
          }
          <span onClick={ onClick }
            className={ `
              cursor-pointer text-red-500 hover:bg-gray-500 rounded
              fas fa-trash rounded px-2 py-1
            ` }/>
        </div>
      </div>
    )
  }

const SymbologyPanel = props => {

  const startLayerLoading = React.useCallback(() => {
    props.MapActions.startLayerLoading("symbology-layer");
  }, [props.MapActions.startLayerLoading]);
  const stopLayerLoading = React.useCallback(() => {
    props.MapActions.stopLayerLoading("symbology-layer");
  }, [props.MapActions.stopLayerLoading]);

  const symbology = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "symbology"], null);
  }, [props]);
  const setSymbology = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "setSymbology"], null);
  }, [props]);
  const loadSavedSymbology = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "loadSavedSymbology"], null);
  }, [props]);
  const startNewSymbology = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "startNewSymbology"], null);
  }, [props]);

  const savedSymbologies = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "savedSymbologies"], null);
  }, [props]);

  const source = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "source"], null);
  }, [props]);

  const columns = React.useMemo(() => {
    const cols = get(source, ["metadata", "columns"], get(source, "metadata", []));
    if (Array.isArray(cols)) {
      return cols;
    }
    return [];
  }, [source]);

  const dataVariables = React.useMemo(() => {
    return columns
      .filter(md => md.display === "data-variable")
        .map(dv => ({ variableId: dv.name, type: dv.display }))
        .sort((a, b) => a.variableId.localeCompare(b.variableId));
  }, [columns]);

  const metaVariables = React.useMemo(() => {
    return columns
      .filter(md => md.display === "meta-variable")
        .map(dv => ({ variableId: dv.name, type: dv.display }))
        .sort((a, b) => a.variableId.localeCompare(b.variableId));
  }, [columns]);

  const variables = React.useMemo(() => {
    return [...dataVariables, ...metaVariables];
  }, [dataVariables, metaVariables]);

  const { falcor, pgEnv } = React.useContext(DamaContext);

  const activeViewId = get(props, ["layerProps", "symbology-layer", "activeViewId"], null);

  const removeSavedSymbology = React.useCallback(sym => {
    const [{ viewId }] = sym.views;
    const symbologies = savedSymbologies.filter(s => s.id !== sym.id);
    falcor.call(
      ["dama", "views", "metadata", "update"],
      [pgEnv, viewId, { symbologies }]
    ).then(() => {});
  }, [falcor, pgEnv, savedSymbologies]);

  const DisplayItem = React.useMemo(() => {
    return getDisplayItem(removeSavedSymbology);
  }, [removeSavedSymbology]);

  return (
    <div className="absolute inset-0 overflow-visible scrollbar-sm p-1">
      { !savedSymbologies.length ? null :
        <div className="mb-1 pb-1 border-b border-current">
          <MultiLevelSelect isDropdown
            DisplayItem={ DisplayItem }
            displayAccessor={ s => s.name }
            options={ savedSymbologies }
            value={ symbology }
            onChange={ loadSavedSymbology }
          >
            <div className="px-2 py-1 rounded bg-white hover:outline hover:outline-1">
              Load and Edit a Symbology
            </div>
          </MultiLevelSelect>
        </div>
      }
      <div className="mb-1 pb-1 border-b border-current">
        <SymbologyButtons
          startNewSymbology={ startNewSymbology }
          savedSymbologies={ savedSymbologies }
          startLoading={ startLayerLoading }
          stopLoading={ stopLayerLoading }
          symbology={ symbology }
          activeViewId={ activeViewId }
          MapActions={ props.MapActions }/>
      </div>

      <div>
        { !symbology ? null :
          <SymbologyItem { ...props }
            symbology={ symbology }
            setSymbology={ setSymbology }
            variables={ variables }/>
        }
      </div>
    </div>
  )
}
export default SymbologyPanel;
