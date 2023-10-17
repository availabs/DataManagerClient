import React from "react"

import get from "lodash/get"

import {
  useTheme
} from "~/modules/avl-map-2/src"

const ActiveFilterToggle = ({ setActive, ppId, isActive }) => {
  const doSetActive = React.useCallback(() => {
    setActive(ppId);
  }, [setActive, ppId]);
  const theme = useTheme();
  return (
    <div>
      <span onClick={ doSetActive }
        className={ `
          cursor-pointer
          ${ isActive ? `fa fa-toggle-on ${ theme.textHighlight }` :
            "fa fa-toggle-off text-gray-500"
          }
        ` }/>
    </div>

  )
}

const RemoveFilterButton = ({ removeFilter }) => {
  const [seconds, setSeconds] = React.useState(0);
  const timeout = React.useRef();

  React.useEffect(() => {
    if (seconds > 0) {
      timeout.current = setTimeout(setSeconds, 1000, seconds - 1);
    }
  }, [seconds]);

  const onClick = React.useCallback(e => {
    e.stopPropagation();
    if (seconds === 0) {
      setSeconds(3);
    }
    else {
      setSeconds(0);
      clearTimeout(timeout.current);
      removeFilter();
    }
  }, [removeFilter, seconds]);

  return (
    <div className="cursor-pointer px-1 relative text-red-500 hover:bg-gray-500 rounded"
      onClick={ onClick }
    >
      { !seconds ? null :
        <span className="absolute inset-0 flex items-center justify-center text-white font-bold">
          { seconds }
        </span>
      }
      <span className="fa fa-trash"/>
    </div>
  )
}

const FilterItem = props => {
  const {
    layer,
    variableId,
    filter,
    setSymbology,
    removeFilter,
    layerProps
  } = props;

  const doRemoveFilter = React.useCallback(e => {
    removeFilter(variableId);
  }, [variableId, removeFilter]);

  const activeFilterVariableId = React.useMemo(() => {
    return get(layerProps, ["symbology-layer", "activeFilterVariableId"], null);
  }, [layerProps]);
  const setActiveFilterVariableId = React.useMemo(() => {
    return get(layerProps, ["symbology-layer", "setActiveFilterVariableId"], null);
  }, [layerProps]);

  const isActive = activeFilterVariableId === variableId;

  return (
    <div className="border-b border-current py-1">
      <div className="flex items-center">
        <ActiveFilterToggle
          setActive={ setActiveFilterVariableId }
          variableId={ variableId }
          isActive={ activeFilterVariableId === variableId }/>
        <div className="ml-1 flex-1">
          Varialble ID: { variableId }
        </div>
        <RemoveFilterButton
          removeFilter={ doRemoveFilter }/>
      </div>
    </div>
  )
}
export default FilterItem;
