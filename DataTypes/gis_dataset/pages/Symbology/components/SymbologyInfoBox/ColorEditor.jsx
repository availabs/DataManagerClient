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

import ColorCreator from "./ColorCreator"
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

      <PaletteEditor
        updateScale={ updateScale }/>
    </div>
  )
}
export default ColorEditor;

const PaeletteItem = ({ color, remove }) => {
  const doRemove = React.useCallback(e => {
    remove(color);
  }, [remove, color]);
  return (
    <div className="h-8 rounded relative"
      style={ { backgroundColor: color } }
    >
      <div onClick={ doRemove }
        className={ `
          absolute inset-1 bg-white rounded opacity-0 hover:opacity-100
          flex items-center justify-center cursor-pointer
        ` }
      >
        <span className="fa fa-sm fa-trash text-red-500"/>
      </div>
    </div>
  )
}

const PaletteEditor = ({ updateScale }) => {

  const [palette, setPalette] = React.useState([]);

  const clearPalette = React.useCallback(e => {
    setPalette([]);
  }, []);

  const usePalette = React.useCallback(e => {
    updateScale({ color: "custom", range: palette, domain: [] });
  }, [updateScale, palette]);

  const [color, setColor] = React.useState("#888888");
  const doSetColor = React.useCallback(color => {
    setColor(color.hex);
  }, []);
  const addToPalette = React.useCallback(e => {
    setPalette(prev => prev.includes(color) ? prev : [...prev, color]);
  }, [color]);
  const removeFromPalette = React.useCallback(color => {
    setPalette(prev => prev.filter(c => c !== color));
  }, []);

  const [isOpen, setIsOpen] = React.useState(false);
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
        <div className="py-1">Palette Editor:</div>
      </div>
      <div className="grid grid-cols-10 gap-1 mb-1">
        { palette.map((c, i) => (
            <PaeletteItem key={ i } color={ c }
              remove={ removeFromPalette }/>
          ))
        }
      </div>
      <div className={ isOpen ? "block" : "hidden" }>
        <div className="flex mb-1">
          <div className="flex-1">
            <Button onClick={ usePalette }
              className="buttonSmallPrimary"
              disabled={ palette.length < 3}
            >
              Use Palette
            </Button>
          </div>
          <div className="flex-0">
            <Button onClick={ clearPalette }
              className="buttonSmallDanger"
            >
              Clear Palette
            </Button>
          </div>
        </div>
        <ColorCreator
          color={ color }
          onChange={ doSetColor }
          onSelect={ addToPalette }/>
      </div>
    </div>
  )
}

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

  const [isOpen, setIsOpen] = React.useState(true);
  const toggle = React.useCallback(e => {
    setIsOpen(o => !o);
  }, []);

  const theme = useTheme();

  return (
    <div className="grid grid-cols-1 gap-1 border-b-2 border-current pb-1">
      <div className="flex">
        <div className="mr-1 w-8 flex">
          <Button onClick={ toggle }
            className="buttonText"
          >
            <span className={ `fas fa-xl ${ isOpen ? "fa-caret-up" : "fa-caret-down" }` }/>
          </Button>
        </div>
        <div className="py-1">Available Colors:</div>
      </div>
      <div className={ `
          overflow-auto px-2 rounded ${ theme.bgAccent2 }
          scrollbar-sm scrollbar-blue
          ${ isOpen ? "block" : "hidden" }
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
