import React from "react"

import get from "lodash/get"

import {
  MultiLevelSelect
} from "~/modules/avl-map-2/src";

import { myrange } from "../utils"

const OrdinalRangeEditor = ({ variable, scale, min, max, steps, ...props }) => {

  const domain = React.useMemo(() => {
    return get(scale, "domain", []);
  }, [scale]);
  const range = React.useMemo(() => {
    return get(scale, "range", []);
  }, [scale]);

  const rangeValues = React.useMemo(() => {
    return myrange(min, max, steps[0]);
  }, [min, max, steps]);

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
              scale={ scale }
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
    scale,
    updateScale,
    rangeValues
  } = props;

  const updateScaleRange = React.useCallback(v => {
    const domain = get(scale, "domain", []);
    const range = get(scale, "range", []);
    while (range.length < domain.length) {
      range.push(null);
    }
    range.splice(index, 1, v);
    updateScale({ range });
  }, [scale, updateScale, index]);

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
