import React from "react"

import get from "lodash/get"
import isEqual from "lodash/isEqual"
import { range as d3range } from "d3-array"
import { format as d3format } from "d3-format"

import {
  MultiLevelSelect,
  BooleanSlider,
  ColorRanges,
  ColorBar,
  Input,
  Button,
  useTheme
} from "~/modules/avl-map-2/src";

const strictNaN = v => (v === "") || (v === null) || isNaN(v);

const RangeItem = ({ value }) => {
  const format = d3format(",.1f");
  return (
    <div className="text-center">{ format(value) }</div>
  )
}

const RangeEditor = props => {

  const {
    variable,
    updateScale,
    variableType,
    MapActions,
    min, max,
    data
  } = props

  const {
    scale
  } = variable;

  const doUpdateScale = React.useCallback((key, value) => {
    if (typeof key === "string") {
      updateScale({ [key]: value });
    }
    else if (typeof key === "object") {
      updateScale({ ...key });
    }
  }, [updateScale]);

  const [rangeValue, setRangeValue] = React.useState("");
  const disabled = React.useMemo(() => {
    return strictNaN(rangeValue) || (min > +rangeValue) || (max < +rangeValue);
  }, [min, max, rangeValue]);

  const addRangeItem = React.useCallback(e => {
    const range = [...scale.range, +rangeValue].sort((a, b) => a - b);
    updateScale({ range });
    setRangeValue("");
  }, [updateScale, scale.range, rangeValue]);

  return (
    <div>
      RangeEditor: { `${ min }, ${ max }` }
      <div className="grid grid-cols-1 gap-1">
        <TypeSelector
          variableType={ variableType }
          scaleType={ scale.type }
          updateScale={ doUpdateScale }/>
        <div className="grid gap-1"
          style={ {
            gridTemplateColumns: `repeat(${ scale.range.length + 1 }, minmax(0, 1fr))`
          } }
        >
          <div>Range:</div>
          { scale.range.map(r => (
              <RangeItem key={ r } value={ r }/>
            ))
          }
        </div>
        <div className="flex">
          <div className="flex-1 mr-1">
            <Input type="number"
              value={ rangeValue }
              onChange={ setRangeValue }
              min={ min } max={ max }/>
          </div>
          <Button className="button"
            disabled={ disabled }
            onClick={ addRangeItem }
          >
            Add New Range Value
          </Button>
        </div>
      </div>
    </div>
  )
}
export default RangeEditor;

const LegendTypes = [
  { value: "quantile", name: "Quantile", variableType: "data-variable" },
  { value: "threshold", name: "Threshold", variableType: "data-variable" },
  { value: "ordinal", name: "Ordinal", variableType: "meta-variable" }
]
const TypeSelector = ({ scaleType, updateScale, variableType }) => {
  const onChange = React.useCallback(t => {
    updateScale("type", t);
  }, [updateScale]);
  const options = React.useMemo(() => {
    return LegendTypes.filter(lt => lt.variableType === variableType);
  }, [variableType]);
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="py-1 text-right">
        Scale Type:
      </div>
      <div>
        <MultiLevelSelect
          removable={ false }
          options={ options }
          displayAccessor={ t => t.name }
          valueAccessor={ t => t.value }
          onChange={ onChange }
          value={ scaleType }/>
      </div>
    </div>
  )
}
