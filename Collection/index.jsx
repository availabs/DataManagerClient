import React, { useEffect, useMemo, useState } from "react";
import {  TopNav, SideNav } from "~/modules/avl-components/src";


import get from "lodash/get";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Pages as CollectionPages, damaCollectionTypes } from "./CollectionTypes";

import CollectionsLayout from "./layout";

import { CollectionAttributes, SymbologyAttributes, getAttributes } from "~/pages/DataManager/Collection/attributes";
import { DamaContext } from "~/pages/DataManager/store";
import baseUserViewAccess  from "../utils/authLevel";
import { NoMatch } from "../utils/404";


const Collection = ({}) => {
  const { collectionId, page, viewId } = useParams()
  const [ pages, setPages] = useState( CollectionPages || [])
  const [ activeViewId, setActiveViewId ] = useState(viewId)
  const { pgEnv, baseUrl, falcor, falcorCache, user } = React.useContext(DamaContext)

  const userAuthLevel = user.authLevel;

  const Page = useMemo(() => {
    return page
      ? get(pages, `[${page}].component`, pages["overview"].component)
      : pages["overview"].component;
  }, [page, pages]);

  useEffect(() => {
    //RYAN TODO this GET call is what we need to change/add to the backend. 
    async function fetchData() {
      //console.time("fetch data");
      const lengthPath = ["dama", pgEnv, "collections", "byId", collectionId, "symbologies", "length"];
      const resp = await falcor.get(lengthPath);

      let data = await falcor.get(
        [
          "dama", pgEnv, "collections", "byId", collectionId, "symbologies", "byIndex",
          { from: 0, to: get(resp.json, lengthPath, 0) - 1 },
          "attributes", Object.values(SymbologyAttributes)
        ],
        [
          "dama", pgEnv, "collections", "byId", collectionId,
          "attributes", Object.values(CollectionAttributes)
        ],
        [
          "dama", pgEnv, "collections", "byId", collectionId, "meta"
        ]
      );
      //console.timeEnd("fetch data");
      console.log(data)
      return data;
    }

    fetchData();
  }, [collectionId, falcor, pgEnv]);

  const symbologies = useMemo(() => {
    return Object.values(get(falcorCache, ["dama", pgEnv, "collections", "byId", collectionId, "symbologies", "byIndex"], {}))
      .map(v => getAttributes(get(falcorCache, v.value, { "attributes": {} })["attributes"]));
  }, [falcorCache, collectionId, pgEnv]);


  useEffect(() => {
    if(activeViewId && activeViewId !== viewId) {
      // if active view is set and we get new param
      // update active view id
      setActiveViewId(viewId)
    }

    if(!activeViewId && symbologies.length > 0) {
        let authViews = symbologies.filter(v => v?.metadata?.authoritative).length > 0 ?
            symbologies.filter(v => v?.metadata?.authoritative) :
            symbologies


        setActiveViewId(authViews.sort((a,b) => a._created_timestamp - b._created_timestamp)[0].view_id)

    }

  },[symbologies, viewId]);

  const collection = useMemo(() => {
    let attributes = getAttributes(get(falcorCache, ["dama", pgEnv, "collections", "byId", collectionId], { "attributes": {} })["attributes"]);
    if (damaCollectionTypes[attributes.type]) {

      // check for pages to add
      let typePages = Object.keys(damaCollectionTypes[attributes.type]).reduce((a, c) => {
        if (damaCollectionTypes[attributes.type][c].path || c === 'overview') {
          a[c] = damaCollectionTypes[attributes.type][c];
        }
        return a;
      }, {});

      let allPages = { ...CollectionPages, ...typePages };
      console.log({allPages})
      setPages(allPages);
    } else {
      setPages(CollectionPages);
    }
    return attributes;
  }, [falcorCache, collectionId, pgEnv]);

  const collectionAuthLevel = baseUserViewAccess(collection?.statistics?.access || {});

  const [searchParams, setSearchParams] = useSearchParams();

  const makeUrl = React.useCallback(d => {
    const params = [];
    searchParams.forEach((value, key) => {
      params.push(`${ key }=${ value }`);
    })
    return `${baseUrl}/collection/${collectionId}${d.path}${activeViewId && d.path ? '/'+activeViewId : ''}${ params.length ? `?${ params.join("&") }` : "" }`
  }, [baseUrl, collectionId, activeViewId, searchParams])
 
  if(collectionAuthLevel > userAuthLevel) {
    return  <NoMatch />
  } 

  return (
      <div className="max-w-6xl mx-auto">
        <CollectionsLayout baseUrl={baseUrl}>
          <TopNav
            menuItems={Object.values(pages)
              .filter(d => {
                const authLevel = d?.authLevel || -1
                const userAuth = user.authLevel || -1
                return !d.hidden && (authLevel <= userAuth)
              })
              .sort((a,b) => (a?.authLevel || -1)  - (b?.authLevel|| -1))
              .map(d => {
                return {
                  name:d.name,
                  path: makeUrl(d)
                }

              })}
            themeOptions={{ size: "inline" }}
          />
          <div className='w-full p-4 bg-white shadow mb-4'>
            <Page
              searchParams={ searchParams }
              setSearchParams={ setSearchParams }
              collection={collection}
            //   source={source}
            //   views={views}
              symbologies={symbologies}
              user={user}
              baseUrl={baseUrl}
              activeViewId={activeViewId}
            />
          </div>
        </CollectionsLayout>
      </div>
    )
};


export default Collection;
