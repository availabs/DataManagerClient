import React from "react"

import get from "lodash/get"

import {
  MultiLevelSelect,
  strictNaN
} from "~/modules/avl-map-2/src";

import { myrange } from "./RangeEditor"

const OrdinalRangeEditor = ({ variable, min, max, ...props }) => {

  const domain = React.useMemo(() => {
    return get(variable, ["scale", "domain"], []);
  }, [variable]);
  const range = React.useMemo(() => {
    return get(variable, ["scale", "range"], []);
  }, [variable]);

  const rangeValues = React.useMemo(() => {
    return myrange(min, max);
  }, [min, max]);

  return (
    <div>
      <div className="grid grid-cols-1 gap-1">
        <div className="grid grid-cols-2 gap-2">
          <div className="border-b border-current">Domain Values</div>
          <div className="border-b border-current">Range Values</div>
        </div>
        { domain.map((d, i) => (
            <DomainItem key={ d } { ...props }
              variable={ variable }
              domainValue={ d }
              rangeValue={ get(range, i, null) }
              index={ i }
              rangeValues={ rangeValues }/>
          ))
        }
      </div>
    </div>
  )
}
export default OrdinalRangeEditor;

const DomainItem = props => {
  const {
    domainValue,
    rangeValue,
    index,
    variable,
    updateScale,
    rangeValues
  } = props;

  const updateScaleRange = React.useCallback(v => {
    const domain = get(variable, ["scale", "domain"], []);
    const range = get(variable, ["scale", "range"], []);
    while (range.length < domain.length) {
      range.push(null);
    }
    range.splice(index, 1, v);
    updateScale({ range });
  }, [variable, updateScale, index]);

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="flex items-center">
        { domainValue }
      </div>
      <div>
        <MultiLevelSelect
          removable={ false }
          options={ rangeValues }
          value={ rangeValue }
          onChange={ updateScaleRange }/>
      </div>
    </div>
  )
}
