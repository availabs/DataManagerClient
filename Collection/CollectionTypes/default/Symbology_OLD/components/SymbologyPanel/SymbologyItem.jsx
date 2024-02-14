import React from "react"

import get from "lodash/get"

import {
  Button,
  MultiLevelSelect,
  useClickOutside,
  useTheme
} from "~/modules/avl-map-2/src"

import ViewItem from "./ViewItem"

const NameEditor = ({ value, onChange }) => {
  const [editing, setEditing] = React.useState(!Boolean(value));
  React.useEffect(() => {
    if (!value) {
      setEditing(true);
    }
  }, [value]);
  const stopEditing = React.useCallback(e => {
    e.stopPropagation();
    setEditing(!Boolean(value));
  }, [value]);
  const startEditing = React.useCallback(e => {
    e.stopPropagation();
    setEditing(true);
  }, []);
  const onKeyUp = React.useCallback(e => {
    if ((e.key === "Enter") || (e.keyCode === 13)) {
      setEditing(false);
    }
  }, []);
  const doOnChange = React.useCallback(e => {
    onChange(e.target.value);
  }, [onChange]);

  const [inputRef, setInputRef] = React.useState(null);
  React.useEffect(() => {
    inputRef && inputRef.focus();
  }, [inputRef]);

  const [outterRef, setOutterRef] = React.useState(null);
  useClickOutside(outterRef, stopEditing);

  return (
    <div ref={ setOutterRef }
      className="flex"
    >
      { editing ?
        <input ref={ setInputRef }
          className="px-2 py-1 flex-1 outline outline-1 rounded cursor-point"
          placeholder="enter symbology name"
          value={ value }
          onChange={ doOnChange }
          onKeyUp={ onKeyUp }/> :
        <div className="px-2 py-1 flex-1">
          { value || "enter symbology name" }
        </div>
      }
      <Button className="buttonPrimary ml-1" onClick={ editing ? stopEditing : startEditing }>
        <span className="fas fa-pen-to-square"/>
      </Button>
    </div>
  )
}

const viewDisplayAccessor = v => v.version || `View ID: ${ v.viewId }`;
const viewValueAccessor = v => v.viewId;

const SymbologyItem = ({ symbology, setSymbology, ...props }) => {
  const updateSymbologyName = React.useCallback(name => {
    setSymbology(prev => ({
      ...prev,
      name
    }));
  }, [setSymbology]);

  const activeViewId = get(props, ["layerProps", "symbology-layer", "activeViewId"], null);
  const setActiveViewId = get(props, ["layerProps", "symbology-layer", "setActiveViewId"], null);
  const activeView = get(props, ["layerProps", "symbology-layer", "activeView"], null);

  return (
    <div>
      <div className="flex pb-1 border-b border-current">
        <div className="mr-1 py-1 font-bold">Name:</div>
        <div className="flex-1">
          <NameEditor value={ symbology.name }
            onChange={ updateSymbologyName }/>
        </div>
      </div>
      <div className="pt-1">
        <div>
          <MultiLevelSelect
            removable={ false }
            options={ symbology.views }
            value={ activeViewId }
            onChange={ setActiveViewId }
            displayAccessor={ viewDisplayAccessor }
            valueAccessor={ viewValueAccessor }/>
        </div>
        { !activeView ? null :
          <ViewItem key={ activeView.viewId }
            { ...props } view={ activeView }
            setSymbology={ setSymbology }/>
        }
      </div>
    </div>
  )
}
export default SymbologyItem
