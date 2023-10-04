import React from "react"

import get from "lodash/get"
import isEqual from "lodash/isEqual"
import { range as d3range, bisectRight } from "d3-array"
import { format as d3format } from "d3-format"
import { brushX as d3brush } from "d3-brush"
import { select as d3select } from "d3-selection"
import { scaleLinear, scaleQuantize, scalePoint } from "d3-scale"

import {
  MultiLevelSelect,
  BooleanSlider,
  ColorRanges,
  ColorBar,
  Input,
  Button,
  useTheme
} from "~/modules/avl-map-2/src";

import "./brush.css"

const strictNaN = v => (v === "") || (v === null) || isNaN(v);

const RangeItem = ({ value }) => {
  const format = d3format(",.1f");
  return (
    <div className="text-center">{ format(value) }</div>
  )
}

const SimpleControls = ({ variable, updateScale }) => {

  const {
    scale
  } = variable;

  const {
    min, max, step, range
  } = scale;

  React.useEffect(() => {
    const rng = d3range(min, max + step, step);
    if (!isEqual(range, rng)) {
      updateScale({ range: rng })
    }
  }, [min, max, step, range, updateScale]);

  const [svgRef, setSvgRef] = React.useState(null);
  const [ref, setRef] = React.useState(null);
  const [width, setWidth] = React.useState(0);

  React.useEffect(() => {
    if (!svgRef) return;
    const bbox = svgRef.getBoundingClientRect();
    setWidth(bbox.width);
  }, [svgRef]);

  React.useEffect(() => {
    if (!width || !ref) return;

    const scale = scalePoint()
      .domain(d3range(0, 1 + step, step))
      .range([0, width])
      .padding(0.5);

    const svg = d3select(svgRef);

    svg.selectAll("g.text-group")
      .data(["text-group"])
      .join("g")
        .attr("class", d => d)
        .attr("font-family", "var(--sans-serif)")
        .attr("text-anchor", "middle")
        // .attr("transform", `translate(${scale.bandwidth() / 2},${32 / 2})`)
      .selectAll("text")
      .data(scale.domain())
      .join("text")
        .attr("x", d => scale(d))
        .attr("dy", "14px")
        .text(d => d.toFixed(1));

    function brushed({selection}) {
      if (selection) {
        const range = scale.domain().map(scale);
        const i0 = bisectRight(range, selection[0]);
        const i1 = bisectRight(range, selection[1]);
        // bar.attr("fill", (d, i) => i0 <= i && i < i1 ? "orange" : null);
        svg.property("value", scale.domain().slice(i0, i1)).dispatch("input");
      } else {
        // bar.attr("fill", null);
        svg.property("value", []).dispatch("input");
      }
    }

    function brushended({selection, sourceEvent}) {
      if (!sourceEvent || !selection) return;
      const range = scale.domain().map(scale)
      const dx = scale.step() / 2;
      const x0 = range[bisectRight(range, selection[0])] - dx;
      const x1 = range[bisectRight(range, selection[1]) - 1] + dx;
      d3select(this).transition().call(brush.move, x1 > x0 ? [x0, x1] : null);
    }

    const brush = d3brush()
      .extent([[0, 0], [width, 16]])
      .on("start brush end", brushed)
      .on("end.snap", brushended);

    d3select(svgRef)
      .attr("viewBox", [0, 0, width, 32]);

    d3select(ref).call(brush);
  }, [width, min, max, step]);

  return (
    <div>
      <svg ref={ setSvgRef }
        style={ { height: "32px" } }
        className="w-full bg-gray-500"
      >
        <g ref={ setRef }/>
        <g className="text-group" />
      </svg>
    </div>
  )
}

const RangeEditor = props => {

  const {
    variable,
    updateScale,
    variableType,
    MapActions,
    min, max,
    data
  } = props;

  const {
    scale
  } = variable;

  const doUpdateScale = React.useCallback((key, value) => {
    if (typeof key === "string") {
      updateScale({ [key]: value });
    }
    else if (typeof key === "object") {
      updateScale({ ...key });
    }
  }, [updateScale]);

  const [controls, setControls] = React.useState("simple")

  return (
    <div>
      RangeEditor: { `${ min }, ${ max }` }
      <div className="grid grid-cols-1 gap-1">
        <TypeSelector
          variableType={ variableType }
          scaleType={ scale.type }
          updateScale={ doUpdateScale }/>
        <div className="grid gap-1"
          style={ {
            gridTemplateColumns: `repeat(${ scale.range.length + 1 }, minmax(0, 1fr))`
          } }
        >
          <div>Range:</div>
          { scale.range.map(r => (
              <RangeItem key={ r } value={ r }/>
            ))
          }
        </div>

        <SimpleControls { ...props }
          updateScale={ doUpdateScale }/>

      </div>
    </div>
  )
}
export default RangeEditor;

const LegendTypes = [
  { value: "quantile", name: "Quantile", variableType: "data-variable" },
  { value: "threshold", name: "Threshold", variableType: "data-variable" },
  { value: "ordinal", name: "Ordinal", variableType: "meta-variable" }
]
const TypeSelector = ({ scaleType, updateScale, variableType }) => {
  const onChange = React.useCallback(t => {
    updateScale("type", t);
  }, [updateScale]);
  const options = React.useMemo(() => {
    return LegendTypes.filter(lt => lt.variableType === variableType);
  }, [variableType]);
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="py-1 text-right">
        Scale Type:
      </div>
      <div>
        <MultiLevelSelect
          removable={ false }
          options={ options }
          displayAccessor={ t => t.name }
          valueAccessor={ t => t.value }
          onChange={ onChange }
          value={ scaleType }/>
      </div>
    </div>
  )
}
