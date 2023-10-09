import React from "react"

import get from "lodash/get"
import isEqual from "lodash/isEqual"
import { range as d3range } from "d3-array"

import {
  MultiLevelSelect,
  BooleanSlider,
  ColorRanges,
  ColorBar,
  useTheme
} from "~/modules/avl-map-2/src";

const ColorEditor = props => {

  const {
    variable,
    updateScale,
    variableType,
    MapActions,
    data
  } = props

  const {
    scale
  } = variable;

  const [reverseColors, setReverseColors] = React.useState(Boolean(scale.reverse));

  const [rangeSize, setRangeSize] = React.useState(0);
  React.useEffect(() => {
    if (!rangeSize) {
      setRangeSize(7);
    }
  }, [rangeSize]);

  return (
    <div className="grid grid-cols-1 gap-1">
      <TypeSelector
        variableType={ variableType }
        scaleType={ scale.type }
        updateScale={ updateScale }/>

      <RangeSizeSelector
        rangeSize={ rangeSize }
        onChange={ setRangeSize }/>

      <ReverseSlider
        reverseColors={ reverseColors }
        onChange={ setReverseColors }/>

      <ColorSelector
        reverseColors={ reverseColors }
        rangeSize={ rangeSize }
        updateScale={ updateScale }
        range={ scale.range }/>
    </div>
  )
}
export default ColorEditor;

const LegendTypes = [
  { value: "quantile", name: "Quantile", variableType: "data-variable" },
  { value: "threshold", name: "Threshold", variableType: "data-variable" },
  { value: "ordinal", name: "Ordinal", variableType: "meta-variable" }
]
const TypeSelector = ({ scaleType, updateScale, variableType }) => {
  const onChange = React.useCallback(type => {
    updateScale({ type, domain: [] });
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

const RangeSizes = d3range(3, 13);
const RangeSizeSelector = ({ rangeSize, onChange }) => {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="py-1 text-right">
        Number of Colors:
      </div>
      <div>
        <MultiLevelSelect
          removable={ false }
          options={ RangeSizes }
          onChange={ onChange }
          value={ rangeSize }/>
      </div>
    </div>
  )
}

const ReverseSlider = ({ reverseColors, onChange }) => {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="py-1 text-right">
        Reverse Colors:
      </div>
      <div>
        <BooleanSlider
          value={ reverseColors }
          onChange={ onChange }/>
      </div>
    </div>
  )
}

const EditorColorBar = ({ colors, reverse, range, updateScale }) => {
  const isActive = React.useMemo(() => {
    return isEqual(colors, range);
  }, [colors, range]);

  const onClick = React.useCallback(() => {
    updateScale({ range: colors, domain: [], reverse });
  }, [updateScale, colors, reverse]);

  return (
    <div onClick={ isActive ? null : onClick }
      className={ `
        outline outline-2 rounded-lg my-2
        ${ isActive ? "outline-black" : "outline-transparent cursor-pointer" }
      ` }
    >
      <ColorBar
        colors={ colors }
        height={ 3 }/>
    </div>
  )
}
const ColorSelector = props => {

  const {
    reverseColors,
    rangeSize,
    updateScale,
    range
  } = props;

  const Colors = React.useMemo(() => {
    return get(ColorRanges, rangeSize, [])
      .map(({ colors, ...rest }) => ({
        ...rest,
        colors: reverseColors ? [...colors].reverse() : [...colors]
      }))
  }, [rangeSize, reverseColors]);

  const theme = useTheme();

  return (
    <div className="grid grid-cols-1 gap-1">
      <div className="py-1">
        Available Colors:
      </div>
      <div className={ `
          overflow-auto px-2 rounded ${ theme.bgAccent2 }
          scrollbar-sm scrollbar-blue
        ` }
        style={ { height: "24rem" } }
      >
        { Colors.map(color => (
            <EditorColorBar key={ color.name }
              { ...color } range={ range }
              updateScale={ updateScale }
              reverse={ reverseColors }/>
          ))
        }
      </div>
    </div>
  )
}
