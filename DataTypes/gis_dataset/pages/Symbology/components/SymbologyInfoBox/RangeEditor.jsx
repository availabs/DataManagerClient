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

import TypeSelector from "./TypeSelector"

const format = d3format(".2r");

const SimpleControls = ({ scale, updateScale, min, max, ...props }) => {

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
      .domain(myrange(min, max, scale.step))
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
      .text(d => format(d));

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
        const scaleRangeLength = scale.range.length;
        if (scaleRangeLength !== range.length) {
          updateScale({ range, domain: [] });
        }
        else {
          updateScale({ range });
        }
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

  return (
    <div>
      <svg ref={ setSvgRef }
        style={ { height: "32px" } }
        className="block w-full bg-white"
      >
        <g className="brush-group"/>
        <g className="text-group pointer-events-none"/>
      </svg>
    </div>
  )
}

const AdvancedControls = ({ scale }) => {
  return (
    <div>
      Range Values:
      <div className="flex">
        { scale.range.map(r => (
            <div key={ r } className="text-center flex-1">
              { format(r) }
            </div>
          ))
        }
      </div>
    </div>
  )
}

const DisplayItem = ({ children, active, hasChildren }) => {
  const theme = useTheme();
  return (
    <div
      className={ `
        px-1 text-sm flex items-center text-left min-w-fit max-w-full whitespace-nowrap
        ${ active ? theme.bgAccent3 : `${ theme.bgAccent2Hover } ${ theme.bgAccent1 }` }
      ` }
    >
      <div className="flex-1">{ children }</div>
      { !hasChildren ? null :
        <span className="fa fa-caret-right ml-2"/>
      }
    </div>
  )
}

const RangeEditor = props => {

  const { updateScale, scale, steps, min, max } = props;

  const [e0, e1] = React.useMemo(() => {
    const range = get(scale, "range", []);
    return d3extent(range);
  }, [scale]);

  const setStepSize = React.useCallback(step => {
    step = +step;
    const e1 = d3extent(scale.range);
    const newValues = myrange(min, max, step);
    const i0 = bisectLeft(newValues, e1[0]);
    const i1 = bisectRight(newValues, e1[1]);
    const r0 = newValues[i0];
    const r1 = newValues[i1 - 1];
    const range = myrange(r0, r1, step);
    updateScale({
      range,
      step,
      domain: []
    });
  }, [scale, min, max]);

  return (
    <div>
      <div className="grid grid-cols-1 gap-1">

        <TypeSelector { ...props }
          updateScale={ updateScale }
          scale={ scale }/>

        <div className="flex items-center">
          <div>Step Size:</div>
          <div className="flex-1 ml-1">
            { steps.includes(scale.step) ?
              <MultiLevelSelect removable={ false }
                options={ steps }
                value={ scale.step }
                onChange={ setStepSize }
                DisplayItem={ DisplayItem }/> :
              <div className="px-2 py-1 pr-8 text-right">
                { scale.step }
              </div>
            }
          </div>
        </div>

        { strictNaN(e0) ? null :
          <div className="flex">
            <div className="flex-1">Current Minimum Value:</div>
            <div className="pr-8">{ e0 }</div>
          </div>
        }
        { strictNaN(e1) ? null :
          <div className="flex">
            <div className="flex-1">Current Maximum Value:</div>
            <div className="pr-8">{ e1 }</div>
          </div>
        }

        { steps.includes(scale.step) ?
          <SimpleControls { ...props }
            updateScale={ updateScale }/> :
          <AdvancedControls { ...props }
            updateScale={ updateScale }/>
        }

      </div>
    </div>
  )
}
export default RangeEditor;
