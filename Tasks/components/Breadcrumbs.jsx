
import React, { useEffect, useMemo } from 'react';

import { DamaContext } from '../../store'

import { ETL_CONTEXT_ATTRS } from '../index'
import { Link, useParams } from 'react-router-dom'
import get from 'lodash/get'

export const getAttributes = (data) => {
  return Object.entries(data || {})
    .reduce((out,attr) => {
      const [k,v] = attr
      typeof v.value !== 'undefined' ? 
        out[k] = v.value : 
        out[k] = v
      return out 
    },{})
}

export const Breadcrumbs =  ({fullWidth}) => {
  const { etl_context_id, page, cat1, cat2} = useParams()
  const { pgEnv, baseUrl, falcor , falcorCache } = React.useContext(DamaContext)

  useEffect(() => {
    async function fetchData() {
      return etl_context_id
        ? await falcor
            .get([
              "dama",
              pgEnv,
              "etlContexts",
              "byEtlContextId",
              etl_context_id,
              "attributes",
              ETL_CONTEXT_ATTRS,
            ])
            .then((data) => {             
              const etlAttr = getAttributes(get(falcorCache,["dama", pgEnv,'etlContexts','byEtlContextId', etl_context_id],{'attributes': {}})['value']) 

              return falcor.get([
                "dama",
                pgEnv,
                "sources",
                "byId",
                [etlAttr?.meta?.source_id],
                "attributes",
                "name",
              ]);
            })
        : Promise.resolve({});
    }
    fetchData();
  }, [falcor, etl_context_id, pgEnv]);

  const pages = useMemo(() => {
    const attr = getAttributes(get(falcorCache,["dama", pgEnv,'etlContexts','byEtlContextId', etl_context_id],{'attributes': {}})['value']) 
    const etlContexts = get(falcorCache, ["dama", pgEnv, "latest", "events"]);

    let contextName = get(falcorCache, [
      "dama",
      pgEnv,
      "sources",
      "byId",
      [attr?.meta?.source_id],
      "attributes",
      "name",
    ]);

    if(etlContexts){
      const currentEtlContext = Object.values(etlContexts).find(etlContext => etlContext.etl_context_id === parseInt(etl_context_id));
      if(currentEtlContext.type){
        contextName += " " + currentEtlContext.type.split(":")[0];
      }
    }

    const pageArray = [];
    pageArray.push({name:contextName})
    return pageArray
  },[falcorCache,etl_context_id,pgEnv, cat1, cat2, baseUrl])

  return (
    <nav className="border-b border-gray-200 flex " aria-label="Breadcrumb">
      <ol className={`${fullWidth ? `w-full` : `max-w-screen-xl w-full mx-auto`}  px-4 flex space-x-4 sm:px-6 lg:px-8`}>
        <li className="flex">
          <div className="flex items-center">
            <Link to={`${baseUrl || '/tasks'}`} className={"hover:text-[#bbd4cb] text-[#679d89]"}>
              <i className="fad fa-database flex-shrink-0 h-5 w-5" aria-hidden="true" />
              <span className="sr-only">Data Sources</span>
            </Link>
          </div>
        </li>
        {pages.map((page,i) => (
          <li key={i} className="flex">
            <div className="flex items-center">
              <svg
                className="flex-shrink-0 w-6 h-full text-gray-300"
                viewBox="0 0 30 44"
                preserveAspectRatio="none"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M.293 0l22 22-22 22h1.414l22-22-22-22H.293z" />
              </svg>
              {page.href ? 
                <Link
                  to={page.href}
                  className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                  aria-current={page.current ? 'page' : undefined}
                >
                  {page.name}
                </Link> :
                <div
                  className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                  aria-current={page.current ? 'page' : undefined}
                >
                  {page.name}
                </div> 
              }
            </div>
          </li>
        ))}
      </ol>
    </nav>
  )
}
