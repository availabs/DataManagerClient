import React, { useEffect, useMemo, useState } from "react";
import {  TopNav, SideNav } from "~/modules/avl-components/src";


import get from "lodash/get";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Pages, damaDataTypes } from "../DataTypes";

import SourcesLayout from "./layout";

import { SourceAttributes, ViewAttributes, getAttributes } from "~/pages/DataManager/Source/attributes";
import { DamaContext } from "~/pages/DataManager/store";
import baseUserViewAccess  from "../utils/authLevel";
import { NoMatch } from "../utils/404";

const PUBLIC_GROUP = 'Public';

const Source = ({}) => {
  const { sourceId, page, viewId } = useParams()
  const [ pages, setPages] = useState( Pages || [])
  const [ activeViewId, setActiveViewId ] = useState(viewId)
  const { pgEnv, baseUrl, falcor, falcorCache, user } = React.useContext(DamaContext)
  // console.log('source page: ');

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
    if (damaDataTypes[attributes.type]) {

      // check for pages to add
      let typePages = Object.keys(damaDataTypes[attributes.type]).reduce((a, c) => {
        if (damaDataTypes[attributes.type][c].path || c === 'overview') {
          a[c] = damaDataTypes[attributes.type][c];
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

  const sourceAuth = source?.statistics?.auth;
  const [searchParams, setSearchParams] = useSearchParams();

  const makeUrl = React.useCallback(d => {
    const params = [];
    searchParams.forEach((value, key) => {
      params.push(`${ key }=${ value }`);
    })
    return `${baseUrl}/source/${sourceId}${d.path}${activeViewId && d.path ? '/'+activeViewId : ''}${ params.length ? `?${ params.join("&") }` : "" }`
  }, [baseUrl, sourceId, activeViewId, searchParams])

  const serverAuthedForSource = React.useMemo(() => {
    let serverAuthedForSource = true;
    if (
      Object.keys(source).some((attrKey) => {
        //"message" indicates error message was thrown
        return source[attrKey] ? Object.keys(source[attrKey]).includes("message") : false;
      })
    ){
      serverAuthedForSource = false;
    }
    return serverAuthedForSource;
  }, [source])

  const { authUsers, authGroups } = React.useMemo(() => {
    return {
      authUsers: get(sourceAuth, ["users"], {}),
      authGroups: get(sourceAuth, ["groups"], {}),
    };
  }, [sourceAuth]);

  const Page = useMemo(() => {
    return page
      ? get(pages, `[${page}].component`, pages["overview"].component)
      : pages["overview"].component;
  }, [page, pages, Pages, sourceAuth]);

  // const doesUserHaveViewPermission =
  //   authGroups?.[PUBLIC_GROUP] > 0 ||
  //   (hasAuthData &&
  //     (Object.keys(authUsers).includes(user?.id?.toString()) ||
  //       Object.keys(authGroups).some((authGroupName) =>
  //         user?.groups.includes(authGroupName)
  //       )));

  //Look at all groups in `authGroups`, get max value for all groups user is a member of
  const userGroupAuth = Object.keys(authGroups).reduce((a,curGroupName) => {
    let max = a;

    if(user.groups.includes(curGroupName) || curGroupName === PUBLIC_GROUP) {
      //user is a member. take this authLevel if it is higher
      if(parseInt(authGroups[curGroupName]) > max) {
        max = parseInt(authGroups[curGroupName]);
      }
    }
    return max;
  }, -1);

  const userSourceAuth = authUsers[user.id] ?? -1;
  const userHighestAuth = Math.max(userGroupAuth, userSourceAuth)

  const doesUserPassPagePermission =
    !user.isAuthenticating && (Pages[page]?.authLevel ?? 1) <= userHighestAuth;

  if (!(Object.keys(source).length > 0) || user.isAuthenticating) {
    //todo loading spinner?
    console.log("blank screen");
    return <></>;
  } else if (
    Object.keys(source).length > 0 &&
    !user.isAuthenticating &&
    (!serverAuthedForSource || !doesUserPassPagePermission)
  ) {
    console.log("no matching");
    return <NoMatch />;
  }

  return (
     
        <SourcesLayout baseUrl={baseUrl}>
          <TopNav
            menuItems={Object.values(pages)
              .filter(d => {
                const pageAuthLevel = d?.authLevel || -1
                const userAuth = user.authLevel || -1
                return !d.hidden && (pageAuthLevel <= userAuth) && (pageAuthLevel <= userHighestAuth)
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
          <div className='w-full flex-1 bg-white shadow'>
            <Page
              searchParams={ searchParams }
              setSearchParams={ setSearchParams }
              source={source}
              views={views}
              user={user}
              baseUrl={baseUrl}
              activeViewId={activeViewId}
            />
          </div>
        </SourcesLayout>
      
    )
};


export default Source;
