import React, { useEffect, useMemo, useState } from 'react';
import { useFalcor, /*SideNav,*/ Dropdown, withAuth } from 'modules/avl-components/src'
import { Link } from 'react-router-dom'
import { useSelector } from "react-redux";

import get from 'lodash.get'
import SourcesLayout, {DataManagerHeader}  from '../components/SourcesLayout'
import { useParams } from 'react-router-dom'


import { selectPgEnv } from "pages/DataManager/store"

import {SourceAttributes, ViewAttributes, getAttributes} from '../components/attributes'



const SourceThumb = ({source}) => {
  const {falcor} = useFalcor()
  const pgEnv = useSelector(selectPgEnv);
  
  useEffect(() => {
    async function fetchData () {
      const lengthPath = ["dama", pgEnv,"sources","byId",source.source_id,"views","length"]
      const resp = await falcor.get(lengthPath);
      return await falcor.get([
        "dama", pgEnv,"sources","byId",
        source.source_id, "views","byIndex",
        {from:0, to:  get(resp.json, lengthPath, 0)-1},
        "attributes", Object.values(ViewAttributes)
      ])
    }
    fetchData()
  }, [falcor, source.source_id, pgEnv])


  return (
    <div className='w-full p-4 bg-white my-1 hover:bg-blue-50 block border shadow'>
      <Link to={`/datasources/source/${source.source_id}`}  className='text-xl font-medium w-full block'>
        <span>{source.display_name || source.name }</span>
      </Link>
      <div>
          {(get(source,'categories',[]) || [])
            .map(cat => cat.map((s,i) => (
              <Link key={i} to={`/datasources/cat/${i > 0 ? cat[i-1] + '/' : ''}${s}`} className='text-xs p-1 px-2 bg-blue-200 text-blue-600 mr-2'>{s}</Link>
          )))
          }
      </div>
      <Link to={`/datasources/source/${source.source_id}`} className='py-2 block'>
        {source.description}
      </Link>
    </div>
  )
}


const SourcesList = (props) => {
  const {falcor,falcorCache} = useFalcor()
  const [layerSearch, setLayerSearch] = useState('')
  const { cat1, cat2 } = useParams()
  
  const pgEnv = useSelector(selectPgEnv);
  
  useEffect(() => {
      async function fetchData () {
        const lengthPath = ["dama", pgEnv, "sources", "length"];
        const resp = await falcor.get(lengthPath);
        return await falcor.get([
          "dama", pgEnv,"sources","byIndex",
          {from:0, to:  get(resp.json, lengthPath, 0)-1},
          "attributes",Object.values(SourceAttributes),
        ])
      }
      return fetchData()
  }, [falcor, pgEnv])

  const sources = useMemo(() => {
      return Object.values(get(falcorCache,["dama", pgEnv,'sources','byIndex'],{}))
        .map(v => getAttributes(get(falcorCache,v.value,{'attributes': {}})['attributes']))
  },[falcorCache, pgEnv])

  
  /*let menuItems =  useMemo(() => { 
    let menu =  Object.values(sources
        .filter(d => get(d,`categories`,[]).map(d => d[0]).includes(current_site))
        .filter(d => { 
          return !layerSearch || d.name.split('/').pop().split('_').join(' ').toLowerCase().includes(layerSearch.toLowerCase()) 
        })
      .reduce((a,b) => {/
        b.categories.forEach(cat => {
          if(cat[0] === current_site){
            if(!a[cat[1]]){
              a[cat[1]] = {
                name: <div className='font-bold'>{cat[1]}</div>,
                subMenus: []
              }
            }
            a[cat[1]].subMenus.push({
              className: ' ',
              name: (
                <div className={`flex p-2 hover:bg-blue-100 border-r-4 ${b.id === +sourceId ? 'border-blue-600 text-blue-600' : 'border-neutral-100'}`}>
                  <Link 
                    to={`/datasources/source/${b.id}`} 
                    className='flex-1 pl-6 cursor-pointer text-sm'>
                      {b.name.split('/').pop().split('_').join(' ')}
                  </Link>
                </div>
              ),
              
            })
          }
        })
        return a
      },{}))
      console.log('cacl menu', menu)
      return menu
    },[sources,sourceId,layerSearch,current_site])*/


  return (
        <SourcesLayout>
          <div className='py-4'>
            <div>
              <input 
                className='w-full text-lg p-2 border border-gray-300 ' 
                placeholder='Search datasources'
                value={layerSearch}
                onChange={(e) => setLayerSearch(e.target.value)}
              />
            </div>
          </div>
          {
              sources
              .filter(source => {
                let output = true
                if(cat1) {
                  output = false;
                  (get(source,'categories',[]) || [])
                    .forEach(site => {
                      if(site[0] === cat1 && (!cat2 || site[1] === cat2)){
                        output = true
                      } 
                    })
                }
                return output
              })
              .filter(source => {
                let searchTerm = (source.display_name + ' ' + get(source, 'categories[0]',[]).join(' '))
                return !layerSearch.length > 2 || searchTerm.toLowerCase().includes(layerSearch.toLowerCase())
              })
              .map((s,i) => <SourceThumb key={i} source={s} />)
          }
        </SourcesLayout>
     
  )
}



export default SourcesList
