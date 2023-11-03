import React from "react"

import { format as d3format } from "d3-format"

import { ColorBar, strictNaN } from "~/modules/avl-map-2/src"

const Identity = i => i;
const useFormat = format => {
  return React.useMemo(() => {
    if (typeof format !== "string") return Identity;
    return d3format(format);
  }, [format]);
}

const OrdinalLegend = ({ domain, range, format }) => {
  return (
    <div>
      <div className="grid gap-1"
        style={ {
          gridTemplateColumns: `repeat(${ domain.length }, minmax(0, 1fr))`
        } }
      >
        { domain.map((d, i) => (
            <ColorBar key={ i } colors={ [range[i % range.length]] } height={ 3 }/>
          ))
        }
      </div>
      <div className="grid gap-1 text-right"
        style={ {
          gridTemplateColumns: `repeat(${ domain.length }, minmax(0, 1fr))`
        } }
      >
        { domain.map(d => <div key={ d } className="pr-1">{ format(d) }</div>) }
      </div>
    </div>
  )
}

const VerticalOrdinalLegend = ({ domain, range, format }) => {
  return (
    <div>
      { domain.map((d, i) => (
          <div className="flex items-center" key={ i }>
            <div className="w-8 mb-1 mr-1">
              <ColorBar key={ i } colors={ [range[i % range.length]] } height={ 3 }/>
            </div>
            <div className="flex-1">{ format(d) }</div>
          </div>
        ))
      }
    </div>
  )
}

const LegendTicks = ({ type, domain, range, format }) => {
  const size = range.length;
  return type === "threshold" ? (
    <div className="flex text-left">
      <div style={ { width: `${ 100 / size }%` } }/>
      { domain.map((d, i) => (
          <div key={ d }
            className="pl-1"
            style={ { width: `${ 100 / size }%` } }
          >
            { format(d) }
          </div>
        ))
      }
    </div>
  ) : (
    <div className="flex text-right">
      { domain.map((d, i) => (
          <div key={ d }
            className="pr-1"
            style={ { width: `${ 100 / size }%` } }
          >
            { format(d) }
          </div>
        ))
      }
    </div>
  )
}

const NonOrdinalLegend = ({ range, ...rest }) => {
  return (
    <div>
      <ColorBar colors={ range } height={ 3 }/>
      <LegendTicks range={ range } { ...rest }/>
    </div>
  )
}

const Legend = ({ type, isVertical = false, format, ...rest }) => {
  const Format = useFormat(format);
  return (
    type === "ordinal" ?
      isVertical ?
        <VerticalOrdinalLegend { ...rest } format={ Format }/> :
        <OrdinalLegend { ...rest } format={ Format }/> :
      <NonOrdinalLegend type={ type } { ...rest } format={ Format }/>
  )
}
export default Legend;
