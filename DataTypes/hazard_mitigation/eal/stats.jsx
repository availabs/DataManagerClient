import { Table, useFalcor } from "../../../../../modules/avl-components/src";
import get from "lodash/get";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectPgEnv } from "../../../store";
import { BarGraph } from "../../../../../modules/avl-graph/src";
import { fnum, fnumIndex } from "../../../utils/macros"

const RenderVersions = (domain, value, onchange) => (
  <select
    className={`w-40 pr-4 py-3 bg-white mr-2 flex items-center text-sm`}
    value={value}
    onChange={(e) => onchange(e.target.value)
    }
  >
    {domain.map((v, i) => (
      <option key={i} value={v.view_id} className="ml-2  truncate">{v.version}</option>
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

export const Stats = ({source, views}) => {
  const {falcor, falcorCache} = useFalcor();
  const pgEnv = useSelector(selectPgEnv);
  const [activeView, setActiveView] = useState(views[0].view_id);
  const [compareView, setCompareView] = useState(views[0].view_id);
  const [compareMode, setCompareMode] = useState(undefined);

  useEffect(() => {
    falcor.get(
      ['comparative_stats', pgEnv, 'byEalIds', 'source', source.source_id, 'view', [activeView, compareView]]
    )
  }, [activeView, compareView, falcor, source.source_id, pgEnv])

  const chartComparativeStatsData = get(falcorCache, ['comparative_stats', pgEnv, 'byEalIds', 'source', source.source_id, 'view', activeView, 'value'], []);
  const chartComparativeStatsCompareData = get(falcorCache, ['comparative_stats', pgEnv, 'byEalIds', 'source', source.source_id, 'view', compareView, 'value'], []);
  const metadataActiveView = processData(chartComparativeStatsData);
  const metadataCompareView = processData(chartComparativeStatsCompareData)

  // if (!metadataActiveView || metadataActiveView.length === 0) return <div> Stats Not Available </div>

  return (
    <div>
      <div key={'versionSelector'}
           className={'flex flex-row items-center py-4 sm:py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'}>
        <label>Current Version: </label>
        {RenderVersions(views, activeView, setActiveView)}
        <button
          className={`${compareMode ? `bg-red-50 hover:bg-red-400` : `bg-blue-100 hover:bg-blue-600`}
                     hover:text-white align-right border-2 border-gray-100 p-2 hover:bg-gray-100`}
          disabled={views.length === 1}
          onClick={() => setCompareMode(!compareMode)}
        >
          {compareMode ? `Discard` : `Compare`}
        </button>
      </div>
      <div key={'compareVersionSelector'}
           className={'flex flex-row items-center py-4 sm:py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'}>
        {compareMode ? <label>Compare with Version: </label> : null}
        {compareMode ? RenderVersions(views, compareView, setCompareView) : null}
      </div>

      {
        (!metadataActiveView || metadataActiveView.length === 0) ? <div> Stats Not Available </div> :
          (
            <>
              <div className={`w-full p-4 my-1 block flex flex-col`} style={{height: '350px'}}>
                <label key={'nceiLossesTitle'} className={'text-lg'}> EAL (SWD, NRI and AVAIL) {views.find(v => v.view_id.toString() === activeView.toString()).version} </label>
                <BarGraph
                  key={'numEvents'}
                  data={chartComparativeStatsData}
                  keys={Object.keys(chartComparativeStatsData[0] || {}).filter(key => key.includes('eal') || key.includes('annualized'))}
                  indexBy={'nri_category'}
                  axisBottom={{ tickDensity: 3, axisColor: '#000', axisOpacity: 0  }}
                  axisLeft={{ format: d => fnumIndex(d, 0), gridLineOpacity: 0.1, showGridLines: true, ticks: 5, axisColor: '#000', axisOpacity: 0 }}
                  paddingInner={0.1}
                  // colors={(value, ii, d, key) => ctypeColors[key]}
                  hoverComp={{
                    HoverComp: HoverComp,
                    valueFormat: fnumIndex
                  }}
                  groupMode={'grouped'}
                />
              </div>


              {compareMode ?
                <div className={`w-full p-4 my-1 block flex flex-col`} style={{height: '350px'}}>
                  <label key={'nceiLossesTitle'} className={'text-lg'}> EAL (SWD, NRI and AVAIL) {views.find(v => v.view_id.toString() === compareView.toString()).version} </label>
                  <BarGraph
                    key={'numEvents'}
                    data={chartComparativeStatsCompareData}
                    keys={Object.keys(chartComparativeStatsCompareData[0] || {}).filter(key => key.includes('eal') || key.includes('annualized'))}
                    indexBy={'nri_category'}
                    axisBottom={{ tickDensity: 3, axisColor: '#000', axisOpacity: 0  }}
                    axisLeft={{ format: d => fnumIndex(d, 0), gridLineOpacity: 0.1, showGridLines: true, ticks: 5, axisColor: '#000', axisOpacity: 0 }}
                    paddingInner={0.1}
                    // colors={(value, ii, d, key) => ctypeColors[key]}
                    hoverComp={{
                      HoverComp: HoverComp,
                      valueFormat: fnumIndex
                    }}
                    groupMode={'grouped'}
                  />
                </div> : null}
              <RenderComparativeStats chartComparativeStatsData={chartComparativeStatsData} />

              <div
                className={'flex flex-row items-center py-4 sm:py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 text-lg font-md'}>
                EAL by Type
              </div>
              <div>
                <div className={`py-4 sm:py-2 sm:grid sm:grid-cols-${compareMode ? 7 : 4} sm:gap-4 sm:px-6 border-b-2`}>
                  <dt className="text-sm font-medium text-gray-600">
                    Event Type
                  </dt>
                  <dd className="text-sm font-medium text-gray-600 ">
                    Avail EAL {compareMode ? `(${views.find(v => v.view_id.toString() === activeView.toString()).version})` : null}
                  </dd>
                  <dd className="text-sm font-medium text-gray-600 ">
                    NRI EAL {compareMode ? `(${views.find(v => v.view_id.toString() === activeView.toString()).version})` : null}
                  </dd>
                  <dd className="text-sm font-medium text-gray-600 ">
                    % diff {compareMode ? `(${views.find(v => v.view_id.toString() === activeView.toString()).version})` : null}
                  </dd>


                  {
                    compareMode &&
                    <dd className="text-sm font-medium text-gray-600 ">
                      Avail EAL {`(${views.find(v => v.view_id.toString() === compareView.toString()).version})`}
                    </dd>
                  }

                  {
                    compareMode &&
                    <dd className="text-sm font-medium text-gray-600 ">
                      NRI EAL {`(${views.find(v => v.view_id.toString() === compareView.toString()).version})`}
                    </dd>
                  }

                  {
                    compareMode &&
                    <dd className="text-sm font-medium text-gray-600 ">
                      % diff {`(${views.find(v => v.view_id.toString() === compareView.toString()).version})`}
                    </dd>
                  }
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-0 overflow-auto h-[700px]">
                  <dl className="sm:divide-y sm:divide-gray-200">

                    {
                      metadataActiveView
                        .sort((a, b) => a.diff - b.diff)
                        .map((col, i) => (
                          <div key={i} className={`py-4 sm:py-5 sm:grid sm:grid-cols-${compareMode ? 7 : 4} sm:gap-4 sm:px-6`}>
                            <dt className="text-sm text-gray-900">
                              {col.nri_category}
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                              {fnum(col.avail_eal)}
                            </dd>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                              {fnum(col.nri_eal)}
                            </dd>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                              {(col.diff).toFixed(2)} %
                            </dd>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                              {
                                compareMode &&
                                fnum(get(metadataCompareView
                                  .find(row => row.nri_category === col.nri_category), 'avail_eal'))
                              }
                            </dd>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                              {
                                compareMode &&
                                fnum(get(metadataCompareView
                                  .find(row => row.nri_category === col.nri_category), 'nri_eal'))
                              }
                            </dd>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                              {
                                compareMode &&
                                `${(get(metadataCompareView
                                  .find(row => row.nri_category === col.nri_category), 'diff')).toFixed(2)} %`
                              }
                            </dd>
                          </div>
                        ))
                    }

                  </dl>
                </div>
              </div>
            </>
          )
      }

    </div>
  )
}