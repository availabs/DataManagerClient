import React, {useState, useEffect} from 'react';
import Create from './create';
import {useFalcor} from "~/modules/avl-components/src";
import get from "lodash/get";

import { DamaContext } from "../../../store";
import AddVersion from "../../default/AddVersion";

const fnum = (d) => {
  if (!d) return d;
  if (d >= 1000000000) {
    return `${(d / 1000000000).toFixed(3)} B`
  } else if (d >= 1000000) {
    return `${(d / 1000000).toFixed(3)} M`
  } else if (d >= 1000) {
    return `${(d / 1000).toFixed(3)} K`
  } else {
    return `${(d).toFixed(3)}`
  }
}

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

const RenderTotalRows = ({metadataActiveView, metadataCompareView, activeView, compareView, compareMode, views}) => (
  <div className="overflow-hidden">
    <div className={'flex flex-row items-center py-4 sm:py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'}>
      <dt className="text-gray-600">
        Total Number of Rows
      </dt>
      <dt className="text-sm text-gray-900">
        {get(metadataActiveView, ['numRows', 'value'])}
        {` (${views.find(v => v.view_id.toString() === activeView.toString()).version})`}
      </dt>

      {
        compareMode ? (
          <dt className="text-sm text-gray-900">
            {get(metadataCompareView, ['numRows', 'value'])}
            {` (${views.find(v => v.view_id.toString() === compareView.toString()).version})`}
          </dt>
        ) : null
      }

    </div>
  </div>
)

const RenderNumRowsByYear = ({metadataActiveView, metadataCompareView, activeView, compareView, compareMode, views}) => (
  <>
    <div
      className={'flex flex-row items-center py-4 sm:py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 text-lg font-md'}>
      Number of Rows/Events by Year
    </div>

    <div>
      <div>
        <div className="py-4 sm:py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-b-2">
          <dt className="text-sm font-medium text-gray-600">
            Year
          </dt>
          <dd className="text-sm font-medium text-gray-600 ">
            Count {compareMode ? `(${views.find(v => v.view_id.toString() === activeView.toString()).version})` : null}
          </dd>

          {
            compareMode ? (
              <dd className="text-sm font-medium text-gray-600 ">
                Count {`(${views.find(v => v.view_id.toString() === compareView.toString()).version})`}
              </dd>
            ) : null
          }
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0 overflow-auto h-[700px]">
          <dl className="sm:divide-y sm:divide-gray-200">

            {
              get(metadataActiveView, ['eventsByYear', 'value'], [])
                .map((col, i) => (
                  <div key={i} className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm text-gray-900">
                      {col.year}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                      {col.num_events}
                    </dd>

                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                      {
                        compareMode ?
                          get(get(metadataCompareView, ['eventsByYear', 'value'], [])
                            .find(row => row.year === col.year), 'num_events') : null
                      }
                    </dd>
                  </div>
                ))}

          </dl>
        </div>
      </div>
    </div>
  </>
)

const RenderNumRowsByType = ({metadataActiveView, metadataCompareView, activeView, compareView, compareMode, views}) => (
  <>
    <div
      className={'flex flex-row items-center py-4 sm:py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 text-lg font-md'}>
      Number of Rows/Events by Type
    </div>
    <div>
      <div className="py-4 sm:py-2 sm:grid sm:grid-cols-7 sm:gap-4 sm:px-6 border-b-2">
        <dt className="text-sm font-medium text-gray-600">
          Event Type
        </dt>
        <dd className="text-sm font-medium text-gray-600 ">
          total events {compareMode ? `(${views.find(v => v.view_id.toString() === activeView.toString()).version})` : null}
        </dd>
        <dd className="text-sm font-medium text-gray-600 ">
          loss events {compareMode ? `(${views.find(v => v.view_id.toString() === activeView.toString()).version})` : null}
        </dd>
        <dd className="text-sm font-medium text-gray-600 ">
          EAL buildings {compareMode ? `(${views.find(v => v.view_id.toString() === activeView.toString()).version})` : null}
        </dd>
        <dd className="text-sm font-medium text-gray-600 ">
          EAL crop {compareMode ? `(${views.find(v => v.view_id.toString() === activeView.toString()).version})` : null}
        </dd>
        <dd className="text-sm font-medium text-gray-600 ">
          EAL person {compareMode ? `(${views.find(v => v.view_id.toString() === activeView.toString()).version})` : null}
        </dd>
        <dd className="text-sm font-medium text-gray-600 ">
          EAL Total {compareMode ? `(${views.find(v => v.view_id.toString() === activeView.toString()).version})` : null}
        </dd>

        {/*{*/}
        {/*  compareMode ? (*/}
        {/*    <dd className="text-sm font-medium text-gray-600 ">*/}
        {/*      Count {`(${views.find(v => v.view_id.toString() === compareView.toString()).version})`}*/}
        {/*    </dd>*/}
        {/*  ) : null*/}
        {/*}*/}
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0 overflow-auto h-[700px]">
        <dl className="sm:divide-y sm:divide-gray-200">

          {
            get(metadataActiveView, ['eventsByType', 'value'], [])
              .map((col, i) => (
                <div key={i} className="py-4 sm:py-5 sm:grid sm:grid-cols-7 sm:gap-4 sm:px-6">
                  <dt className="text-sm text-gray-900">
                    {col.event_type}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                    {col.total_events}
                  </dd>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                    {col.loss_events}
                  </dd>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                    {fnum(col.annual_property_damage)}
                  </dd>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                    {fnum(col.annual_crop_damage)}
                  </dd>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                    {fnum(col.annual_person_damage)}
                  </dd>
                  {/*<dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">*/}
                  {/*  {fnum(col.property_damage + col.crop_damage + col.person_damage)}*/}
                  {/*</dd>*/}
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                    {fnum(col.annual_property_damage + col.annual_crop_damage + col.annual_person_damage)}
                  </dd>
                  {/*<dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">*/}
                  {/*  {*/}
                  {/*    compareMode ?*/}
                  {/*      get(get(metadataCompareView, ['eventsByType', 'value'], [])*/}
                  {/*        .find(row => row.event_type === col.event_type), 'num_events') : null*/}
                  {/*  }*/}
                  {/*</dd>*/}
                </div>
              ))}

        </dl>
      </div>
    </div>
  </>
)

