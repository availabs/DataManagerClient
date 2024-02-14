import React from "react"

import get from "lodash/get"

import ColorCreator from "./ColorCreator"

import {
  ColorRanges,
  Button,
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

const ColorRect = ({ setValue, color }) => {
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

const ColorPicker = ({ setValue, ...props }) => {

  const [color, setColor] = React.useState("#888888");
  const doSetColor = React.useCallback(color => {
    setColor(color.hex);
  }, []);

  const doSetValue = React.useCallback(e => {
    setValue(color);
  }, [setValue, color]);

  const [isOpen, setIsOpen] = React.useState(true);
  const toggle = React.useCallback(e => {
    setIsOpen(o => !o);
  }, []);

  return (
    <div>
      <div className="flex">
        <div className="mr-1 w-8 flex">
          <Button onClick={ toggle }
            className="buttonText"
          >
            <span className={ `fas fa-xl ${ isOpen ? "fa-caret-up" : "fa-caret-down" }` }/>
          </Button>
        </div>
        <div className="py-1">Select a Color:</div>
      </div>
      <div className={ isOpen ? "block" : "hidden" }>
        <div className="grid grid-cols-7 gap-1 p-1 bg-gray-800 rounded my-1"
          style={ {
            gridTemplateRows: "repeat(10, minmax(0, 1fr))"
          } }
        >
          { Colors.map(color => (
              <ColorRect key={ color } { ...props }
                setValue={ setValue }
                color={ color }/>
            ))
          }
        </div>
      </div>
      Create a color:
      <ColorCreator
        color={ color }
        onChange={ doSetColor }
        onSelect={ doSetValue }
        buttonLabel="Set"/>
    </div>
  )
}
export default ColorPicker;
