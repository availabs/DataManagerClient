import React from "react"

import get from "lodash/get"

import {
  Button,
  MultiLevelSelect,
  getColorRange,
  useClickOutside,
  useTheme
} from "~/modules/avl-map-2/src"

const SymbologyButtons = ({ startNewSymbology, symbology }) => {
  return (
    !symbology ?
      <Button className="buttonBlock"
        onClick={ startNewSymbology }
      >
        Start New Symbology
      </Button> :
      <div className="flex">
        <div className="flex-1 mr-1">
          <Button className="buttonBlock"
            onClick={ null }
            disabled
          >
            Save Symbology
          </Button>
        </div>
        <Button className="buttonDanger"
          onClick={ startNewSymbology }
        >
          New
        </Button>
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
        .map(dv => ({ variableId: dv.name, type: dv.display }));
  }, [columns]);

  const metaVariables = React.useMemo(() => {
    return columns
      .filter(md => md.display === "meta-variable")
        .map(dv => ({ variableId: dv.name, type: dv.display }));
  }, [columns]);

  const variables = React.useMemo(() => {
    return [...dataVariables, ...metaVariables];
  }, [dataVariables, metaVariables]);

  return (
    <div className="flex flex-col h-full border border-current rounded p-1">
      <div className="flex-1">
        { !symbology ? null :
          <Symbology { ...props }
            symbology={ symbology }
            setSymbology={ setSymbology }
            variables={ variables }/>
        }
      </div>
      <div className="border-t border-current pt-1">
        <SymbologyButtons
          startNewSymbology={ startNewSymbology }
          symbology={ symbology }/>
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
      <div className="px-2 py-1 hover:bg-gray-300 cursor-pointer rounded ml-1"
        onClick={ editing ? stopEditing : startEditing }
      >
        <span className="fas fa-lg fa-pen-to-square"/>
      </div>
    </div>
  )
}

const Symbology = ({ symbology, setSymbology, ...props }) => {
  const updateSymbologyName = React.useCallback(name => {
    setSymbology(prev => ({
      ...prev,
      name
    }));
  }, [setSymbology]);

  const activeViewId = get(props, ["layerProps", "symbology-layer", "activeViewId"], null);
  const setActiveViewId = get(props, ["layerProps", "symbology-layer", "setActiveViewId"], null);

  const activeView = React.useMemo(() => {
    return get(symbology, "views", [])
      .reduce((a, c) => {
        return c.viewId === activeViewId ? c : a;
      }, null)
  }, [symbology, activeViewId]);

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
            displayAccessor={ v => `View ID: ${ v.viewId }` }
            valueAccessor={ v => v.viewId }/>
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
  const activeLayerId = get(props, ["layerProps", "symbology-layer", "activeLayerId"], null);
  const setActiveLayerId = get(props, ["layerProps", "symbology-layer", "setActiveLayerId"], null);

  const activeLayer = React.useMemo(() => {
    return get(view, "layers", [])
      .reduce((a, c) => {
        return c.layerId === activeLayerId ? c : a;
      }, null);
  }, [view, activeLayerId]);

  return (
    <div>
      <div className="ml-4 pt-1">
        <div>
          <MultiLevelSelect
            removable={ false }
            options={ view.layers }
            value={ activeLayerId }
            onChange={ setActiveLayerId }
            displayAccessor={ v => `Layer ID: ${ v.layerId }` }
            valueAccessor={ v => v.layerId }/>
        </div>
        { !activeLayer ? null :
          <LayerItem key={ activeLayer.layerId }
            { ...props } layer={ activeLayer }/>
        }
      </div>
    </div>
  )
}

const PaintProperties = {
  fill: ["fill-color"],//, "fill-opacity"],
  circle: ["circle-color"],//, "circle-opacity"],//, "circle-radius"],
  line: ["line-color"],//, "line-opacity"]//, "line-width", "line-offset"]
}

const MultiSelectDisplay = ({ children }) => {
  return (
    <div className="px-2 py-1 bg-white outline outline-1 outline-current rounded">
      { children }
    </div>
  )
}

