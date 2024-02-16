import React from "react"

import { CustomPicker } from "react-color"
import { Hue, Saturation } from 'react-color/lib/components/common';

import {
  Button,
  useTheme
} from "~/modules/avl-map-2/src";

const SaturationPointer = props => {
  const [ref, setRef] = React.useState(null);
  React.useEffect(() => {
    if (!ref || !ref.parentNode) return;
    ref.parentNode.classList.add("pointer-events-none");
  }, [ref]);
  return (
    <div ref={ setRef }
      style={ { transform: "translate(-50%, -50%)" } }
      className="w-2 h-2 rounded pointer-events-none border border-white"/>
  )
}
const HuePointer = props => {
  return (
    <div style={ { transform: "translate(-50%, -0.125rem)" } }
      className="w-[5px] h-3 border border-gray-600 bg-gray-600 rounded"/>
  )
}

const ColorCreator = CustomPicker(({ onSelect, buttonLabel = "Add", ...props }) => {
  return (
    <div className="p-1 rounded bg-gray-300">
      <div className="h-32 flex mb-1">
        <div className="w-20 h-full flex flex-col mr-1">
          <div style={ { backgroundColor: props.hex } }
            className="flex-1 mb-1 rounded"/>
          <Button className="buttonSmall"
            onClick={ onSelect }
          >
            { buttonLabel } 
          </Button>
        </div>
        <div className="relative w-full h-full cursor-pointer">
          <Saturation { ...props } pointer={ SaturationPointer }/>
        </div>
      </div>
      <div className="relative w-full h-2 cursor-pointer">
        <Hue { ...props } pointer={ HuePointer }/>
      </div>
    </div>
  )
})
export default ColorCreator;
