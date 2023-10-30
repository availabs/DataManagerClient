import React from "react"

import get from "lodash/get"

import {
  MultiLevelSelect,
  useTheme
} from "~/modules/avl-map-2/src";

import VariableBox from "./VariableBox"
import ColorPicker from "./ColorPicker"

import { myrange } from "../utils"

const ValueItem = ({ value, setValue }) => {
  const doSetValue = React.useCallback(e => {
    e.stopPropagation();
    setValue(value);
  }, [setValue, value]);
  return (
    <div onClick={ doSetValue }
      className={ `
        px-2 py-1 border rounded hover:bg-gray-300
        cursor-pointer
      ` }
    >
      { value }
    </div>
  )
}

const ValuePicker = ({ min, max, steps, setValue }) => {
  const [step, setStep] = React.useState(steps[1]);
  const values = React.useMemo(() => {
    return myrange(min, max, step);
  }, [min, max, step]);
  return (
    <div>
      <div className="flex items-center">
        <div className="mr-1">
          Step Size:
        </div>
        <div className="flex-1">
          <MultiLevelSelect
            removable={ false }
            options={ steps }
            value={ step }
            onChange={ setStep }/>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-1 mt-1">
        <div>Select a value:</div>
        { values.map(v => (
            <ValueItem key={ v }
              value={ v }
              setValue={ setValue }/>
          ))
        }
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
    ...rest
  } = props;

  const Picker = React.useMemo(() => {
    return getValuePicker(ppId);
  }, [ppId]);

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
    <Picker { ...props } setValue={ setValue }/>
  )
}
const ExpressionBox = ({ min, max, steps }) => {
  return (
    <div>
      EXPRESSION BOX: { `${ min } | ${ max } | ${ steps }` }
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
