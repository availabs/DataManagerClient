import {Table, useFalcor} from "../../../../../modules/avl-components/src";
import get from "lodash.get";
import React, {useEffect, useState} from "react";
import {useSelector} from "react-redux";
import {selectPgEnv} from "../../../store";
import {BarGraph} from "../../../../../modules/avl-graph/src";
import {fnum, fnumIndex, range} from "../../../utils/macros"
import {useNavigate, useParams} from "react-router-dom";
import { getColorRange } from "@availabs/avl-components"

const DEFAULT_COLORS = getColorRange(12, "Set3");
const RenderVersions = (domain, value, onchange) => {
    const navigate = useNavigate();
    const {sourceId, page} = useParams();

    return (
        <select
            className={`w-40 pr-4 py-3 bg-white mr-2 flex items-center text-sm`}
            value={value}
            onChange={(e) => navigate(`/datasources/source/${sourceId}/${page}/${e.target.value}`)}
        >
            <option key={'select a version'} selected="true" disabled="disabled" className="ml-2  truncate">Select a
                Version
            </option>
            {domain
                .sort((a, b) => b.view_id - a.view_id)
                .map((v, i) => (
                    <option key={i} value={v.view_id} className="ml-2  truncate">{v.version}</option>
                ))
            }
        </select>
    );
}

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

const processData = (data) => data.map(d => ({
    nri_category: d.nri_category,
    avail_eal: d.avail_eal,
    nri_eal: d.nri_eal,
    diff: ((d.avail_eal - d.nri_eal) / d.nri_eal) * 100
}))

