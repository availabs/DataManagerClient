import React from "react"

import get from "lodash/get"

import { DamaContext } from "~/pages/DataManager/store"

import {
  Button,
  Input,
  MultiLevelSelect,
  getColorRange,
  useClickOutside,
  useTheme
} from "~/modules/avl-map-2/src"

import FilterItem from "./FilterItem"

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
    MapActions
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
    ).then(() => {})
  }, [falcor, pgEnv, activeViewId, symbology, savedSymbologies]);

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

const getDisplayItem = remove =>
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
      <div className="flex bg-gray-200 hover:bg-gray-300 px-2 py-1 items-center"
        onClick={ stopPropagation }
      >
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

  const symbology = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "symbology"], null);
  }, [props]);
  const setSymbology = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "setSymbology"], null);
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
            onChange={ setSymbology }
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
          symbology={ symbology }
          activeViewId={ activeViewId }
          MapActions={ props.MapActions }/>
      </div>

      <div>
        { !symbology ? null :
          <Symbology { ...props }
            symbology={ symbology }
            setSymbology={ setSymbology }
            variables={ variables }/>
        }
      </div>
    </div>
  )
}
export default SymbologyPanel;

const NameEditor = ({ value, onChange }) => {
  const [editing, setEditing] = React.useState(!Boolean(value));
  React.useEffect(() => {
    if (!value) {
      setEditing(true);
    }
  }, [value]);
  const stopEditing = React.useCallback(e => {
    e.stopPropagation();
    setEditing(!Boolean(value));
  }, [value]);
  const startEditing = React.useCallback(e => {
    e.stopPropagation();
    setEditing(true);
  }, []);
  const onKeyUp = React.useCallback(e => {
    if ((e.key === "Enter") || (e.keyCode === 13)) {
      setEditing(false);
    }
  }, []);
  const doOnChange = React.useCallback(e => {
    onChange(e.target.value);
  }, [onChange]);

  const [inputRef, setInputRef] = React.useState(null);
  React.useEffect(() => {
    inputRef && inputRef.focus();
  }, [inputRef]);

  const [outterRef, setOutterRef] = React.useState(null);
  useClickOutside(outterRef, stopEditing);
  return (
    <div ref={ setOutterRef }
      className="flex"
    >
      { editing ?
        <input ref={ setInputRef }
          className="px-2 py-1 flex-1 outline outline-1 rounded cursor-point"
          placeholder="enter symbology name"
          value={ value }
          onChange={ doOnChange }
          onKeyUp={ onKeyUp }/> :
        <div className="px-2 py-1 flex-1">
          { value || "enter symbology name" }
        </div>
      }
      <Button className="buttonPrimary ml-1" onClick={ editing ? stopEditing : startEditing }>
        <span className="fas fa-pen-to-square"/>
      </Button>
    </div>
  )
}

const viewDisplayAccessor = v => v.version || `View ID: ${ v.viewId }`;
const viewValueAccessor = v => v.viewId;

const Symbology = ({ symbology, setSymbology, ...props }) => {
  const updateSymbologyName = React.useCallback(name => {
    setSymbology(prev => ({
      ...prev,
      name
    }));
  }, [setSymbology]);

  const activeViewId = get(props, ["layerProps", "symbology-layer", "activeViewId"], null);
  const setActiveViewId = get(props, ["layerProps", "symbology-layer", "setActiveViewId"], null);
  const activeView = get(props, ["layerProps", "symbology-layer", "activeView"], null);

  return (
    <div>
      <div className="flex pb-1 border-b border-current">
        <div className="mr-1 py-1 font-bold">Name:</div>
        <div className="flex-1">
          <NameEditor value={ symbology.name }
            onChange={ updateSymbologyName }/>
        </div>
      </div>
      <div className="pt-1">
        <div>
          <MultiLevelSelect
            removable={ false }
            options={ symbology.views }
            value={ activeViewId }
            onChange={ setActiveViewId }
            displayAccessor={ viewDisplayAccessor }
            valueAccessor={ viewValueAccessor }/>
        </div>
        { !activeView ? null :
          <ViewItem key={ activeView.viewId }
            { ...props } view={ activeView }
            setSymbology={ setSymbology }/>
        }
      </div>
    </div>
  )
}

