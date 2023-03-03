import React, { useEffect, useMemo, useState } from 'react';
import { useFalcor,TopNav, withAuth /*, Input, Button*/ } from 'modules/avl-components/src'


import get from 'lodash.get'
import { useParams } from 'react-router-dom'
import {Pages, DataTypes} from '../DataTypes'

import SourcesLayout, { DataManagerHeader } from '../components/SourcesLayout'

import {SourceAttributes, ViewAttributes, getAttributes} from 'pages/DataManager/components/attributes'
import { useSelector } from "react-redux";
import { selectPgEnv } from "pages/DataManager/store"

const Source = (props) => {
  const {falcor, falcorCache} = useFalcor()
  const { sourceId, page } = useParams()
  const [ pages, setPages] = useState(Pages)
  const pgEnv = useSelector(selectPgEnv);

  const Page = useMemo(() => {
    return page ? get(pages,`[${page}].component`,Pages['overview'].component)  : Pages['overview'].component
  },[page,pages])

  useEffect(() => {
    async function fetchData () {
      console.time('fetch data')
      const lengthPath = ["dama", pgEnv, "sources","byId",sourceId,"views","length"]
      const resp = await falcor.get(lengthPath);
      let data =  await falcor.get(
        [
          "dama", pgEnv, "sources","byId",sourceId,"views","byIndex",
          {from:0, to:  get(resp.json, lengthPath, 0)-1},
          "attributes",Object.values(ViewAttributes)
        ],
        [
          "dama", pgEnv, "sources","byId",sourceId,
          "attributes",Object.values(SourceAttributes)
        ]
      )
      console.timeEnd('fetch data')
      //console.log(data)
      return data
    }
    fetchData()
  }, [sourceId, falcor, pgEnv])

  const views = useMemo(() => {
    return Object.values(get(falcorCache,["dama", pgEnv, "sources","byId",sourceId,"views","byIndex",],{}))
      .map(v => getAttributes(get(falcorCache,v.value,{'attributes': {}})['attributes']))
  },[falcorCache,sourceId,pgEnv])

  const source = useMemo(() => {
    let attributes =  getAttributes(get(falcorCache,["dama", pgEnv,'sources','byId', sourceId],{'attributes': {}})['attributes']) 
    if(DataTypes[attributes.type] ){

      // check for pages to add 
      let typePages = Object.keys(DataTypes[attributes.type]).reduce((a,c)=>{
        if(DataTypes[attributes.type][c].path) {
          a[c] = DataTypes[attributes.type][c]
        }
        return a
      },{})

      let allPages = {...Pages,...typePages}
      setPages(allPages)  
    } else {
       setPages(Pages) 
    }
    return attributes
  },[falcorCache, sourceId, pgEnv])

  return (
    <div className='max-w-6xl mx-auto'>
      <SourcesLayout>
        <div className='text-xl font-medium overflow-hidden p-2 border-b '>
          {source.display_name || source.name}
        </div>
        <TopNav 
          menuItems={Object.values(pages)
            .map(d => {
              return {
                name:d.name,
                path: `/datasources/source/${sourceId}${d.path}`
              }
            })}
          themeOptions={{size:'inline'}}
        />
        <div className='w-full p-4 bg-white shadow mb-4'>
          <Page source={source} views={views} user={props.user} />
        </div>
      </SourcesLayout>
    </div>
  )
}



const config = [{
  name:'View Source',
  path: "/datasources/source/:sourceId",
  exact: true,
  auth: false,
  mainNav: false,
  title: <DataManagerHeader />,
  sideNav: {
    color: 'dark',
    size: 'micro'
  },
  component: withAuth(Source)
},
{
  name:'View Source',
  path: "/datasources/source/:sourceId/:page",
  exact: true,
  auth: false,
  mainNav: false,
  title: <DataManagerHeader />,
  sideNav: {
    color: 'dark',
    size: 'micro'
  },
  component: withAuth(Source)
},{
  name:'View Source',
  path: "/datasources/source/:sourceId/view/:viewId",
  exact: true,
  auth: false,
  mainNav: false,
  title: <DataManagerHeader />,
  sideNav: {
    color: 'dark',
    size: 'micro'
  },
  component: withAuth(Source)
}
]

export default config;