const RenderTypeMapping = ({metadataActiveView, metadataCompareView, activeView, compareView, compareMode, views}) => (
  <>
    <div
      className={'flex flex-row items-center py-4 sm:py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 text-lg font-md'}>
      Event Type Mapping
    </div>
    <div>
      <div className={`py-4 sm:py-2 sm:grid sm:grid-cols-${compareMode ? `7` : `2`} sm:gap-4 sm:px-6 border-b-2`}>
        <dt className="text-sm font-medium text-gray-600">
          NRI Category
        </dt>
        <dd className="text-sm font-medium text-gray-600 ">
          Event Types {compareMode ? `(${views.find(v => v.view_id.toString() === activeView.toString()).version})` : null}
        </dd>
        {/*<dd className="text-sm font-medium text-gray-600 ">*/}
        {/*  Count {compareMode ? `(${views.find(v => v.view_id.toString() === activeView.toString()).version})` : null}*/}
        {/*</dd>*/}

        {
          compareMode ? (
            <>
              <dd className="text-sm font-medium text-gray-600 ">
                Event Types {`(${views.find(v => v.view_id.toString() === compareView.toString()).version})`}
              </dd>
              {/*<dd className="text-sm font-medium text-gray-600 ">*/}
              {/*  Count {`(${views.find(v => v.view_id.toString() === compareView.toString()).version})`}*/}
              {/*</dd>*/}
            </>
          ) : null
        }
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0 overflow-auto h-[700px]">
        <dl className="sm:divide-y sm:divide-gray-200">

          {
            get(metadataActiveView, ['eventsMappingToNRICategories', 'value'], [])
              .map((col, i) => (
                <div key={i} className={`py-4 sm:py-5 sm:grid sm:grid-cols-${compareMode ? `7` : `2`} sm:gap-4 sm:px-6`}>
                  <dt className="text-sm text-gray-900">
                    {col.nri_category}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                    {(col.event_types || []).join(', ')}
                  </dd>
                  {/*<dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">*/}
                  {/*  {col.num_events}*/}
                  {/*</dd>*/}
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                    {
                      compareMode ?
                        (get(get(metadataCompareView, ['eventsMappingToNRICategories', 'value'], [])
                          .find(row => row.nri_category === col.nri_category), 'event_types') || []).join(', ') : null
                    }
                  </dd>
                  {/*<dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">*/}
                  {/*  {*/}
                  {/*    compareMode ?*/}
                  {/*      get(get(metadataCompareView, ['eventsMappingToNRICategories', 'value'], [])*/}
                  {/*        .find(row => row.nri_category === col.nri_category), 'num_events') : null*/}
                  {/*  }*/}
                  {/*</dd>*/}
                </div>
              ))}

        </dl>
      </div>
    </div>
  </>
)

const Stats = ({source, views}) => {
    const { pgEnv } = React.useContext(DamaContext)
    const {falcor, falcorCache} = useFalcor();
    const [activeView, setActiveView] = useState(views[0].view_id);
    const [compareView, setCompareView] = useState(views[0].view_id);
    const [compareMode, setCompareMode] = useState(undefined);

    useEffect(() => {
        falcor.get(
            ['dama', pgEnv, 'sources', 'byId', source.source_id, 'views', 'invalidate'],
            ['ncei_storm_events_enhanced', pgEnv, 'source', source.source_id, 'view',
              [activeView, compareView],
              ['numRows', 'eventsByYear', 'eventsByType', 'eventsMappingToNRICategories']]
        )
    }, [activeView, compareView, pgEnv, source.source_id, falcor])
    console.log('fc', falcorCache)
    const metadataActiveView = get(falcorCache, ['ncei_storm_events_enhanced', pgEnv, 'source', source.source_id, 'view', activeView]);
    const metadataCompareView = get(falcorCache, ['ncei_storm_events_enhanced', pgEnv, 'source', source.source_id, 'view', compareView]);

    // const eventsByYear = get(metadataActiveView, ['eventsByYear', 'value'], [])

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
                
                <RenderTotalRows metadataActiveView={metadataActiveView} metadataCompareView={metadataCompareView}
                                 activeView={activeView} compareView={compareView} compareMode={compareMode} views={views} />

                <RenderTypeMapping metadataActiveView={metadataActiveView} metadataCompareView={metadataCompareView}
                                     activeView={activeView} compareView={compareView} compareMode={compareMode} views={views} />

                <RenderNumRowsByType metadataActiveView={metadataActiveView} metadataCompareView={metadataCompareView}
                                     activeView={activeView} compareView={compareView} compareMode={compareMode} views={views} />

                <RenderNumRowsByYear metadataActiveView={metadataActiveView} metadataCompareView={metadataCompareView}
                                     activeView={activeView} compareView={compareView} compareMode={compareMode} views={views} />

              </>
          }
        </>
    )
}
const Table = ({source}) => {
    return <div> Table View </div>
}

const NceiStormEventsConfig = {
    add_version: {
      name: "Add Version",
      path: "/add_version",
      component: AddVersion
    },
    stats: {
        name: "Stats",
        path: "/stats",
        component: Stats,
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