const ViewItem = ({ view, ...props }) => {
  const setSymbology = get(props, ["layerProps", "symbology-layer", "setSymbology"], null);
  const activeView = get(props, ["layerProps", "symbology-layer", "activeView"], null);
  const activeLayerId = get(props, ["layerProps", "symbology-layer", "activeLayerId"], null);
  const setActiveLayerId = get(props, ["layerProps", "symbology-layer", "setActiveLayerId"], null);
  const activeLayer = get(props, ["layerProps", "symbology-layer", "activeLayer"], null);

  const copyLayer = React.useCallback(e => {
    e.stopPropagation();
    const maxCopy = activeView.layers
      .filter(l => l.layerId === activeLayer.layerId)
      .reduce((a, c) => {
        return Math.max(+a, +c.copy);
      }, 0)
    const layer = {
      uniqueId: `${ activeLayer.layerId }-${ Date.now() }-${ performance.now() }`,
      copy: maxCopy + 1,
      layerId: activeLayer.layerId,
      type: activeLayer.type,
      show: true,
      minZoom: null,
      maxZoom: null,
      paintProperties: {},
      filters: {}
    }
    setSymbology(prev => {
      return {
        ...prev,
        views: prev.views.map(view => {
          if (view.viewId === activeView.viewId) {
            return {
              ...view,
              layers: [
                ...view.layers,
                layer
              ]
            }
          }
          return view;
        })
      }
    })
    setActiveLayerId(layer.uniqueId);
  }, [setSymbology, activeView, activeLayer, setActiveLayerId]);

  const removeLayerCopy = React.useCallback(uid => {
    if (uid === activeLayer.uniqueId) {
      setActiveLayerId(null);
    }
    setSymbology(prev => {
      return {
        ...prev,
        views: prev.views.map(view => {
          if (view.viewId === activeView.viewId) {
            return {
              ...view,
              layers: view.layers.filter(layer => layer.uniqueId !== uid)
            }
          }
          return view;
        })
      }
    })
  }, [setSymbology, activeView, activeLayer, setActiveLayerId]);

  const Options = React.useMemo(() => {
    return view.layers.map(layer => {
      if (layer.copy) {
        return {
          ...layer,
          DisplayItem: getDisplayItem(removeLayerCopy)
        }
      }
      return layer;
    })
  }, [view.layers, removeLayerCopy]);

  return (
    <div>
      <div className="ml-4 pt-1">
        <div className="flex items-center">
          <div className="flex-1 mr-1">
            <MultiLevelSelect
              removable={ false }
              options={ Options }
              value={ activeLayerId }
              onChange={ setActiveLayerId }
              displayAccessor={ v => `Layer ID: ${ v.layerId } (${ v.copy })` }
              valueAccessor={ v => v.uniqueId }/>
          </div>
          <div>
            <Button className="py-2 button"
              onClick={ copyLayer }
            >
              <span className="fas fa-plus"/>
            </Button>
          </div>
        </div>
        { !activeLayer ? null :
          <LayerItem key={ activeLayer.uniqueId }
            { ...props } layer={ activeLayer }/>
        }
      </div>
    </div>
  )
}

const PaintProperties = {
  fill: ["fill-color", "fill-opacity"],
  circle: ["circle-color", "circle-opacity", "circle-radius"],
  line: ["line-color", "line-opacity", "line-width", "line-offset"]
}

const MultiSelectDisplay = ({ children }) => {
  return (
    <div className="px-2 py-1 bg-white outline outline-1 outline-current rounded">
      { children }
    </div>
  )
}

const VariableAccessor = v => v.variableId;

