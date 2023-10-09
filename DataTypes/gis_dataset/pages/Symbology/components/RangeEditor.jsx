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
  BooleanSlider,
  ColorRanges,
  ColorBar,
  Input,
  Button,
  useTheme,
  strictNaN
} from "~/modules/avl-map-2/src";

import "./brush.css"

const RangeItem = ({ value }) => {
  const format = d3format(",.1f");
  return (
    <div className="text-center">{ format(value) }</div>
  )
}

const myrange = (min, max, step) => {
  const mult = 1000.0;
  const m1 = Math.trunc(min * mult);
  const m2 = Math.trunc(max * mult);
  const s = Math.trunc(step * mult);
  return d3range(m1, m2, s).map(v => v / mult);
}

const SimpleControls = ({ variable, updateScale, min, max, steps, ...props }) => {

  const { scale } = variable;

  // React.useEffect(() => {
  //   const { min, max, step, range } = scale;
  //   const rng = myrange(min, max + step, step);
  //   if (!isEqual(range, rng)) {
  //     updateScale({ range: rng })
  //   }
  // }, [scale, updateScale]);

  const [svgRef, setSvgRef] = React.useState(null);
  const [width, setWidth] = React.useState(0);

  React.useEffect(() => {
    if (!svgRef) return;
    const bbox = svgRef.getBoundingClientRect();
    setWidth(bbox.width);
  }, [svgRef]);

  React.useEffect(() => {
    if (!width) return;

    const height = 32;
    const margin = 4;

    const pointScale = scalePoint()
      .domain(myrange(min, max + scale.step, scale.step))
      .range([margin, width - margin])
      .padding(0.5);

    const pointScaleRange = pointScale.domain().map(pointScale);

    const dx = pointScale.step() / 2;

    const svgSelection = d3select(svgRef)
      .attr("viewBox", [0, 0, width, height]);

    const tickDensity = 8;

    const density = 100 / tickDensity;
    let tick = 0;
    const domain = pointScale.domain();
    const tickValues = [domain[0]];

    for (let i = 1; i < domain.length; ++i) {
      tick += pointScale(domain[i]) - pointScale(domain[i - 1]);
      if (tick >= density) {
        tickValues.push(domain[i]);
        tick = 0;
      }
    }

    svgSelection.select("g.text-group")
      .attr("font-family", "var(--sans-serif)")
      .attr("text-anchor", "middle")
      .attr("transform", `translate(${ pointScale.bandwidth() / 2 }, ${ height / 2 })`)
    .selectAll("text")
    .data(tickValues)
    .join("text")
      .attr("x", pointScale)
      .attr("dy", "0.25rem")
      .attr("font-size", "0.625rem")
      .text(d => scale.step >= 1 ? d : scale.step === 0.25 ? d.toFixed(2) : d.toFixed(1));

    const bar = svgSelection.select("g.brush-group")
    .selectAll("rect")
    .data(pointScale.domain())
    .join("rect")
      .attr("class", "fill-gray-300")
      .attr("fill-opacity", 1)
      .attr("x", d => pointScale(d) - dx)
      .attr("y", margin)
      .attr("height", height - margin * 2)
      .attr("width", pointScale.step());

    function brushed({ selection }) {
      if (selection) {
        const i0 = bisectRight(pointScaleRange, selection[0]);
        const i1 = bisectRight(pointScaleRange, selection[1]);
        bar.attr("class", (d, i) => (i0 <= i) && (i < i1) ? "fill-teal-500" : "fill-gray-300");
      } else {
        bar.attr("class", "fill-gray-300");
      }
    }

    function brushended({ selection, sourceEvent }) {
      if (!sourceEvent || !selection) return;
      const i0 = bisectRight(pointScaleRange, selection[0]);
      const i1 = bisectRight(pointScaleRange, selection[1]);
      const x0 = pointScaleRange[i0] - dx;
      const x1 = pointScaleRange[i1 - 1] + dx;
      if (x1 > x0) {
        const range = pointScale.domain().slice(i0, i1);
        updateScale({ range });
      }
    }

    const brush = d3brush()
      .extent([[margin, margin], [width - margin, height - margin]])
      .on("start brush end", brushed)
      .on("end.snap", brushended);

    const extent = d3extent(scale.range);

    svgSelection
      .select("g.brush-group")
        .call(brush)
        .call(brush.move, [pointScale(extent[0]) - dx, pointScale(extent[1]) + dx]);

    svgSelection
      .select("rect.selection")
        .attr("stroke", "none")
        .attr("class", "selection fill-gray-500");

    svgSelection
      .selectAll("rect.handle")
        .classed("fill-gray-600", true)

  }, [width, min, max, scale, updateScale]);

  const setStepSize = React.useCallback(step => {
    step = +step;
    const e1 = d3extent(scale.range);
    const newValues = myrange(min, max + step, step);
    const i0 = bisectLeft(newValues, e1[0]);
    const i1 = bisectRight(newValues, e1[1]);
    const r0 = newValues[i0];
    const r1 = newValues[i1 - 1];
    const range = myrange(r0, r1 + step, step);
    updateScale({
      range,
      step
    });
  }, [scale]);

  return (
    <div>
      <svg ref={ setSvgRef }
        style={ { height: "32px" } }
        className="block w-full bg-white"
      >
        <g className="brush-group"/>
        <g className="text-group pointer-events-none"/>
      </svg>
      <div className="flex items-center mt-1">
        <div>Step Size:</div>
        <div className="flex-1 ml-1">
          <MultiLevelSelect removable={ false }
            options={ steps }
            value={ scale.step }
            onChange={ setStepSize }/>
        </div>
      </div>
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

  const [controls, setControls] = React.useState("simple");

  const [e0, e1] = React.useMemo(() => {
    const range = get(scale, "range", []);
    return d3extent(range);
  }, [scale]);

  return (
    <div>
      <div className="grid grid-cols-1 gap-1">
        <TypeSelector
          variableType={ variableType }
          scaleType={ scale.type }
          updateScale={ doUpdateScale }/>

        { strictNaN(e0) ? null :
          <div className="flex">
            <div className="flex-1">Current Minimum Value:</div>
            <div className="pr-8">{ e0 }</div>
          </div>
        }
        { strictNaN(e1) ? null :
          <div className="flex">
            <div className="flex-1">Current Minimum Value:</div>
            <div className="pr-8">{ e1 }</div>
          </div>
        }

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
  const onChange = React.useCallback(type => {
    updateScale({ type, domain: [] });
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