export const Stats = ({source, views}) => {
    const {viewId, sourceId, page} = useParams();
    const {falcor, falcorCache} = useFalcor();
    const pgEnv = useSelector(selectPgEnv);
    const [activeView, setActiveView] = useState(viewId);
    const [compareView, setCompareView] = useState(views[0].view_id);
    const [compareMode, setCompareMode] = useState(undefined);
    const [NCEIeView, setNCEIeView] = useState(undefined);

    const dependencyPath = ["dama", pgEnv, "viewDependencySubgraphs", "byViewId", activeView];
    const
        NCEIeAttributes = (groupByCols = {}) => ({
            ...groupByCols,
            [`sum(CASE 
                    WHEN coalesce(property_damage::double precision, 0) + coalesce(crop_damage::double precision, 0) + 
                         coalesce(injuries_direct::double precision, 0) + coalesce(injuries_indirect::double precision, 0) +
                         coalesce(deaths_direct::double precision, 0) + coalesce(deaths_indirect::double precision, 0) > 0
                    THEN 1
                    ELSE 0
		        END) as loss_events`]: `loss events`,
            [`(sum(
                    coalesce(property_damage::double precision, 0) + coalesce(crop_damage::double precision, 0) +
                    
                         (
                             ((coalesce(injuries_direct::double precision, 0) + coalesce(injuries_indirect::double precision, 0)) / 10) +
                             coalesce(deaths_direct::double precision, 0) + coalesce(deaths_indirect::double precision, 0)
                         ) * 11600000 
                )/ (max(year) - min(year))) / 1000000000 as damage`]: `damage`
        }),
        NCEIeOptions = (groupByCols = []) => JSON.stringify({
            aggregatedLen: true,
            filter: {
                year: range(1996, 2022)
            },
            exclude: {
                geoid: [null],
                ...groupByCols.reduce((acc, curr) => ({...acc, [curr]: [null]}), {})
            },
            groupBy: groupByCols
        }),
        NCEIePath = view_id => ["dama", pgEnv, "viewsbyId", view_id, "options"];

    useEffect(() => {
      if (!activeView) return Promise.resolve();

        async function getData(){
            const depsRes = await falcor.get(dependencyPath) // get deps
            const NCEIeVersion = get(depsRes, ["json", ...dependencyPath, "dependencies"], []).find(d => d.type === "ncei_storm_events_enhanced");
            setNCEIeView(NCEIeVersion.view_id);

            // get lengths
            const lenRes = await falcor.get(
                [...NCEIePath(NCEIeVersion.view_id), NCEIeOptions(['event_type_formatted']), 'length'],
                [...NCEIePath(NCEIeVersion.view_id), NCEIeOptions(['nri_category']), 'length'],
            );
            const etfLen = get(lenRes, ['json', ...NCEIePath(NCEIeVersion.view_id), NCEIeOptions(['event_type_formatted']), 'length']);
            const nriCatLen = get(lenRes, ['json', ...NCEIePath(NCEIeVersion.view_id), NCEIeOptions(['nri_category']), 'length']);

            // get data
            await falcor.get(
                [...NCEIePath(NCEIeVersion.view_id),
                    NCEIeOptions(['event_type_formatted']),
                    'databyIndex',
                    {from:0, to:etfLen-1},
                    Object.keys(NCEIeAttributes(
                        {'event_type_formatted': 'event_type_formatted'}
                    ))
                ],

                [...NCEIePath(NCEIeVersion.view_id),
                    NCEIeOptions(['nri_category']),
                    'databyIndex',
                    {from:0, to:nriCatLen-1},
                    Object.keys(NCEIeAttributes({'nri_category': 'nri_category'}))
                ],

                ['comparative_stats', pgEnv, 'byEalIds', 'source', source.source_id, 'view', [activeView, compareView]]
            );
        }

        return getData();
    }, [activeView, compareView, falcor, source.source_id, pgEnv])

    const NCEIeETFData = Object.values(get(falcorCache,
        [...NCEIePath(NCEIeView),
            NCEIeOptions(['event_type_formatted']),
            'databyIndex'], {}));
    const NCEIeNRICatData = Object.values(get(falcorCache,
        [...NCEIePath(NCEIeView),
            NCEIeOptions(['nri_category']),
            'databyIndex'], {}));
    console.log('data', (NCEIeETFData), (NCEIeNRICatData))

    const chartComparativeStatsData = get(falcorCache, ['comparative_stats', pgEnv, 'byEalIds', 'source', source.source_id, 'view', activeView, 'value'], []);
    const chartComparativeStatsCompareData = get(falcorCache, ['comparative_stats', pgEnv, 'byEalIds', 'source', source.source_id, 'view', compareView, 'value'], []);
    const metadataActiveView = processData(chartComparativeStatsData);
    const metadataCompareView = processData(chartComparativeStatsCompareData)

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
                            <div className={`w-full p-4 my-1 block flex flex-col`} style={{height: '400px'}}>
                                <label key={'nceiLossesTitle'}
                                       className={'text-lg'}> {views.find(v => v.view_id.toString() === activeView.toString())?.version} (SWD,
                                    NRI and AVAIL)</label>
                                <div className={'w-full px-5'}>
                                    <div className={'flex justify-between w-1/4 float-right pr-12'}>
                                        {
                                            ['NCEI', 'NRI', 'AVAIL']
                                                .map((key, i) => (
                                                    <div style={{
                                                        height: '20px',
                                                        width: '20px',
                                                        backgroundColor: DEFAULT_COLORS[i]
                                                    }}>
                                                        <label className={'p-2 pl-7'}>{key}</label>
                                                    </div>
                                                ))
                                        }
                                    </div>
                                </div>
                                <BarGraph
                                    key={'numEvents'}
                                    data={chartComparativeStatsData}
                                    keys={Object.keys(chartComparativeStatsData[0] || {}).filter(key => key.includes('eal') || key.includes('annualized'))}
                                    indexBy={'nri_category'}
                                    axisBottom={{tickDensity: 3, axisColor: '#000', axisOpacity: 0}}
                                    axisLeft={{
                                        format: d => fnumIndex(d, 0),
                                        gridLineOpacity: 0.1,
                                        showGridLines: true,
                                        ticks: 5,
                                        axisColor: '#000',
                                        axisOpacity: 0
                                    }}
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
                                    <label key={'nceiLossesTitle'} className={'text-lg'}> EAL (SWD, NRI and
                                        AVAIL) {views.find(v => v.view_id.toString() === compareView.toString()).version} </label>
                                    <BarGraph
                                        key={'numEvents'}
                                        data={chartComparativeStatsCompareData}
                                        keys={Object.keys(chartComparativeStatsCompareData[0] || {}).filter(key => key.includes('eal') || key.includes('annualized'))}
                                        indexBy={'nri_category'}
                                        axisBottom={{tickDensity: 3, axisColor: '#000', axisOpacity: 0}}
                                        axisLeft={{
                                            format: d => fnumIndex(d, 0),
                                            gridLineOpacity: 0.1,
                                            showGridLines: true,
                                            ticks: 5,
                                            axisColor: '#000',
                                            axisOpacity: 0
                                        }}
                                        paddingInner={0.1}
                                        // colors={(value, ii, d, key) => ctypeColors[key]}
                                        hoverComp={{
                                            HoverComp: HoverComp,
                                            valueFormat: fnumIndex
                                        }}
                                        groupMode={'grouped'}
                                    />
                                </div> : null}
                            <RenderComparativeStats chartComparativeStatsData={chartComparativeStatsData}/>

                            <Table
                                data={metadataActiveView}
                                columns={
                                        Object.keys(metadataActiveView[0] || {})
                                            .map(col => ({
                                                Header: col,
                                                accessor: col,
                                                Cell: cell => col === 'diff' ?
                                                    `${(cell?.value || 0).toFixed(2)} %` :
                                                    col === 'nri_category' ? cell?.value : fnum(cell?.value || 0, true),
                                                align: col === 'nri_category' ? 'left' : 'right',
                                                sortType: 'basic',
                                            }))
                                        }
                                sortBy={'diff'}
                                pageSize={18}
                            />

                          <div>
                              <label className={'w-full'}>Moving Coastal to Hurricane</label>
                              <div className={'flex'}>
                                  <div className={'w-1/2'}>
                                      <Table
                                          data={NCEIeETFData}
                                          columns={
                                              Object.keys(NCEIeETFData[0])
                                                  .map(col => {
                                                      const mappedName = NCEIeAttributes({event_type_formatted: 'Pre Coastal->Hurricane'})[col] || col
                                                      return {
                                                          Header: mappedName,
                                                          accessor: col,
                                                          align: col === 'event_type_formatted' ? 'left' : 'right',
                                                          Cell: cell => col === 'event_type_formatted' ? cell.value :
                                                              mappedName === 'loss events' ? cell.value?.toLocaleString() :
                                                                  `$ ${cell.value?.toFixed(cell.value < 0.009 ? 4 : 2)} B`
                                                      }
                                                  })
                                          }
                                          sortBy={'event_type_formatted'}
                                          pageSize={18}
                                      />
                                  </div>

                                  <div className={'w-1/2'}>
                                      <Table
                                          data={NCEIeNRICatData}
                                          columns={
                                              Object.keys(NCEIeNRICatData[0])
                                                  .map(col => {
                                                      const mappedName = NCEIeAttributes({nri_category: 'Post Coastal->Hurricane'})[col] || col
                                                      return {
                                                          Header: mappedName,
                                                          accessor: col,
                                                          align: col === 'nri_category' ? 'left' : 'right',
                                                          Cell: cell => col === 'nri_category' ? cell.value :
                                                              mappedName === 'loss events' ? cell.value?.toLocaleString() :
                                                                  `$ ${cell.value?.toFixed(cell.value < 0.009 ? 4 : 2)} B`
                                                      }
                                                  })
                                          }
                                          sortBy={'nri_category'}
                                          pageSize={18}
                                      />
                                  </div>
                              </div>
                          </div>
                        </>
                    )
            }

        </div>
    )
}