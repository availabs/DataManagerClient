import React, { useEffect, useMemo } from 'react';
import { useFalcor } from 'modules/avl-components/src'
import { useSelector } from "react-redux";

import get from 'lodash.get'
// import { useParams } from 'react-router-dom'

import {SourceAttributes, ViewAttributes, getAttributes} from 'pages/DataManager/components/attributes'
import { selectPgEnv } from "pages/DataManager/store"


const Overview = ({source, views}) => {
  return React.useMemo(() => (
    <div className="overflow-hidden">
      <div className='flex flex-col'>
        <div className="flex-1">
          <div>
            {(get(source,'categories',[]) || []).map(cat => cat.map(s => <span className='text-xs p-1 px-2 bg-blue-200 text-blue-600 mr-2'>{s}</span>))}
          </div>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 py-2">
            {get(source,'description', false) || 'No Description'}
          </p>
        </div>
        <div className=" px-4 py-5 sm:p-0 w-40 border-l border-gray-300">
          <div className="py-4 sm:px-6">

            <div className="text-sm font-medium text-gray-500">Versions</div>
            <div className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <select className='w-full bg-white border border-gray-300 p-2'>
                {views.map(v => (
                  <option>{v.version}</option>

                ))}

              </select>

            </div>
          </div>
          {Object.keys(SourceAttributes)
            .filter(d => !['source_id','metadata','description','name','category', 'categories'].includes(d))
            .map((attr,i) => (
              <div className={`py-4 sm:py-5 sm:px-6`}>
                <div className="text-sm font-medium text-gray-500">{attr}</div>
                <div className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {typeof source[attr] === 'object'}
                  {typeof source[attr] === 'object' ? JSON.stringify(source[attr]) : source[attr]}

                </div>
              </div>
            ))}

        </div>
      </div>
      <div>
        <dl>

        </dl>
      </div>
    </div>
  ), [source, views])
}

const Metadata = ({source}) => {
  const metadata = React.useMemo(() =>  get(source,'metadata',[]), [source])
  return React.useMemo(() => (
    <div className="overflow-hidden">

      <div className="py-4 sm:py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-b-2">
        <dt className="text-sm font-medium text-gray-600">
          Column
        </dt>
        <dd className="text-sm font-medium text-gray-600 ">
          Description
        </dd>
        <dd className="text-sm font-medium text-gray-600">
          Type
        </dd>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">

          {metadata
            .map((col,i) => (
              <div key={i} className={`py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 ${i % 2 === 1 ? 'bg-gray-100' : ''}`}>
                <dt className="text-sm text-gray-900">
                  {col.name}
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                  {get(col,'desc', false) || 'No Description'}
                </dd>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                  <div className='text-gray-400 italic'>{col.type}</div>
                </dd>

              </div>
            ))}

        </dl>
      </div>
    </div>
  ), [metadata])
}



const Source = ({sourceId}) => {
  const {falcor,falcorCache} = useFalcor()
  const pgEnv = useSelector(selectPgEnv);

  useEffect( () => {
    const fetchData = async () => {
      const lengthPath = ["dama", pgEnv,"sources","byId",sourceId,"views","length"]
      const resp = await falcor.get(lengthPath);
      return await falcor.get(
        [
          "dama", pgEnv,"sources","byId",sourceId,"views","byIndex",
          {from:0, to:  get(resp.json, lengthPath, 0)-1},
          "attributes",Object.values(ViewAttributes)
        ],
        [
          "dama", pgEnv,"sources","byId",sourceId,
          "attributes",Object.values(SourceAttributes)
        ]
      )
    }
    fetchData()
  }, [falcor, sourceId, pgEnv])

  const views = useMemo(() => {
    return Object.values(get(falcorCache,["dama", pgEnv,"sources","byId",sourceId,"views","byIndex",],{}))
      .map(v => getAttributes(get(falcorCache,v.value,{'attributes': {}})['attributes']))
  },[falcorCache, sourceId, pgEnv])

  const source = useMemo(() => {
    return getAttributes(get(falcorCache,["dama", pgEnv,'sources','byId', sourceId],{'attributes': {}})['attributes'])
  },[falcorCache, sourceId, pgEnv])

  return (
    <div className='max-w-6xl mx-auto px-2'>
      <div className='w-full bg-white'>
        <Overview source={source} views={views} />
      </div>
      <div className='w-full p-4 bg-white'>
        <Metadata source={source} views={views} />
      </div>
    </div>
  )
}



const SourceInfoPanel = (props) => {
  const sourceId = React.useMemo(() =>
      get(props.layer, 'layer_id', -1),
    [props.layer]
  )

  return React.useMemo( () => (
    <div className='border-t border-gray-300 h-full bg-gray-100 w-full'>
      {sourceId === -1 ? <span /> : <Source sourceId={sourceId} />}
    </div>
  ), [sourceId])
}

export { SourceInfoPanel }