const LayerItem = ({ layer, setSymbology, ...props }) => {

  const { layerId, type: layerType  } = layer;

  const paintProperties = React.useMemo(() => {
    return get(PaintProperties, layerType, []);
  }, [layerType]);

  const activePaintProperty = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "activePaintProperty"], null);
  }, [props.layerProps]);
  const setActivePaintProperty = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "setActivePaintProperty"], null);
  }, [props.layerProps]);

  const addPaintProperty = React.useCallback(ppId => {
    setActivePaintProperty(ppId);
    setSymbology(prev => {
      return {
        name: prev.name,
        views: prev.views.map(view => ({
          viewId: view.viewId,
          layers: view.layers.map(layer => {
            if (layer.layerId === layerId) {
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
    })
  }, [setSymbology, layerId, setActivePaintProperty]);

  const removePaintProperty = React.useCallback(ppId => {
    if (activePaintProperty === ppId) {
      setActivePaintProperty(null);
    }
    setSymbology(prev => {
      return {
        name: prev.name,
        views: prev.views.map(view => ({
          viewId: view.viewId,
          layers: view.layers.map(layer => {
            if (layer.layerId === layerId) {
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
    })
  }, [setSymbology, layerId, activePaintProperty, setActivePaintProperty]);

  return (
    <div>
      <div className="ml-4">
        <div>Layer Type: { layer.type }</div>
        <div>
          <MultiLevelSelect isDropdown
            options={ paintProperties }
            onChange={ addPaintProperty }
          >
            <MultiSelectDisplay>
              Add a Paint Property
            </MultiSelectDisplay>
          </MultiLevelSelect>
          <div className="ml-4 grid grid-cols-1 gap-1">
            { Object.keys(layer.paintProperties)
                .map((pp, i)=> (
                  <PaintPropertyItem key={ i } { ...props }
                    layer={ layer }
                    ppId={ pp }
                    paintProperty={ layer.paintProperties[pp] }
                    setSymbology={ setSymbology }
                    removePaintProperty={ removePaintProperty }/>
                ))
            }
          </div>
        </div>
      </div>
    </div>
  )
}

const Identity = i => i;

const makeNewVarialbe = (variable, ppId) => {
  const newVar = {
    variableId: variable.variableId,
    displayName: variable.variableId,
    type: variable.type,
    filterExpression: null,
    paintExpression: null,
    scale: {
      type: variable.type === "data-variable" ? "quantile" : "ordinal",
      domain: [],
      range: [],
      format: variable.type === "data-variable" ? ".2s" : Identity
    }
  }
  if (ppId.includes("color")) {
    newVar.scale.color = variable.type === "data-variable" ? "BrBG" : "Set3";
    newVar.scale.range = getColorRange(7, newVar.scale.color);
    newVar.scale.reverse = false;
  }
  if (ppId.includes("opacity")) {
    newVar.scale.range = [0.2, 0.4, 0.6, 0.8];
    newVar.scale.min = 0.2;
    newVar.scale.max = 0.8;
    newVar.scale.step = 0.2;
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

  const doRemovePaintProperty = React.useCallback(e => {
    removePaintProperty(ppId);
  }, [ppId, removePaintProperty]);

  const activePaintProperty = React.useMemo(() => {
    return get(layerProps, ["symbology-layer", "activePaintProperty"], null);
  }, [layerProps]);
  const setActivePaintProperty = React.useMemo(() => {
    return get(layerProps, ["symbology-layer", "setActivePaintProperty"], null);
  }, [layerProps]);

  const paintPropertyActions = React.useMemo(() => {
    return get(layerProps, ["symbology-layer", "paintPropertyActions"], null);
  }, [layerProps]);
  const setPaintPropertyActions = React.useMemo(() => {
    return get(layerProps, ["symbology-layer", "setPaintPropertyActions"], null);
  }, [layerProps]);

  const setAction = React.useCallback(a => {
    setPaintPropertyActions(prev => ({ ...prev, [ppId]: a }));
    setActivePaintProperty(ppId);
  }, [setPaintPropertyActions, ppId, setActivePaintProperty]);

  const action = React.useMemo(() => {
    return get(paintPropertyActions, ppId, "variable");
  }, [paintPropertyActions, ppId]);

  const { layerId } = layer;

  const addVariable = React.useCallback(vid => {
    const variable = variables.reduce((a, c) => {
      return c.variableId === vid ? c : a;
    }, null);
    setSymbology(prev => {
      return {
        name: prev.name,
        views: prev.views.map(view => ({
          viewId: view.viewId,
          layers: view.layers.map(layer => {
            if (layer.layerId === layerId) {
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
  }, [setSymbology, layerId, ppId, variables]);

  React.useEffect(() => {
    if (action !== "variable") {
      setSymbology(prev => {
        return {
          name: prev.name,
          views: prev.views.map(view => ({
            viewId: view.viewId,
            layers: view.layers.map(layer => {
              if (layer.layerId === layerId) {
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
    }
  }, [setSymbology, layerId, ppId, action]);

  const theme = useTheme();

  return (
    <div className="border-b-2 border-current py-1">
      <div className="border-b mb-1 pb-1 border-current flex items-center">
        <ActivePPToggle
          setActive={ setActivePaintProperty }
          ppId={ ppId }
          isActive={ activePaintProperty === ppId }/>
        <div className="ml-1 flex-1">
          Paint Property: { ppId }
        </div>
        <RemovePaintPropertyButton
          removePaintProperty={ doRemovePaintProperty }/>
      </div>
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
    </div>
  )
}

const accessor = v => v.variableId;
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
          displayAccessor={ accessor }
          valueAccessor={ accessor }
          onChange={ onChange }
          value={ value }/>
      </div>
    </div>
  )
}

const VariableItem = ({ variable }) => {
  return (
    <div>
      <div>
        { variable.displayName }
      </div>
    </div>
  )
}