const LayerItem = ({ layer, setSymbology, variables, ...props }) => {

  const { uniqueId, type: layerType  } = layer;

  const paintProperties = React.useMemo(() => {
    return get(PaintProperties, layerType, []);
  }, [layerType]);

  const activePaintPropertyId = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "activePaintPropertyId"], null);
  }, [props.layerProps]);
  const setActivePaintPropertyId = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "setActivePaintPropertyId"], null);
  }, [props.layerProps]);

  const activeFilterVariableId = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "activeFilterVariableId"], null);
  }, [props.layerProps]);
  const setActiveFilterVariableId = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "setActiveFilterVariableId"], null);
  }, [props.layerProps]);

  const addPaintProperty = React.useCallback(ppId => {
    setActivePaintPropertyId(ppId);
    setSymbology(prev => {
      return {
        ...prev,
        views: prev.views.map(view => ({
          ...view,
          layers: view.layers.map(layer => {
            if (layer.uniqueId === uniqueId) {
              return {
                ...layer,
                paintProperties: {
                  ...layer.paintProperties,
                  [ppId]: {
                    value: null,
                    paintExpression: null,
                    variable: null
                  }
                }
              }
            }
            return layer;
          })
        }))
      }
    });
  }, [setSymbology, uniqueId, setActivePaintPropertyId]);

  const removePaintProperty = React.useCallback(ppId => {
    if (activePaintPropertyId === ppId) {
      setActivePaintPropertyId(null);
    }
    setSymbology(prev => {
      return {
        ...prev,
        views: prev.views.map(view => ({
          ...view,
          layers: view.layers.map(layer => {
            if (layer.uniqueId === uniqueId) {
              const paintProperties = {
                ...layer.paintProperties
              }
              delete paintProperties[ppId];
              return {
                ...layer,
                paintProperties
              }
            }
            return layer;
          })
        }))
      }
    });
  }, [setSymbology, uniqueId, activePaintPropertyId, setActivePaintPropertyId]);

  const addFilter = React.useCallback(vid => {
    setActiveFilterVariableId(vid);
    setSymbology(prev => {
      return {
        ...prev,
        views: prev.views.map(view => ({
          ...view,
          layers: view.layers.map(layer => {
            if (layer.uniqueId === uniqueId) {
              return {
                ...layer,
                filters: {
                  ...layer.filters,
                  [vid]: {
                    filter: [],
                    filterExpression: null
                  }
                }
              }
            }
            return layer;
          })
        }))
      }
    });
  }, [setSymbology, uniqueId, setActiveFilterVariableId]);

  const removeFilter = React.useCallback(vid => {
    if (activeFilterVariableId === vid) {
      setActiveFilterVariableId(null);
    }
    setSymbology(prev => {
      return {
        ...prev,
        views: prev.views.map(view => ({
          ...view,
          layers: view.layers.map(layer => {
            if (layer.uniqueId === uniqueId) {
              const filters = {
                ...layer.filters
              }
              delete filters[vid];
              return {
                ...layer,
                filters
              }
            }
            return layer;
          })
        }))
      }
    });
  }, [setSymbology, uniqueId, activeFilterVariableId, setActiveFilterVariableId]);

  const metaVariables = React.useMemo(() => {
    return variables.filter(v => {
      return v.type === "meta-variable";
    })
  }, [variables]);

  return (
    <div>
      <div className="ml-4">
        <div>Layer Type: { layer.type }</div>

        <div className="relative">
          <div className="mb-1">
            <MultiLevelSelect isDropdown
              options={ paintProperties }
              onChange={ addPaintProperty }
            >
              <MultiSelectDisplay>
                Add a Paint Property
              </MultiSelectDisplay>
            </MultiLevelSelect>
          </div>
          <div className="ml-4 grid grid-cols-1 gap-1">
            { Object.keys(layer.paintProperties)
                .map((pp, i)=> (
                  <PaintPropertyItem key={ pp } { ...props }
                    layer={ layer }
                    ppId={ pp }
                    variables={ variables }
                    paintProperty={ layer.paintProperties[pp] }
                    setSymbology={ setSymbology }
                    removePaintProperty={ removePaintProperty }/>
                ))
            }
          </div>
        </div>

        { !metaVariables.length ? null :
          <div className="relative">
            <div className="mb-1">
              <MultiLevelSelect isDropdown
                options={ metaVariables }
                displayAccessor={ VariableAccessor }
                valueAccessor={ VariableAccessor }
                onChange={ addFilter }
              >
                <MultiSelectDisplay>
                  Add a Filter
                </MultiSelectDisplay>
              </MultiLevelSelect>
            </div>
            <div className="ml-4 grid grid-cols-1 gap-1">
              { Object.keys(layer.filters)
                  .map((vid, i)=> (
                    <FilterItem key={ vid } { ...props }
                      layer={ layer }
                      variableId={ vid }
                      filter={ layer.filters[vid] }
                      setSymbology={ setSymbology }
                      removeFilter={ removeFilter }/>
                  ))
              }
            </div>
          </div>
        }

      </div>
    </div>
  )
}

