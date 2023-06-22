import React, { useEffect, useMemo, useState } from "react";
import {  TopNav, SideNav } from "~/modules/avl-components/src";


import get from "lodash/get";
import { useParams, Link } from "react-router-dom";
import { Pages, DataTypes } from "../DataTypes";

import SourcesLayout from "../components/SourcesLayout";

import { SourceAttributes, ViewAttributes, getAttributes } from "~/pages/DataManager/components/attributes";
import { DamaContext } from "~/pages/DataManager/store";


const Source = ({}) => {
  const { sourceId, page, viewId } = useParams()
  const [ pages, setPages] = useState(Pages)
  const [ activeViewId, setActiveViewId ] = useState(viewId)
  const { pgEnv, baseUrl, falcor, falcorCache, user } = React.useContext(DamaContext)


  const Page = useMemo(() => {
    return page
      ? get(pages, `[${page}].component`, pages["overview"].component)
      : pages["overview"].component;
  }, [page, pages]);

  useEffect(() => {
    async function fetchData() {
      //console.time("fetch data");
      const lengthPath = ["dama", pgEnv, "sources", "byId", sourceId, "views", "length"];
      const resp = await falcor.get(lengthPath);
      let data = await falcor.get(
        [
          "dama", pgEnv, "sources", "byId", sourceId, "views", "byIndex",
          { from: 0, to: get(resp.json, lengthPath, 0) - 1 },
          "attributes", Object.values(ViewAttributes)
        ],
        [
          "dama", pgEnv, "sources", "byId", sourceId,
          "attributes", Object.values(SourceAttributes)
        ],
        [
          "dama", pgEnv, "sources", "byId", sourceId, "meta"
        ]
      );
      //console.timeEnd("fetch data");
      //console.log(data)
      return data;
    }

    fetchData();
  }, [sourceId, falcor, pgEnv]);

  const views = useMemo(() => {
    return Object.values(get(falcorCache, ["dama", pgEnv, "sources", "byId", sourceId, "views", "byIndex"], {}))
      .map(v => getAttributes(get(falcorCache, v.value, { "attributes": {} })["attributes"]));
  }, [falcorCache, sourceId, pgEnv]);


  useEffect(() => {
    if(activeViewId && activeViewId !== viewId) {
      // if active view is set and we get new param 
      // update active view id
      setActiveViewId(viewId)
    }

    if(!activeViewId && views.length > 0) {
        let authViews = views.filter(v => v?.metadata?.authoritative).length > 0 ? 
          views.filter(v => v?.metadata?.authoritative) :
          views

        
        setActiveViewId(authViews.sort((a,b) => a._created_timestamp - b._created_timestamp)[0].view_id)

    }

  },[views, viewId]);

  const source = useMemo(() => {
    let attributes = getAttributes(get(falcorCache, ["dama", pgEnv, "sources", "byId", sourceId], { "attributes": {} })["attributes"]);
    if (DataTypes[attributes.type]) {

      // check for pages to add 
      let typePages = Object.keys(DataTypes[attributes.type]).reduce((a, c) => {
        if (DataTypes[attributes.type][c].path || c === 'overview') {
          a[c] = DataTypes[attributes.type][c];
        }
        return a;
      }, {});

      let allPages = { ...Pages, ...typePages };
      setPages(allPages);
    } else {
      setPages(Pages);
    }
    return attributes;
  }, [falcorCache, sourceId, pgEnv]);



  return (
    <div className="max-w-6xl mx-auto">
      <SourcesLayout baseUrl={baseUrl}>
        {/*<div className='flex w-full p-2 border-b items-center'>
          <div className="text-2xl text-gray-700 font-medium overflow-hidden ">
            {source.display_name || source.name}
          </div>
          <div className='flex-1'></div>
          <div className='py-2'>
            { user && user.authLevel >= 10 ? 
              <Link 
                className={"bg-red-100 border border-red-200 shadow hover:bg-red-400 hover:text-white p-2"}
                to={`${baseUrl}/delete/source/${source.source_id}/`}> 
                  <i className='fad fa-trash' />
              </Link> : ''
            }
          </div>
        </div>*/}
        <TopNav
          menuItems={Object.values(pages)
            .filter(d => {
              const authLevel = d?.authLevel || -1
              const userAuth = user.authLevel || -1
              return !d.hidden && (authLevel <= userAuth)
            }) 
            .map(d => {
              return {
                name:d.name,
                path: `${baseUrl}/source/${sourceId}${d.path}${activeViewId && d.path ? '/'+activeViewId : ''}`
              }

            })}
          themeOptions={{ size: "inline" }}
        />
        <div className='w-full p-4 bg-white shadow mb-4'>
          <Page 
            source={source} 
            views={views} 
            user={user}
            baseUrl={baseUrl}
            activeViewId={activeViewId}
          />
        </div>
      </SourcesLayout>
    </div>
  );
};


export default Source;
