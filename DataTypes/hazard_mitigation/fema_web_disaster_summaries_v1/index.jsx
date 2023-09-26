import React, {useEffect, useState} from 'react';
import Create from './create'
import {useFalcor} from "~/modules/avl-components/src";
import get from "lodash/get";

import { DamaContext } from "../../../store";

const Table = ({source}) => {
  return <div> Table View </div>  
}


const RenderNumRowsByMonth = ({metadataActiveView, metadataCompareView, activeView, compareView, compareMode, views}) => {
  console.log('comes here', get(metadataActiveView, ['countbymonth', 'value'], []), metadataActiveView)
  return (
  <>
    <div
      className={'flex flex-row items-center py-4 sm:py-2 sm:grid sm:grid-cols-3 sm:gap-2 sm:px-6 text-lg font-md'}>
      Number of Disaster by Month
    </div>

    <div>
      <div>
        <div className="py-4 sm:py-2 sm:grid sm:grid-cols-11 sm:gap-1 sm:px-6 border-b-2">
          <dt className="text-sm font-medium text-gray-600">
            Month
          </dt>
          <dd className="text-sm font-medium text-gray-600 ">
          volcaniceruption 
          </dd>
          <dd className="text-sm font-medium text-gray-600 ">
            Flood
          </dd>
         
          <dd className="text-sm font-medium text-gray-600 ">
          Earthquake
          </dd>
          <dd className="text-sm font-medium text-gray-600 ">
          severeicestorm
          </dd>
         
          <dd className="text-sm font-medium text-gray-600 ">
          Freezing
          </dd>
          <dd className="text-sm font-medium text-gray-600 ">
          Drought
          </dd>
          <dd className="text-sm font-medium text-gray-600 ">
          Tsunami
          </dd>
          <dd className="text-sm font-medium text-gray-600 ">
          Fire
          </dd>
          <dd className="text-sm font-medium text-gray-600 ">
          Typhoon
          </dd>
          <dd className="text-sm font-medium text-gray-600 ">
          Damleveebreak
          </dd>
         
         
          
          
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0 overflow-auto h-[700px]">
          <dl className="sm:divide-y sm:divide-gray-200">

            {
              get(metadataActiveView, ['countbymonth', 'value'], [])
                .map((col, i) => (
                  <div key={i} className="py-4 sm:py-5 sm:grid sm:grid-cols-11 sm:gap-1 sm:px-6">
                    <dt className="text-sm text-gray-900">
                      {col.month}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                      {col.volcaniceruption}
                    </dd>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                      {col.flood}
                    </dd>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                  {col.earthquake}
                </dd>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                {col.severeicestorm}
                </dd>
             
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
               {col.freezing}
              </dd>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
              {col.drought}
              </dd>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
              {col.tsunami}
            </dd>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
              {col.fire}
            </dd>

              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                      {col.typhoon}
                    </dd>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
              {col.damleveebreak}
            </dd>
           
            
                   
                   

                  </div>
                ))}

          </dl>
        </div>
      </div>
    </div>
  </>
)}


const RenderNumRowsByYear = ({metadataActiveView, metadataCompareView, activeView, compareView, compareMode, views}) => {
  console.log('comes here', get(metadataActiveView, ['ddCount', 'value'], []), metadataActiveView)
  return (
  <>
    <div
      className={'flex flex-row items-center py-4 sm:py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 text-lg font-md'}>
      Number of Disaster by Year
    </div>

    <div>
      <div>
        <div className="py-4 sm:py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-b-2">
          <dt className="text-sm font-medium text-gray-600">
            Year
          </dt>
          <dd className="text-sm font-medium text-gray-600 ">
            Disaster Count {compareMode ? `(${views.find(v => v.view_id.toString() === activeView.toString()).version})` : null}
          </dd>

          {
            compareMode ? (
              <dd className="text-sm font-medium text-gray-600 ">
              Disaster Count {`(${views.find(v => v.view_id.toString() === compareView.toString()).version})`}
              </dd>
            ) : null
          }
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0 overflow-auto h-[700px]">
          <dl className="sm:divide-y sm:divide-gray-200">

            {
              get(metadataActiveView, ['count', 'value'], [])
                .map((col, i) => (
                  <div key={i} className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm text-gray-900">
                      {col.fy_declared}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                      {col.disaster_number}
                    </dd>

                    
                  </div>
                ))}

          </dl>
        </div>
      </div>
    </div>
  </>
)}


const Stats = ({source, views}) => {
  const {falcor, falcorCache} = useFalcor();
  const { pgEnv } = React.useContext(DamaContext)
  const [activeView, setActiveView] = useState(views[0].view_id);
  const [compareView, setCompareView] = useState(views[0].view_id);
  const [compareMode, setCompareMode] = useState(undefined);

  useEffect(() => {
      falcor.get(
          ['dama', pgEnv, 'sources', 'byId', source.source_id, 'views', 'invalidate'],
          ['disaster_declaration_summary', pgEnv, 'source', source.source_id, 'view',
           [activeView, compareView], 
           ['count', 'countbymonth']]
      )
  }, [activeView, compareView, pgEnv, source.source_id, falcor])

  console.log('fc?', falcorCache)
  const metadataActiveView = get(falcorCache, ['disaster_declaration_summary', pgEnv, 'source', source.source_id, 'view', activeView]);
  const metadataCompareView = get(falcorCache, ['disaster_declaration_summary', pgEnv, 'source', source.source_id, 'view', compareView]);


  console.log('md', metadataActiveView)
  if (!metadataActiveView || metadataActiveView.length === 0) return <div> Stats Not Available </div>

  return (
      <>
      {
        !metadataActiveView || metadataActiveView.length === 0 ? <div> Stats Not Available </div> :
          <>
           
          <RenderNumRowsByYear metadataActiveView={metadataActiveView} metadataCompareView={metadataCompareView}
          activeView={activeView} compareView={compareView} compareMode={compareMode} views={views} />
            <RenderNumRowsByMonth metadataActiveView={metadataActiveView} metadataCompareView={metadataCompareView}
                                 activeView={activeView} compareView={compareView} compareMode={compareMode} views={views} />
            
          </>
      }
      </>
)
}


const FreightAtlashShapefileConfig = {
  map: {
    name: 'Map',
    path: '/map',
    component: () => <div> No Map </div>
  },
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

export default FreightAtlashShapefileConfig