const makeNewVarialbe = (variable, ppId) => {
  const newVar = {
    variableId: variable.variableId,
    displayName: variable.variableId,
    type: variable.type,
    filter: [],
    filterExpression: null,
    paintExpression: null,
    includeInLegend: ppId.includes("color") ? true : false,
    scale: {
      type: variable.type === "data-variable" ? "quantile" : "ordinal",
      domain: [],
      range: []
    }
  }
  if (ppId.includes("color")) {
    newVar.scale.color = variable.type === "data-variable" ? "BrBG" : "Set3";
    newVar.scale.domain = [];
    newVar.scale.range = getColorRange(7, newVar.scale.color);
    newVar.scale.defaultValue = "rgba(0, 0, 0, 0)";
    newVar.scale.reverse = false;
  }
  if (ppId.includes("opacity")) {
    newVar.scale.range = [0.2, 0.4, 0.6, 0.8];
    newVar.scale.step = 0.2;
    newVar.scale.defaultValue = 0;
  }
  if (ppId.includes("width")) {
    newVar.scale.range = [1, 2, 3, 4, 5, 6, 7];
    newVar.scale.step = 1;
    newVar.scale.defaultValue = 0;
  }
  if (ppId.includes("offset")) {
    newVar.scale.range = [1, 2, 3, 4, 5, 6, 7];
    newVar.scale.step = 1;
    newVar.scale.defaultValue = 0;
  }
  if (ppId.includes("radius")) {
    newVar.scale.range = [5, 10, 15, 20, 25];
    newVar.scale.step = 5;
    newVar.scale.defaultValue = 0;
  }
  return newVar;
}

const ActivePPToggle = ({ setActive, ppId, isActive }) => {
  const doSetActive = React.useCallback(() => {
    setActive(ppId);
  }, [setActive, ppId]);
  const theme = useTheme();
  return (
    <div>
      <span onClick={ doSetActive }
        className={ `
          cursor-pointer
          ${ isActive ? `fa fa-toggle-on ${ theme.textHighlight }` :
            "fa fa-toggle-off text-gray-500"
          }
        ` }/>
    </div>

  )
}

const Radio = ({ value, onChange, isActive }) => {
  const doOnChange = React.useCallback(e => {
    onChange(value);
  }, [onChange, value]);
  const theme = useTheme();
  return (
    <div onClick={ doOnChange }
      style={ { padding: "0.125rem" } }
      className={ `
        cursor-pointer p-1 border rounded-full mb-1
        ${ isActive ? theme.borderHighlight : "border-gray-500" }
      ` }
    >
      <div className={ `
          w-2 h-2 rounded-full
          ${ isActive ? theme.bgHighlight : "bg-gray-500" }
        ` }/>
    </div>
  )
}
const RadioGroup = ({ value, onChange, options = [] }) => {
  return (
    <div>
      { options.map(opt => (
          <div key={ opt.value } className="flex pr-8 items-center">
            <div className="flex-1">{ opt.label }</div>
            <Radio value={ opt.value }
              onChange={ onChange }
              isActive={ value === opt.value }/>
          </div>
        ))
      }
    </div>
  )
}

const RadioOptions = [
  { label: "Select a Value:",
    value: "value"
  },
  { label: "Write an Expression:",
    value: "expression"
  },
  { label: "Add a Variable:",
    value: "variable"
  }
]

const RemovePaintPropertyButton = ({ removePaintProperty }) => {
  const [seconds, setSeconds] = React.useState(0);
  const timeout = React.useRef();

  React.useEffect(() => {
    if (seconds > 0) {
      timeout.current = setTimeout(setSeconds, 1000, seconds - 1);
    }
  }, [seconds]);

  const onClick = React.useCallback(e => {
    e.stopPropagation();
    if (seconds === 0) {
      setSeconds(3);
    }
    else {
      setSeconds(0);
      clearTimeout(timeout.current);
      removePaintProperty();
    }
  }, [removePaintProperty, seconds]);

  return (
    <div className="cursor-pointer px-1 relative text-red-500 hover:bg-gray-500 rounded"
      onClick={ onClick }
    >
      { !seconds ? null :
        <span className="absolute inset-0 flex items-center justify-center text-white font-bold">
          { seconds }
        </span>
      }
      <span className="fa fa-trash"/>
    </div>
  )
}

