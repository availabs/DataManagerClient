import React, {useMemo, useEffect} from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSelector } from "react-redux";

import { useFalcor } from 'modules/avl-components/src'
import get from 'lodash.get'

import { getAttributes } from './attributes'
import { selectPgEnv } from "pages/DataManager/store"


export default function BreadCrumbs () {
  const { sourceId, cat1, cat2} = useParams()
  const {falcor,falcorCache} = useFalcor()
  const pgEnv = useSelector(selectPgEnv);

  useEffect(() => { 
    async function fetchData () {
      return sourceId ? await falcor.get(
        [
          "dama", pgEnv,"sources","byId",sourceId,
          "attributes",["categories","name"]
        ]
      ) : Promise.resolve({})
    }
    fetchData()
  }, [falcor, sourceId, pgEnv])

  const pages = useMemo(() => {
    let attr = getAttributes(get(falcorCache,["dama", pgEnv,'sources','byId', sourceId],{'attributes': {}})['attributes']) 
    /*if(!get(attr, 'categories[0]', false)) { 
      return [{name:'',to:''}]
    }*/

    let catList = get(attr ,'categories[0]', false) || [cat1,cat2].filter(d => d)

    // console.log('BreadCrumbs', catList, cat1, cat2, get(attr ,'categories[0]', false))

    let cats = typeof catList !== 'object' ? [] 
      : catList.map((d,i) => {
        return {
          name: d,
          href: `/datasources/cat/${i > 0 ? catList[i-1] + '/' : ''}${d}`        }
      })
    cats.push({name:attr.display_name})
    return cats

  },[falcorCache,sourceId,pgEnv, cat1, cat2])

  return (
    <nav className="border-b border-gray-200 flex " aria-label="Breadcrumb">
      <ol className="max-w-screen-xl w-full mx-auto px-4 flex space-x-4 sm:px-6 lg:px-8">
        <li className="flex">
          <div className="flex items-center">
            <Link to='/datasources' className="text-blue-400 hover:text-blue-500">
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
