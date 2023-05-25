import React from "react";
import { withAuth } from "@availabs/ams";

import { DataManagerHeader } from "./components/SourcesLayout";

import SourceList from "./Source/list";
import SourceView from "./Source";
import SourceCreate from "./Source/create";
import SourceDelete from "./Source/delete";
// import Settings from "./Source/settings";
import EtlContextEvents from "./EtlContext";

import { DamaContext } from "./store"

const DamaRoutes = (baseUrl = "/datasources", defaultPgEnv = "pan", auth = false) => {
  // console.log('load DataManager url:',baseUrl, 'pgenv:', defaultPgEnv)
  // const onLoadPgEnv = defaultPgEnv;
  // console.log('set pgenv', defaultPgEnv)
  // setPgEnv(onLoadPgEnv);
  // console.log('DamaRoutes', baseUrl, defaultPgEnv)

  const HeaderComp = () => (
    <DamaContext.Provider value={{pgEnv: defaultPgEnv, baseUrl}}>
      <DataManagerHeader  />
    </DamaContext.Provider>
  )

  const Header = <HeaderComp />

  const SourceListComp = () => (
    <DamaContext.Provider value={{pgEnv: defaultPgEnv, baseUrl}}>
      <SourceList />
    </DamaContext.Provider>
  );
  const SourceViewComp = () => (
    <DamaContext.Provider value={{pgEnv: defaultPgEnv, baseUrl}}>
      <SourceView />
    </DamaContext.Provider>
  );
  const SourceCreateComp = () => (
    <DamaContext.Provider value={{pgEnv: defaultPgEnv, baseUrl}}>
      <SourceCreate />
    </DamaContext.Provider>
  );
  const SourceDeleteComp = () => (
    <DamaContext.Provider value={{pgEnv: defaultPgEnv, baseUrl}}>
      <SourceDelete />
    </DamaContext.Provider>
  );

  return [
    // Source List
    {
      name: "Data Sources",
      path: `${baseUrl}/`,
      exact: true,
      auth,
      mainNav: false,
      title: Header,
      sideNav: {
        color: "dark",
        size: "micro"
      },
      component: SourceListComp
    },
    {
      name: "Data Sources",
      path: `${baseUrl}/cat/:cat1`,
      exact: true,
      auth,
      mainNav: false,
      title: Header,
      sideNav: {
        color: "dark",
        size: "micro"
      },
      component: SourceListComp
    },
    {
      name: "Data Sources",
      path: `${baseUrl}/cat/:cat1/:cat2`,
      exact: true,
      auth,
      mainNav: false,
      title: Header,
      sideNav: {
        color: "dark",
        size: "micro"
      },
      component: SourceListComp
    },
    // -- Source View
    {
      name: "View Source",
      path: `${baseUrl}/source/:sourceId`,
      exact: true,
      auth,
      mainNav: false,
      title: Header,
      sideNav: {
        color: "dark",
        size: "micro"
      },
      component: withAuth(SourceViewComp)
    },
    {
      name: "View Source",
      path: `${baseUrl}/source/:sourceId/:page`,
      exact: true,
      auth,
      mainNav: false,
      title: Header,
      sideNav: {
        color: "dark",
        size: "micro"
      },
      component: withAuth(SourceViewComp)
    }, {
      name: "View Source",
      path: `${baseUrl}/source/:sourceId/:page/:viewId`,
      exact: true,
      auth,
      mainNav: false,
      title: Header,
      sideNav: {
        color: "dark",
        size: "micro"
      },
      component: withAuth(SourceViewComp)
    }, {
      name: "View Source",
      path: `${baseUrl}/source/:sourceId/:page/:viewId/:vPage`,
      exact: true,
      auth,
      mainNav: false,
      title: Header,
      sideNav: {
        color: "dark",
        size: "micro"
      },
      component: withAuth(SourceViewComp)
    },
    // Source Create
    {
      name: "Create Source",
      path: `${baseUrl}/create/source`,
      exact: true,
      auth: true,
      mainNav: false,
      title: Header,
      sideNav: {
        color: "dark",
        size: "micro"
      },
      component: SourceCreateComp
    },
    // Source Delete
    {
      name: "Delete Source",
      path: `${baseUrl}/delete/source/:sourceId`,
      exact: true,
      auth: true,
      mainNav: false,
      title: Header,
      sideNav: {
        color: "dark",
        size: "micro"
      },
      component: SourceDeleteComp
    },
    //
    // {
    //   name: "Settings",
    //   path: `${baseUrl}/settings`,
    //   exact: true,
    //   auth: true,
    //   mainNav: false,
    //   title: Header,
    //   sideNav: {
    //     color: "dark",
    //     size: "micro"
    //   },
    //   component: Settings
    // },
    {
      name: "ETL Context View",
      path: `${baseUrl}/etl-context/:etlContextId`,
      exact: true,
      auth,
      mainNav: false,
      title: Header,
      sideNav: {
        color: "dark",
        size: "micro"
      },
      component: EtlContextEvents
    }
  ];
};


export default DamaRoutes;