const PaintPropertyItem = props => {

  const {
    ppId,
    paintProperty,
    layer,
    variables,
    setSymbology,
    layerProps,
    removePaintProperty
  } = props;

  const { uniqueId } = layer;

  const doRemovePaintProperty = React.useCallback(e => {
    removePaintProperty(ppId);
  }, [ppId, removePaintProperty]);

  const activePaintPropertyId = React.useMemo(() => {
    return get(layerProps, ["symbology-layer", "activePaintPropertyId"], null);
  }, [layerProps]);
  const setActivePaintPropertyId = React.useMemo(() => {
    return get(layerProps, ["symbology-layer", "setActivePaintPropertyId"], null);
  }, [layerProps]);

  const isActive = activePaintPropertyId === ppId;

  const action = React.useMemo(() => {
    return get(layerProps, ["symbology-layer", "paintPropertyActions", ppId], null);
  }, [layerProps]);
  const [prevAction, setPrevAction] = React.useState(action);

  const setActivePaintPropertyAction = React.useMemo(() => {
    return get(layerProps, ["symbology-layer", "setActivePaintPropertyAction"], null);
  }, [layerProps]);

  const setAction = React.useCallback(action => {
    setActivePaintPropertyAction(ppId, action);
    if (action !== prevAction) {
      setSymbology(prev => {
        return {
          ...prev,
          views: prev.views.map(view => ({
            ...view,
            layers: view.layers.map(layer => {
              if (layer.uniqueId === uniqueId) {
                return {
                  ...layer,
                  paintProperties: Object.keys(layer.paintProperties)
                    .reduce((a, pp) => {
                      if (pp === ppId) {
                        a[pp] = {
                          value: null,
                          paintExpression: null,
                          variable: null
                        }
                      }
                      else {
                        a[pp] = layer.paintProperties[pp];
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
      setPrevAction(action);
    }
  }, [setActivePaintPropertyAction, ppId, setSymbology, uniqueId, prevAction]);

  const addVariable = React.useCallback(vid => {

    const variable = variables.reduce((a, c) => {
      return c.variableId === vid ? c : a;
    }, null);

    setSymbology(prev => {
      return {
        ...prev,
        views: prev.views.map(view => ({
          ...view,
          layers: view.layers.map(layer => {
            if (layer.uniqueId === uniqueId) {
              return {
                ...layer,
                paintProperties: Object.keys(layer.paintProperties)
                  .reduce((a, pp) => {
                    if (pp === ppId) {
                      a[pp] = {
                        value: null,
                        paintExpression: null,
                        variable: makeNewVarialbe(variable, ppId)
                      }
                    }
                    else {
                      a[pp] = layer.paintProperties[pp];
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
  }, [setSymbology, uniqueId, ppId, variables]);

  const updateVariableDispayName = React.useCallback(dn => {
    setSymbology(prev => {
      return {
        ...prev,
        views: prev.views.map(view => ({
          ...view,
          layers: view.layers.map(layer => {
            if (layer.uniqueId === uniqueId) {
              return {
                ...layer,
                paintProperties: Object.keys(layer.paintProperties)
                  .reduce((a, pp) => {
                    if (pp === ppId) {
                      a[pp] = {
                        value: null,
                        paintExpression: null,
                        variable: {
                          ...layer.paintProperties[pp].variable,
                          displayName: dn
                        }
                      }
                    }
                    else {
                      a[pp] = layer.paintProperties[pp];
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
  }, [setSymbology, uniqueId, ppId, paintProperty.variable]);

  const theme = useTheme();

  return (
    <div className="border-b border-current py-1">
      <div className="flex items-center">
        <ActivePPToggle
          setActive={ setActivePaintPropertyId }
          ppId={ ppId }
          isActive={ activePaintPropertyId === ppId }/>
        <div className="ml-1 flex-1">
          Paint Property: { ppId }
        </div>
        <RemovePaintPropertyButton
          removePaintProperty={ doRemovePaintProperty }/>
      </div>
      <div className={ `
          ${ isActive ? "block" : "invisible h-0 overflow-hidden" }
        ` }
      >
        <div>
          <RadioGroup
            options={ RadioOptions }
            value={ action }
            onChange={ setAction }/>
        </div>
        { action !== "variable" ? null :
          <VariableAdder
            options={ variables }
            onChange={ addVariable }
            value={ paintProperty.variable?.variableId }/>
        }
        { !paintProperty.variable || !ppId.includes("color") ? null :
          <div className="flex flex-col items-center mt-1 relative">
            <div className="mr-1 whitespace-nowrap w-full">
              Legend Display Name:
            </div>
            <div className="w-full">
              <Input
                value={ paintProperty.variable?.displayName }
                onChange={ updateVariableDispayName }/>
            </div>
          </div>
        }
      </div>
    </div>
  )
}

const VariableAdder = ({ onChange, value, options }) => {
  return (
    <div className="flex items-center">
      <div>
        Variable:
      </div>
      <div className="ml-1 flex-1">
        <MultiLevelSelect
          removable={ false }
          options={ options }
          displayAccessor={ VariableAccessor }
          valueAccessor={ VariableAccessor }
          onChange={ onChange }
          value={ value }/>
      </div>
    </div>
  )
}
