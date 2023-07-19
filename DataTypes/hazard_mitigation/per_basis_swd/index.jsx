import React, {useEffect, useState} from 'react';
import Create from './create'
import {useFalcor} from "~/modules/avl-components/src";
import get from "lodash/get";

import { DamaContext } from "../../../store";
import { fnum } from "../../../utils/macros";

const Table = ({source}) => {
  return <div> Table View </div>  
}

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

const Stats = ({source, views}) => {
    const {falcor, falcorCache} = useFalcor();
    const { pgEnv } = React.useContext(DamaContext)
    const [activeView, setActiveView] = useState(views[0].view_id);
    const [compareView, setCompareView] = useState(views[0].view_id);
    const [compareMode, setCompareMode] = useState(undefined);

    useEffect(() => {
        falcor.get(
            ['per_basis', pgEnv, 'source', source.source_id, 'view', [activeView, compareView], 'stats']
        )
    }, [activeView, compareView, pgEnv, source.source_id, falcor])


    const metadataActiveView = get(falcorCache, ['per_basis', pgEnv, 'source', source.source_id, 'view', activeView, 'stats', 'value'], [])
        .sort((a, b) => a.nri_category.localeCompare(b.nri_category));
    const metadataCompareView = get(falcorCache, ['per_basis', pgEnv, 'source', source.source_id, 'view', compareView, 'stats', 'value'], []);

    console.log('??', compareMode)
    if (!metadataActiveView || metadataActiveView.length === 0) return <div> Stats Not Available </div>

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
                !metadataActiveView || metadataActiveView.length === 0 ? <div> Stats Not Available </div> :
                <>
                <div className={'flex flex-row items-center py-4 sm:py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 text-lg font-md'}>
                    By Type
                </div>
                <div>
                    <div className="py-4 sm:py-2 sm:grid sm:grid-cols-8 sm:gap-4 sm:px-6 border-b-2">
                        <dt className="text-sm font-medium text-gray-600">
                            Event Type
                        </dt>
                        <dd className="text-sm font-medium text-gray-600 ">
                            Zero loss events {compareMode ? `(${views.find(v => v.view_id.toString() === activeView.toString()).version})` : null}
                        </dd>
                        <dd className="text-sm font-medium text-gray-600 ">
                            Loss causing events {compareMode ? `(${views.find(v => v.view_id.toString() === activeView.toString()).version})` : null}
                        </dd>
                        <dd className="text-sm font-medium text-gray-600 ">
                            Total events {compareMode ? `(${views.find(v => v.view_id.toString() === activeView.toString()).version})` : null}
                        </dd>

                        <dd className="text-sm font-medium text-gray-600 ">
                            Buildings {compareMode ? `(${views.find(v => v.view_id.toString() === activeView.toString()).version})` : null}
                        </dd>
                        <dd className="text-sm font-medium text-gray-600 ">
                            Crop {compareMode ? `(${views.find(v => v.view_id.toString() === activeView.toString()).version})` : null}
                        </dd>
                        <dd className="text-sm font-medium text-gray-600 ">
                            Population {compareMode ? `(${views.find(v => v.view_id.toString() === activeView.toString()).version})` : null}
                        </dd>
                        <dd className="text-sm font-medium text-gray-600 ">
                            Total {compareMode ? `(${views.find(v => v.view_id.toString() === activeView.toString()).version})` : null}
                        </dd>


                        {
                            compareMode &&
                            <dd className="text-sm font-medium text-gray-600 ">
                                Zero loss events {`(${views.find(v => v.view_id.toString() === compareView.toString()).version})`}
                            </dd>
                        }

                        {
                            compareMode &&
                            <dd className="text-sm font-medium text-gray-600 ">
                                Loss causing events {`(${views.find(v => v.view_id.toString() === compareView.toString()).version})`}
                            </dd>
                        }

                        {
                            compareMode &&
                            <dd className="text-sm font-medium text-gray-600 ">
                                Total events {`(${views.find(v => v.view_id.toString() === compareView.toString()).version})`}
                            </dd>
                        }
                        {
                            compareMode &&
                            <dd className="text-sm font-medium text-gray-600 ">
                                Buildings {`(${views.find(v => v.view_id.toString() === compareView.toString()).version})`}
                            </dd>
                        }

                        {
                            compareMode &&
                            <dd className="text-sm font-medium text-gray-600 ">
                                Crop {`(${views.find(v => v.view_id.toString() === compareView.toString()).version})`}
                            </dd>
                        }

                        {
                            compareMode &&
                            <dd className="text-sm font-medium text-gray-600 ">
                                Population {`(${views.find(v => v.view_id.toString() === compareView.toString()).version})`}
                            </dd>
                        }
                        {
                            compareMode &&
                            <dd className="text-sm font-medium text-gray-600 ">
                                Total {`(${views.find(v => v.view_id.toString() === compareView.toString()).version})`}
                            </dd>
                        }
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:p-0 overflow-auto h-[700px]">
                        <dl className="sm:divide-y sm:divide-gray-200">

                            {
                                metadataActiveView
                                    .map((col, i) => (
                                        <div key={i} className="py-4 sm:py-5 sm:grid sm:grid-cols-8 sm:gap-4 sm:px-6">
                                            <dt className="text-sm text-gray-900">
                                                {col.nri_category}
                                            </dt>
                                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                                                {fnum(col.num_events_zero_loss)}
                                            </dd>
                                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                                                {fnum(col.num_events_with_loss)}
                                            </dd>
                                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                                                {fnum(col.num_events_total)}
                                            </dd>

                                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                                                {fnum(col.damage_buildings)}
                                            </dd>
                                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                                                {fnum(col.damage_crop)}
                                            </dd>
                                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                                                {fnum(col.damage_population)}
                                            </dd>
                                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                                                {fnum(col.damage_total)}
                                            </dd>
                                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                                                {
                                                    compareMode &&
                                                    fnum(get(metadataCompareView
                                                        .find(row => row.nri_category === col.nri_category), 'num_events_zero_loss'))
                                                }
                                            </dd>
                                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                                                {
                                                    compareMode &&
                                                    fnum(get(metadataCompareView
                                                        .find(row => row.nri_category === col.nri_category), 'num_events_with_loss'))
                                                }
                                            </dd>
                                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                                                {
                                                    compareMode &&
                                                    fnum(get(metadataCompareView
                                                        .find(row => row.nri_category === col.nri_category), 'num_events_total'))
                                                }
                                            </dd>

                                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                                                {
                                                    compareMode &&
                                                    fnum(get(metadataCompareView
                                                        .find(row => row.nri_category === col.nri_category), 'damage_buildings'))
                                                }
                                            </dd>
                                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                                                {
                                                    compareMode &&
                                                    fnum(get(metadataCompareView
                                                        .find(row => row.nri_category === col.nri_category), 'damage_crop'))
                                                }
                                            </dd>
                                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                                                {
                                                    compareMode &&
                                                    fnum(get(metadataCompareView
                                                        .find(row => row.nri_category === col.nri_category), 'damage_population'))
                                                }
                                            </dd>
                                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                                                {
                                                    compareMode &&
                                                    fnum(get(metadataCompareView
                                                        .find(row => row.nri_category === col.nri_category), 'damage_total'))
                                                }
                                            </dd>
                                        </div>
                                    ))
                            }

                        </dl>
                    </div>
                </div>
                </>
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
  table: {
    name: 'Table',
    path: '/table',
    component: Table
  },
  sourceCreate: {
    name: 'Create',
    component: Create
  }

}

export default NceiStormEventsConfig
