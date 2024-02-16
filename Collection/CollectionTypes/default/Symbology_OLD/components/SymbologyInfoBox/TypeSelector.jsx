import React from "react"

import get from "lodash/get"
import isEqual from "lodash/isEqual"
import { range as d3range, extent as d3extent, bisectRight, bisectLeft } from "d3-array"
import { format as d3format } from "d3-format"
import { brushX as d3brush } from "d3-brush"
import { select as d3select, pointers } from "d3-selection"
import { scalePoint } from "d3-scale"

import {
  MultiLevelSelect,
  Button,
  useTheme,
  strictNaN
} from "~/modules/avl-map-2/src";

import { myrange } from "../utils"

import ThresholdEditor from "./ThresholdEditor"

const LegendTypes = [
  { value: "quantile", name: "Quantile", variableType: "data-variable" },
  { value: "threshold", name: "Threshold", variableType: "data-variable" },
  { value: "ordinal", name: "Ordinal", variableType: "meta-variable" }
]

const displayAccessor = t => t.name;
const valueAccessor = t => t.value;

const TypSelector = ({ scale, updateScale, variableType, ...props }) => {

  const [isOpen, setIsOpen] = React.useState(false);
  const toggle = React.useCallback(e => {
    setIsOpen(io => !io);
  }, []);

  const onChange = React.useCallback(type => {
    updateScale({ type, domain: [] });
  }, [updateScale]);

  const options = React.useMemo(() => {
    return LegendTypes.filter(lt => lt.variableType === variableType);
  }, [variableType]);

  return (
    <React.Fragment>
      <div className="flex">
        <div className="w-8 flex">
          { scale.type !== "threshold" ? null :
            <Button onClick={ toggle } className="buttonBlockText">
              <span
                className={ `
                  fas fa-xl ${ isOpen ? "fa-caret-up" : "fa-caret-down" }
                ` }/>
            </Button>
          }
        </div>
        <div className="flex-1">
          <div className="grid grid-cols-2 gap-2">
            <div className="py-1 text-right">
              Scale Type:
            </div>
            <div>
              <MultiLevelSelect
                removable={ false }
                options={ options }
                displayAccessor={ displayAccessor }
                valueAccessor={ valueAccessor }
                onChange={ onChange }
                value={ scale.type }/>
            </div>
          </div>
        </div>
      </div>

      { scale.type !== "threshold" ? null :
        <div className={ isOpen ? "block" : "hidden h-0 overflow-hidden" }>
          <ThresholdEditor
            { ...props } { ...scale }
            updateScale={ updateScale }/>
        </div>
      }
    </React.Fragment>
  )
}
export default TypSelector;
