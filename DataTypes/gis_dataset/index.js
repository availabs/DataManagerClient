import React from "react";


import MapPage from "./pages/Map";
import CreatePage from "./pages/Create";

// import { getAttributes } from 'pages/DataManager/components/attributes'

const Table = (/*{ source }*/) => {
  return <div> Table View </div>;
};


const GisDatasetConfig = {
  map: {
    name: "Map",
    path: "/map",
    component: MapPage,
  },
  table: {
    name: "Table",
    path: "/table",
    component: Table,
  },
  // This key is used to filter in src/pages/DataManager/Source/create.js
  sourceCreate: {
    name: "Create",
    component: CreatePage,
  },
  gisDatasetUpdate: {
    name: "Load New View",
    path: "/gisDatasetUpdate",
    component: CreatePage,
  },
  pwrUsrOnly: false,
};

export default GisDatasetConfig;
