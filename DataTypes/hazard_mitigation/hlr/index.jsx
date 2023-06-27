import React, {useEffect, useState} from 'react';
import Create from './create'
import {useFalcor} from "~/modules/avl-components/src";
import get from "lodash/get";

import { DamaContext } from "../../../store";
import { fnum } from "../../../utils/macros"

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

const Stats = ({source, views}) => {
    const {falcor, falcorCache} = useFalcor();
    const { pgEnv } = React.useContext(DamaContext)
    const [activeView, setActiveView] = useState(views[0].view_id);
    const [compareView, setCompareView] = useState(views[0].view_id);
    const [compareMode, setCompareMode] = useState(undefined);

    useEffect(() => {
        falcor.get(
            ['dama', pgEnv, 'sources', 'byId', source.source_id, 'views', 'invalidate'],
            ['hlr', pgEnv, 'source', source.source_id, 'view', [activeView, compareView], 'eal']
        )
    }, [activeView, compareView, pgEnv, source.source_id, falcor])

    console.log('fc?', falcorCache)
    const metadataActiveView = get(falcorCache, ['hlr', pgEnv, 'source', source.source_id, 'view', activeView, 'eal', 'value'], []);
    const metadataCompareView = get(falcorCache, ['hlr', pgEnv, 'source', source.source_id, 'view', compareView, 'eal', 'value'], []);

    console.log('md', metadataCompareView)
    // if (!metadataActiveView || metadataActiveView.length === 0) return <div> Stats Not Available </div>

    return (
        <>
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
                        <div
                          className={'flex flex-row items-center py-4 sm:py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 text-lg font-md'}>
                            EAL by Type
                        </div>
                        <div>
                            <div className="py-4 sm:py-2 sm:grid sm:grid-cols-7 sm:gap-4 sm:px-6 border-b-2">
                                <dt className="text-sm font-medium text-gray-600">
                                    Event Type
                                </dt>
                                <dd className="text-sm font-medium text-gray-600 ">
                                    buildings {compareMode ? `(${views.find(v => v.view_id.toString() === activeView.toString()).version})` : null}
                                </dd>
                                <dd className="text-sm font-medium text-gray-600 ">
                                    crop {compareMode ? `(${views.find(v => v.view_id.toString() === activeView.toString()).version})` : null}
                                </dd>
                                <dd className="text-sm font-medium text-gray-600 ">
                                    population {compareMode ? `(${views.find(v => v.view_id.toString() === activeView.toString()).version})` : null}
                                </dd>


                                {
                                  compareMode &&
                                  <dd className="text-sm font-medium text-gray-600 ">
                                      buildings {`(${views.find(v => v.view_id.toString() === compareView.toString()).version})`}
                                  </dd>
                                }

                                {
                                  compareMode &&
                                  <dd className="text-sm font-medium text-gray-600 ">
                                      crop {`(${views.find(v => v.view_id.toString() === compareView.toString()).version})`}
                                  </dd>
                                }

                                {
                                  compareMode &&
                                  <dd className="text-sm font-medium text-gray-600 ">
                                      population {`(${views.find(v => v.view_id.toString() === compareView.toString()).version})`}
                                  </dd>
                                }
                            </div>
                            <div className="border-t border-gray-200 px-4 py-5 sm:p-0 overflow-auto h-[700px]">
                                <dl className="sm:divide-y sm:divide-gray-200">

                                    {
                                        metadataActiveView
                                          .map((col, i) => (
                                            <div key={i} className="py-4 sm:py-5 sm:grid sm:grid-cols-7 sm:gap-4 sm:px-6">
                                                <dt className="text-sm text-gray-900">
                                                    {col.nri_category}
                                                </dt>
                                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                                                    {fnum(col.swd_buildings)}
                                                </dd>
                                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                                                    {fnum(col.swd_crop)}
                                                </dd>
                                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                                                    {fnum(col.swd_population)}
                                                </dd>
                                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                                                    {
                                                      compareMode &&
                                                      fnum(get(metadataCompareView
                                                        .find(row => row.nri_category === col.nri_category), 'swd_buildings'))
                                                    }
                                                </dd>
                                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                                                    {
                                                      compareMode &&
                                                      fnum(get(metadataCompareView
                                                        .find(row => row.nri_category === col.nri_category), 'swd_crop'))
                                                    }
                                                </dd>
                                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                                                    {
                                                      compareMode &&
                                                      fnum(get(metadataCompareView
                                                        .find(row => row.nri_category === col.nri_category), 'swd_population'))
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
        </>
)
}

const NceiStormEventsConfig = {
    stats: {
        name: 'Stats',
        path: '/stats',
        component: Stats
    },
    map: {
        name: 'Map',
        path: '/map',
        component: () => <div> No Map </div>
    },
    sourceCreate: {
        name: 'Create',
        component: Create
    }

}

export default NceiStormEventsConfig

