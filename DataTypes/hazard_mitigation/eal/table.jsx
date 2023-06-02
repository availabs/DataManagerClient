import { Table, useFalcor } from "../../../../../modules/avl-components/src";
import get from "lodash/get";
import React, { useEffect, useMemo, useState } from "react";

import { DamaContext } from "../../../store";
import { BarGraph } from "../../../../../modules/avl-graph/src";
import { fnum, fnumIndex } from "../../../utils/macros"
import { hazardsMeta } from "../../constants/colors";

const RenderVersions = (domain, value, onchange, valueKey = 'view_id', labelKey = 'version') => (
  <select
    className={`w-40 pr-4 py-3 bg-white mr-2 flex items-center text-sm`}
    value={value}
    onChange={(e) => onchange(e.target.value)
    }
  >
    {domain.sort((a,b) => b[valueKey] - a[valueKey]).map((v, i) => (
      <option key={i} value={v[valueKey]} className="ml-2  truncate">{v[labelKey]}</option>
    ))}
  </select>
)

const RenderComparativeStats = ({chartComparativeStatsData = []}) => {
  console.log('??', chartComparativeStatsData)
  const cols = Object.keys((chartComparativeStatsData[0] || {}))
  console.log('cols', cols)
  return (
    <>
      <div
        className={'flex flex-row py-4 sm:py-2 sm:gap-4 sm:px-6 text-lg font-md'}>
        All Stats
      </div>

      <div className={`py-4 sm:py-2  sm:gap-4 sm:px-6 border-b-2 max-w-5xl`}>
        <Table
          columns={
            cols.map(col => ({
              Header: col,
              accessor: col,
              Cell: cell => col === 'nri_category' ? cell.value : fnum(cell.value),
              align: 'left'
            }))
          }
          data={chartComparativeStatsData}
          pageSize={chartComparativeStatsData.length}
        />


      </div>
    </>
  )
}

const HoverComp = ({data, keys, indexFormat, keyFormat, valueFormat}) => {
  return (
    <div className={`
      flex flex-col px-2 pt-1 rounded bg-white
      ${keys.length <= 1 ? "pb-2" : "pb-1"}`}>
      <div className="font-bold text-lg leading-6 border-b-2 mb-1 pl-2">
        {indexFormat(get(data, "index", null))}
      </div>
      {keys.slice()
        // .filter(k => get(data, ["data", k], 0) > 0)
        .filter(key => data.key === key)
        .reverse().map(key => (
          <div key={key} className={`
            flex items-center px-2 border-2 rounded transition
            ${data.key === key ? "border-current" : "border-transparent"}
          `}>
            <div className="mr-2 rounded-sm color-square w-5 h-5"
                 style={{
                   backgroundColor: get(data, ["barValues", key, "color"], null),
                   opacity: data.key === key ? 1 : 0.2
                 }}/>
            <div className="mr-4">
              {keyFormat(key)}:
            </div>
            <div className="text-right flex-1">
              {valueFormat(get(data, ["data", key], 0))}
            </div>
          </div>
        ))
      }
      {keys.length <= 1 ? null :
        <div className="flex pr-2">
          <div className="w-5 mr-2"/>
          <div className="mr-4 pl-2">
            Total:
          </div>
          <div className="flex-1 text-right">
            {valueFormat(keys.reduce((a, c) => a + get(data, ["data", c], 0), 0))}
          </div>
        </div>
      }
    </div>
  )
}

const processData = (data) => data.map(d => ({nri_category: d.nri_category, avail_eal: d.avail_eal, nri_eal: d.nri_eal, diff: ((d.avail_eal - d.nri_eal)/ d.nri_eal) * 100}))

export const MegaTable = ({source, views}) => {
  const {falcor, falcorCache} = useFalcor();
  const { pgEnv } = React.useContext(DamaContext)
  const [activeView, setActiveView] = useState(views[0].view_id);
  const [hazard, setHazard] = useState('hurricane');
  const hazards = Object.keys(hazardsMeta).map(h => ({key: h, value: h}));

  useEffect(() => {
    falcor.get(
      ['comparative_stats', pgEnv, 'byEalIds', 'source', source.source_id, 'view', [activeView], 'mega']
    )
  }, [activeView, falcor, source.source_id, pgEnv])

  const chartComparativeStatsData =
       get(falcorCache, ['comparative_stats', pgEnv, 'byEalIds', 'source', source.source_id, 'view', activeView, 'mega', 'value'], [])
        .filter(d => d.nri_category === hazard)

  const cols = Object.keys(chartComparativeStatsData[0] || {})
                      .map(col => ({
                        Header: col,
                        accessor: col,
                        align: 'left',
                        filter: 'text'
                      }))
  console.log(chartComparativeStatsData)
  return (
    <div>
      <div key={'versionSelector'}
           className={'flex flex-row items-center py-4 sm:py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'}>
        <label>Current Version: </label>
        {RenderVersions(views, activeView, setActiveView)}
        {RenderVersions(hazards, hazard, setHazard, 'value', 'key')}
      </div>
      <div className={`max-w-6xl overflow-auto scrollbar-sm`}>
        <Table
          data={chartComparativeStatsData}
          columns={cols}
          pageSize={50}
        />
      </div>
    </div>
  )
}