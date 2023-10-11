import React from "react";

import { DataManagerHeader, Header } from "./Source/layout";
import SourceList from "./Source/list";
import SourceView from "./Source";
import SourceCreate from "./Source/create";
import SourceDelete from "./Source/delete";

import { registerDataType } from './DataTypes'

import { DamaContext } from "./store"

const DamaRoutes = DAMA_ARGS => {

  const {
    baseUrl = "/datasources", // old position 0 arg
    defaultPgEnv = "pan",     // old position 1 arg
    authLevel = -1,             // old position 2 arg,
    components = {},
    dataTypes = {},
    navSettings = {},
    useFalcor,
    useAuth
  } = DAMA_ARGS;

  const {
    Head = DataManagerHeader,
    List = SourceList,
    View = SourceView,
    Create =SourceCreate,
    Del = SourceDelete
  } = components

  const {
    sideNav = { size: "none"},
    topNav = { size: "none" }
  } = navSettings

  // register custom dataTypes for project
  Object.keys(dataTypes).forEach(type => registerDataType(type,dataTypes[type]))

  const HeaderComp = () => {
    return (
      <DamaContext.Provider value={{pgEnv: defaultPgEnv, baseUrl}}>
        <Head  />
      </DamaContext.Provider>
    )
  }
  //const Header = () => <HeaderComp />

  const SourceListComp = () => {
    const { falcor, falcorCache } = useFalcor();
    const user = useAuth();
    return (
      <DamaContext.Provider
        value={{pgEnv: defaultPgEnv, baseUrl, falcor, falcorCache, user}}
      >
        <List />
      </DamaContext.Provider>
    );
  }

  const SourceViewComp = () => {
    const { falcor, falcorCache } = useFalcor();
    const user = useAuth();
    return (
      <DamaContext.Provider value={{pgEnv: defaultPgEnv, baseUrl, falcor, falcorCache, user}}>
        <View />
      </DamaContext.Provider>
    );
  }

  const SourceCreateComp = () => {
    const { falcor, falcorCache } = useFalcor();
    const user = useAuth();
    return (
    <DamaContext.Provider value={{pgEnv: defaultPgEnv, baseUrl, falcor, falcorCache, user}}>
      <Create />
    </DamaContext.Provider>
  );
  }

  const SourceDeleteComp = () => {
    const { falcor, falcorCache } = useFalcor();
    const user = useAuth();
      return (
      <DamaContext.Provider value={{pgEnv: defaultPgEnv, baseUrl, falcor, falcorCache, user}}>
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
      authLevel,
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
      authLevel,
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
      authLevel,
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
      authLevel,
      mainNav: false,
      title: Header,
      sideNav,
      topNav,
      component: SourceViewComp
    },
    {
      name: "View Source",
      path: `${baseUrl}/source/:sourceId/:page`,
      exact: true,
      authLevel,
      mainNav: false,
      title: Header,
      sideNav,
      topNav,
      component: SourceViewComp
    }, {
      name: "View Source",
      path: `${baseUrl}/source/:sourceId/:page/:viewId`,
      exact: true,
      authLevel,
      mainNav: false,
      title: Header,
      sideNav,
      topNav,
      component: SourceViewComp
    }, {
      name: "View Source",
      path: `${baseUrl}/source/:sourceId/:page/:viewId/:vPage`,
      exact: true,
      authLevel,
      mainNav: false,
      title: Header,
      sideNav,
      topNav,
      component: SourceViewComp
    },
    // Source Create
    {
      name: "Create Source",
      path: `${baseUrl}/create/source`,
      exact: true,
      authLevel: false,
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
      authLevel: true,
      mainNav: false,
      title: Header,
      sideNav,
      topNav,
      component: SourceDeleteComp
    }
  ];
};


export default DamaRoutes;
