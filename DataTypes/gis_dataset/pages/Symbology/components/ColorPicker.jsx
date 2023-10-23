import React from "react"

import get from "lodash/get"

import {
  MultiLevelSelect,
  BooleanSlider,
  ColorRanges,
  ColorBar,
  getColorRange,
  useTheme
} from "~/modules/avl-map-2/src";

const ColorSet = Object.keys(ColorRanges)
  .reduce((a, c) => {
    return ColorRanges[c]
      .filter(({ type }) => type === "Qualitative")
      .reduce((aa, cc) => {
        cc.colors.forEach(color => aa.add(color));
        return aa;
      }, a);
  }, new Set());

const Colors = [...ColorSet];

const Color = ({ setValue, color }) => {
  const select = React.useCallback(e => {
    setValue(color);
  }, [setValue, color]);
  return (
    <div onClick={ select }
      className="rounded cursor-pointer h-10"
      style={ {
        backgroundColor: color
      } }/>
  )
}

const ColorPicker = props => {
  return (
    <div>
      Select a color
      <div className="grid grid-cols-7 gap-1 p-1 bg-gray-800 rounded"
        style={ {
          gridTemplateRows: "repeat(10, minmax(0, 1fr))"
        } }
      >
        { Colors.map(color => (
            <Color key={ color } { ...props }
              color={ color }/>
          ))
        }
      </div>
    </div>
  )
}
export default ColorPicker;
