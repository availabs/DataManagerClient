import React from "react";
import { withAuth } from "~/modules/ams/src";

import { DataManagerHeader } from "./components/SourcesLayout";

import SourceList from "./Source/list";
import SourceView from "./Source";
import SourceCreate from "./Source/create";
import SourceDelete from "./Source/delete";


//import { useFalcor } from '~/modules/avl-components/src'

import { useFalcor } from '~/modules/avl-falcor'

import { DamaContext } from "./store"

const DamaRoutes = (baseUrl = "/datasources", defaultPgEnv = "pan", auth = false, components={}, navSettigs={}) => {
  
  const {
    Head = DataManagerHeader,
    List = SourceList,
    View = SourceView,
    Create =SourceCreate,
    Del = SourceDelete
  } = components

  const {
    sideNav = { size: "none"},
    topNav = {size: "none" }
  } = navSettigs

  const HeaderComp = () => { 
    const { falcor, falcorCache } = useFalcor()
    return (
      <DamaContext.Provider value={{pgEnv: defaultPgEnv, baseUrl}}>
        <Head  />
      </DamaContext.Provider>
    )
  }
  const Header = <HeaderComp />

  const SourceListComp = () => { 
    const { falcor, falcorCache } = useFalcor()
    return (
      <DamaContext.Provider value={{pgEnv: defaultPgEnv, baseUrl, falcor, falcorCache}}>
        <List />
      </DamaContext.Provider>
    );
  }

  const SourceViewComp = () => { 
    const { falcor, falcorCache } = useFalcor()
    return (
      <DamaContext.Provider value={{pgEnv: defaultPgEnv, baseUrl, falcor, falcorCache}}>
        <View />
      </DamaContext.Provider>
    );
  }

  const SourceCreateComp = () => { 
    const { falcor, falcorCache } = useFalcor()
      return (
      <DamaContext.Provider value={{pgEnv: defaultPgEnv, baseUrl, falcor, falcorCache}}>
        <Create />
      </DamaContext.Provider>
    );
  }

  const SourceDeleteComp = () => { 
    const { falcor, falcorCache } = useFalcor()
      return (
      <DamaContext.Provider value={{pgEnv: defaultPgEnv, baseUrl, falcor, falcorCache}}>
        <Del />
      </DamaContext.Provider>
    );
  }

  return [
    // Source List
    {
      name: "Data Sources",
      path: `${baseUrl}/`,
      exact: true,
      auth,
      mainNav: false,
      title: Header,
      sideNav,
      topNav,
      component: SourceListComp
    },
    {
      name: "Data Sources",
      path: `${baseUrl}/cat/:cat1`,
      exact: true,
      auth,
      mainNav: false,
      title: Header,
      sideNav,
      topNav,
      component: SourceListComp
    },
    {
      name: "Data Sources",
      path: `${baseUrl}/cat/:cat1/:cat2`,
      exact: true,
      auth,
      mainNav: false,
      title: Header,
      sideNav,
      topNav,
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
      sideNav,
      topNav,
      component: withAuth(SourceViewComp)
    },
    {
      name: "View Source",
      path: `${baseUrl}/source/:sourceId/:page`,
      exact: true,
      auth,
      mainNav: false,
      title: Header,
      sideNav,
      topNav,
      component: withAuth(SourceViewComp)
    }, {
      name: "View Source",
      path: `${baseUrl}/source/:sourceId/:page/:viewId`,
      exact: true,
      auth,
      mainNav: false,
      title: Header,
      sideNav,
      topNav,
      component: withAuth(SourceViewComp)
    }, {
      name: "View Source",
      path: `${baseUrl}/source/:sourceId/:page/:viewId/:vPage`,
      exact: true,
      auth,
      mainNav: false,
      title: Header,
      sideNav,
      topNav,
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
      sideNav,
      topNav,
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
      sideNav,
      topNav,
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
    // {
    //   name: "ETL Context View",
    //   path: `${baseUrl}/etl-context/:etlContextId`,
    //   exact: true,
    //   auth,
    //   mainNav: false,
    //   title: Header,
    //   sideNav,
    //   topNav,
    //   component: EtlContextEvents
    // }
  ];
};


export default DamaRoutes;
