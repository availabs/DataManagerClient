import React from "react"

import get from "lodash/get"

import {
  Button,
  MultiLevelSelect,
  useTheme
} from "~/modules/avl-map-2/src";

import VariableBox from "./VariableBox"
import ColorPicker from "./ColorPicker"

import { myrange } from "../utils"

const ValueItem = ({ value, setValue, isActive }) => {
  const doSetValue = React.useCallback(e => {
    e.stopPropagation();
    setValue(value);
  }, [setValue, value]);
  const theme = useTheme();
  return (
    <div onClick={ isActive ? null : doSetValue }
      className={ `
        px-1 border rounded hover:bg-gray-300 text-sm flex items-center
        ${ isActive ? "bg-gray-300 cursor-not-allowed" : "cursor-pointer" }
      ` }
    >
      <div className="flex-1">{ value }</div>
      { !isActive ? null :
        <span className={ `fas fa-check pr-8 ${ theme.textHighlight }` }/>
      }
    </div>
  )
}

const ValuePicker = ({ min, max, steps, setValue, current }) => {
  const values = React.useMemo(() => {
    const set = steps.reduce((a, c) => {
      myrange(min, max, c).forEach(v => {
        a.add(v);
      });
      return a;
    }, new Set());
    return [...set].sort((a, b) => a - b)
  }, [min, max, steps]);
  return (
    <div>
      <div className="grid grid-cols-1 gap-1 mt-1">
        <div>Select a value:</div>
        <div className="grid grid-cols-1 gap-[2px] h-80 scrollbar-sm overflow-auto">
          { values.map(v => (
              <ValueItem key={ v }
                value={ v }
                setValue={ setValue }
                isActive={ current === v }/>
            ))
          }
        </div>
      </div>
    </div>
  )
}

const getValuePicker = ppId => {
  if (ppId.includes("color")) {
    return ColorPicker;
  }
  return ValuePicker;
}

const ValueBox = props => {
  const {
    uniqueId,
    ppId,
    activeViewId,
    setSymbology,
    paintProperty,
    ...rest
  } = props;

  const Picker = React.useMemo(() => {
    return getValuePicker(ppId);
  }, [ppId]);

  const value = get(paintProperty, "value", null);

  const setValue = React.useCallback(value => {
    setSymbology(prev => {
      return ({
        ...prev,
        views: prev.views.map(view => {
          if (view.viewId === activeViewId) {
            return {
              ...view,
              layers: view.layers.map(layer => {
                if (layer.uniqueId === uniqueId) {
                  return {
                    ...layer,
                    paintProperties: {
                      ...layer.paintProperties,
                      [ppId]: {
                        value: value,
                        paintExpression: null,
                        variable: null
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
      })
    })
  }, [setSymbology, activeViewId, uniqueId, ppId]);

  return (
    <Picker { ...props } setValue={ setValue } current={ value }/>
  )
}
const ExpressionBox = ({ MapActions, ...props }) => {

  const openModal = React.useCallback(e => {
    MapActions.openModal("symbology-layer", "expression-editor");
  }, [MapActions.openModal]);

  React.useEffect(() => {
    openModal();
  }, [openModal]);

  return (
    <div>
      <Button onClick={ openModal }>
        Open Expression Modal
      </Button>
    </div>
  )
}

const VariableBoxWrapper = Comp => {
  return props => {
    const variable = React.useMemo(() => {
      return get(props, ["paintProperty", "variable"], null);
    }, [props.paintProperty])
    return !variable ? null : <Comp { ...props }/>
  }
}

const VariableActionMap = {
  value: ValueBox,
  expression: ExpressionBox,
  variable: VariableBoxWrapper(VariableBox)
}

const getPaintPropertyLimits = ppId => {
  if (ppId.includes("color")) {
    return {};
  }
  if (ppId.includes("opacity")) {
    return { min: 0.0, max: 1.0, steps: [0.1, 0.2, 0.25] };
  }
  if (ppId.includes("radius")) {
    return { min: 0.0, max: 50, steps: [1, 2, 5] };
  }
  if (ppId.includes("width")) {
    return { min: 0.0, max: 10, steps: [1, 2, 5] };
  }
  if (ppId.includes("offset")) {
    return { min: -10, max: 10, steps: [1, 2, 5] };
  }
}

const PaintPropertyBox = ({ ppId, paintProperty, layerProps, ...props }) => {
  const action = React.useMemo(() => {
    return get(layerProps, ["symbology-layer", "activePaintPropertyAction"], null);
  }, [layerProps]);
  const Editor = React.useMemo(() => {
    return get(VariableActionMap, action, null);
  }, [action]);
  const limits = React.useMemo(() => {
    return getPaintPropertyLimits(ppId);
  }, [ppId]);
  return (
    <div>
      <div>
        Paint Property: { ppId }
      </div>
      <div>
        { !Editor ? null :
          <Editor ppId={ ppId } { ...limits } { ...props }
            paintProperty={ paintProperty }
            layerProps={ layerProps }/>
        }
      </div>
    </div>
  )
}
export default PaintPropertyBox;
