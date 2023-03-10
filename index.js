import React from "react";
import { withAuth } from "modules/avl-components/src";

import { DataManagerHeader } from "./components/SourcesLayout";

import SourceList from "./Source/list";
import SourceView from "./Source";
import SourceCreate from "./Source/create";
import SourceDelete from "./Source/delete";
import Settings from "./Source/settings";
import EtlContextEvents from "./EtlContext";

const DamaRoutes = (baseUrl = "/datasources") => {

  const Header = <DataManagerHeader baseUrl={baseUrl} />;
  const SourceListComp = () => <SourceList baseUrl={baseUrl} />;
  const SourceViewComp = () => <SourceView baseUrl={baseUrl} />;
  const SourceCreateComp = () => <SourceCreate baseUrl={baseUrl} />;
  const SourceDeleteComp = () => <SourceDelete baseUrl={baseUrl} />;

  return [
    // Source List
    {
      name: "Data Sources",
      path: `${baseUrl}/`,
      exact: true,
      auth: false,
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
      auth: false,
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
      auth: false,
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
      auth: false,
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
      auth: false,
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
      auth: false,
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
    {
      name: "Settings",
      path: `${baseUrl}/settings`,
      exact: true,
      auth: true,
      mainNav: false,
      title: Header,
      sideNav: {
        color: "dark",
        size: "micro"
      },
      component: Settings
    },
    {
      name: "ETL Context View",
      path: "/etl-context/:etlContextId",
      exact: true,
      auth: false,
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
