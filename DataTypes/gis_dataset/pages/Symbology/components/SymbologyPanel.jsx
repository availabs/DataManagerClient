import React from "react"

import get from "lodash/get"

import {
  Button,
  MultiLevelSelect,
  getColorRange,
  useClickOutside
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
          <Symbology symbology={ symbology }
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
  return (
    <div>
      <div className="flex pb-1 border-b border-current">
        <div className="mr-1 py-1 font-bold">Name:</div>
        <div className="flex-1">
          <NameEditor value={ symbology.name }
            onChange={ updateSymbologyName }/>
        </div>
      </div>
      <div>
        { symbology.views.map(view => (
            <ViewItem key={ view.viewId }
              { ...props } view={ view }
              setSymbology={ setSymbology }/>
          ))
        }
      </div>
    </div>
  )
}

const ViewItem = ({ view, ...props }) => {
  return (
    <div>
      <div>
        View ID: { view.viewId }
      </div>
      <div className="ml-4">
        { view.layers.map(layer => (
            <LayerItem key={ layer.layerId }
              { ...props } layer={ layer }/>
          ))
        }
      </div>
    </div>
  )
}

const PaintProperties = {
  fill: ["fill-color"],//, "fill-opacity"],
  circle: ["circle-color"],//, "circle-opacity", "circle-radius"],
  line: ["line-color"],//, "line-opacity", "line-width", "line-offset"]
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

  const addPaintProperty = React.useCallback(pp => {
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
                  [pp]: {
                    valueExpression: null,
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
  }, [setSymbology, layerId]);

  return (
    <div>
      <div>Layer ID: { layer.layerId }</div>
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
                  <PaintProperty key={ i } { ...props }
                    layer={ layer }
                    ppId={ pp }
                    paintProperty={ layer.paintProperties[pp] }
                    setSymbology={ setSymbology }/>
                ))
            }
          </div>
        </div>
      </div>
    </div>
  )
}

const makeNewVarialbe = v => {
  const newVar = {
    variableId: v.variableId,
    displayName: v.variableId,
    type: v.type,
    filterExpression: null,
    paintExpression: null,
    scale: {
      type: v.type === "data-variable" ? "quantile" : "ordinal",
      domain: [],
      format: v.type === "data-variable" ? ".2s" : null,
      color: v.type === "data-variable" ? "BrBG" : "Set3",
      reverse: false
    }
  }
  newVar.scale.range = getColorRange(7, newVar.scale.color);
  return newVar;
}

const PaintProperty = ({ ppId, paintProperty, layer, variables, setSymbology }) => {

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
                        ...layer.paintProperties[pp],
                        variable: makeNewVarialbe(variable)
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

  const [action, _setAction] = React.useState("variable")
  const setAction = React.useCallback(e => {
    _setAction(e.target.value);
  }, []);

  return (
    <div className="border-b border-current py-1">
      <div>
        Paint Property: { ppId }
      </div>
      <div>
        <div className="border-b border-current">Choose an Action</div>
        <div>
          <div className="flex pr-8">
            <div className="flex-1">Add a Variable:</div>
            <div>
              <input type="radio" name={ `action-${ ppId }` } value="variable"
                checked={ action === "variable" }
                onChange={ setAction }/>
            </div>
          </div>
          <div className="flex pr-8">
            <div className="flex-1">Set a Value:</div>
            <div>
              <input type="radio" name={ `action-${ ppId }` } value="value"
                checked={ action === "value" }
                onChange={ setAction }/>
            </div>
          </div>
          <div className="flex pr-8">
            <div className="flex-1">Create an Expression:</div>
            <div>
              <input type="radio" name={ `action-${ ppId }` } value="expression"
                checked={ action === "expression" }
                onChange={ setAction }/>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center">
        <div>
          Variable:
        </div>
        <div className="ml-1 flex-1">
          <MultiLevelSelect
            removable={ false }
            options={ variables }
            displayAccessor={ v => v.variableId }
            valueAccessor={ v => v.variableId }
            onChange={ addVariable }
            value={ paintProperty.variable?.variableId }/>
        </div>
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
