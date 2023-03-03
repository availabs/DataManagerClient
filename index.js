import React from "react";
import { DataManagerHeader } from "./components/SourcesLayout";
import SourceList from "./Source/list";
import SourceView from "./Source";
import SourceCreate from "./Source/create";

import Settings from "./Source/settings";

import EtlContextEventsView from "./EtlContext";

const DataManager = () => {
  return (
    <div className="max-w-6xl mx-auto">
      <SourceList />
    </div>
  );
};

const SourcesList = [
  {
    name: "Data Sources",
    path: "/datasources",
    exact: true,
    auth: false,
    mainNav: false,
    title: <DataManagerHeader />,
    sideNav: {
      color: "dark",
      size: "micro",
    },
    component: DataManager,
  },
  {
    name: "Data Sources",
    path: "/datasources/cat/:cat1",
    exact: true,
    auth: false,
    mainNav: false,
    title: <DataManagerHeader />,
    sideNav: {
      color: "dark",
      size: "micro",
    },
    component: DataManager,
  },
  {
    name: "Data Sources",
    path: "/datasources/cat/:cat1/:cat2",
    exact: true,
    auth: false,
    mainNav: false,
    title: <DataManagerHeader />,
    sideNav: {
      color: "dark",
      size: "micro",
    },
    component: DataManager,
  },
];

const config = [
  ...SourcesList,
  ...SourceView,
  ...SourceCreate,
  ...Settings,
  ...EtlContextEventsView,
];

export default config;
