import React from "react"

import get from "lodash/get"
import isEqual from "lodash/isEqual"
import { range as d3range } from "d3-array"

import {
  MultiLevelSelect,
  BooleanSlider,
  ColorRanges,
  ColorBar,
  Button,
  useTheme
} from "~/modules/avl-map-2/src";

import TypeSelector from "./TypeSelector"

const ColorEditor = props => {

  const {
    scale,
    updateScale
  } = props

  const [reverseColors, setReverseColors] = React.useState(Boolean(scale.reverse));

  const [rangeSize, setRangeSize] = React.useState(get(scale, ["range", "length"], 7));

  return (
    <div className="grid grid-cols-1 gap-1">

      <TypeSelector { ...props }
        scale={ scale }
        updateScale={ updateScale }/>

      { scale.type !== "ordinal" ? null :
        <VerticvalSlider
          isVertical={ scale.isVertical }
          updateScale={ updateScale }/>
      }

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

const VerticvalSlider = ({ isVertical, updateScale }) => {
  const onChange = React.useCallback(v => {
    updateScale({ isVertical: v });
  }, [updateScale]);
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="py-1 text-right">
        Use Vertical Legend:
      </div>
      <div>
        <BooleanSlider
          value={ isVertical }
          onChange={ onChange }/>
      </div>
    </div>
  )
}

const RangeSizes = d3range(3, 13);
const RangeSizeSelector = ({ rangeSize, onChange }) => {
  return (
    <div className="flex">
      <div className="w-8"/>
      <div className="grid grid-cols-2 gap-2 flex-1">
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
    </div>
  )
}

const ReverseSlider = ({ reverseColors, onChange }) => {
  return (
    <div className="flex">
      <div className="w-8"/>
      <div className="grid grid-cols-2 gap-2 flex-1">
        <div className="py-1 text-right">
          Reverse Colors:
        </div>
        <div>
          <BooleanSlider
            value={ reverseColors }
            onChange={ onChange }/>
        </div>
      </div>
    </div>
  )
}

const EditorColorBar = ({ colors, reverse, name, range, updateScale }) => {
  const isActive = React.useMemo(() => {
    return isEqual(colors, range);
  }, [colors, range]);

  const onClick = React.useCallback(() => {
    updateScale({ range: colors, domain: [], reverse, color: name });
  }, [updateScale, colors, reverse, name]);

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
        style={ { height: "20rem" } }
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
