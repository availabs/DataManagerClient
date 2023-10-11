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

const NameRegex = /^\w+/;

const paintPropertyHasValue = paintProperty => {
  if (paintProperty.value !== null) return true;
  if (paintProperty.paintExpression !== null) return true;
  return Boolean(get(paintProperty, ["variable", "paintExpression"]));
}

const SymbologyButtons = ({ startNewSymbology, symbology, activeViewId }) => {

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
  }, [symbology]);

  const { falcor, falcorCache, pgEnv } = React.useContext(DamaContext);

  const saveSymbology = React.useCallback(() => {
    const current = get(
      falcorCache,
      ["dama", pgEnv, "views", "byId", activeViewId,
        "attributes", "metadata", "value", "symbologies"],
      []
    );
    const toSave = {
      name: symbology.name,
      views: symbology.views
        .filter(view => view.viewId == activeViewId)
    }
    falcor.call(
      ["dama", "views", "metadata", "update"],
      [pgEnv, activeViewId, { symbologies: [...current, toSave] }]
    ).then(res => console.log("RES:", res))
  }, [falcor, pgEnv, activeViewId, symbology, falcorCache]);

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
        <Button className="buttonDanger"
          onClick={ startNewSymbology }
        >
          New
        </Button>
      </div>
    )
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

  const activeViewId = get(props, ["layerProps", "symbology-layer", "activeViewId"], null);

  return (
    <div className="absolute inset-0 border overflow-visible scrollbar-sm p-1">
      <div className="mb-1 pb-1 border-b border-current">
        <SymbologyButtons
          startNewSymbology={ startNewSymbology }
          symbology={ symbology }
          activeViewId={ activeViewId }/>
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
            displayAccessor={ v => v.version }
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
  const activeLayer = get(props, ["layerProps", "symbology-layer", "activeLayer"], null);

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

const LayerItem = ({ layer, setSymbology, ...props }) => {

  const { layerId, type: layerType  } = layer;

  const paintProperties = React.useMemo(() => {
    return get(PaintProperties, layerType, []);
  }, [layerType]);

  const activePaintPropertyId = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "activePaintPropertyId"], null);
  }, [props.layerProps]);
  const setActivePaintPropertyId = React.useMemo(() => {
    return get(props, ["layerProps", "symbology-layer", "setActivePaintPropertyId"], null);
  }, [props.layerProps]);

  const addPaintProperty = React.useCallback(ppId => {
    setActivePaintPropertyId(ppId);
    setSymbology(prev => {
      return {
        name: prev.name,
        views: prev.views.map(view => ({
          ...view,
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
  }, [setSymbology, layerId, setActivePaintPropertyId]);

  const removePaintProperty = React.useCallback(ppId => {
    if (activePaintPropertyId === ppId) {
      setActivePaintPropertyId(null);
    }
    setSymbology(prev => {
      return {
        name: prev.name,
        views: prev.views.map(view => ({
          ...view,
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
  }, [setSymbology, layerId, activePaintPropertyId, setActivePaintPropertyId]);

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
    newVar.scale.domain = [];
    newVar.scale.range = getColorRange(7, newVar.scale.color);
    newVar.scale.reverse = false;
  }
  if (ppId.includes("opacity")) {
    newVar.scale.range = [0.2, 0.4, 0.6, 0.8];
    newVar.scale.step = 0.2;
  }
  if (ppId.includes("width")) {
    newVar.scale.range = [1, 2, 3, 4, 5, 6, 7];
    newVar.scale.step = 1;
  }
  if (ppId.includes("offset")) {
    newVar.scale.range = [1, 2, 3, 4, 5, 6, 7];
    newVar.scale.step = 1;
  }
  if (ppId.includes("radius")) {
    newVar.scale.range = [5, 10, 15, 20, 25];
    newVar.scale.step = 5;
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

  const { layerId } = layer;

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
  const [prevAction, setPrevAction] = React.useState(null);

  React.useEffect(() => {
    if (action !== prevAction) {
      setSymbology(prev => {
        return {
          name: prev.name,
          views: prev.views.map(view => ({
            ...view,
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
      setPrevAction(action);
    }
  }, [setSymbology, layerId, ppId, action, prevAction]);

  const setActivePaintPropertyAction = React.useMemo(() => {
    return get(layerProps, ["symbology-layer", "setActivePaintPropertyAction"], null);
  }, [layerProps]);

  const setAction = React.useCallback(action => {
    setActivePaintPropertyAction(ppId, action);
  }, [setActivePaintPropertyAction, ppId]);

  const addVariable = React.useCallback(vid => {

    const variable = variables.reduce((a, c) => {
      return c.variableId === vid ? c : a;
    }, null);

    setSymbology(prev => {
      return {
        name: prev.name,
        views: prev.views.map(view => ({
          ...view,
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

  const updateVariableDispayName = React.useCallback(dn => {
    setSymbology(prev => {
      return {
        name: prev.name,
        views: prev.views.map(view => ({
          ...view,
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
  }, [setSymbology, layerId, ppId, paintProperty.variable])

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
