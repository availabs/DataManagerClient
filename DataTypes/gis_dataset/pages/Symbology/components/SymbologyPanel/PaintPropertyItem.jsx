import React from "react"

import get from "lodash/get"

import {
  Button,
  Input,
  MultiLevelSelect,
  getColorRange,
  useTheme
} from "~/modules/avl-map-2/src"

export const getRangeAndStep = ppId => {
  if (ppId.includes("opacity")) {
    return {
      range: [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8],
      step: 0.1
    }
  }
  if (ppId.includes("width")) {
    return {
      range: [1, 2, 3, 4, 5, 6, 7],
      step: 1
    }
  }
  if (ppId.includes("offset")) {
    return {
      range: [1, 2, 3, 4, 5, 6, 7],
      step: 1
    }
  }
  if (ppId.includes("radius")) {
    return {
      range: [5, 10, 15, 20, 25],
      step: 5
    }
  }
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
      range: [],
      format: variable.type === "data-variable" ? ".2s" : null
    }
  }
  if (ppId.includes("color")) {
    newVar.scale.color = variable.type === "data-variable" ? "BrBG" : "Set3";
    newVar.scale.reverse = false;
    newVar.scale.range = getColorRange(7, newVar.scale.color);
    newVar.scale.fallbackValue = "rgba(0, 0, 0, 0)";
    return newVar;
  }
  newVar.scale = {
    ...newVar.scale,
    ...getRangeAndStep(ppId),
    fallbackValue: 0
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

const VariableAccessor = v => v.variableId;

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
export default PaintPropertyItem;
