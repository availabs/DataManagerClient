import React from "react";

import GisDatasetLoader from "./tasks/main";
import MapPage from "./pages/Map";

// import { getAttributes } from 'pages/DataManager/components/attributes'

const Table = (/*{ source }*/) => {
  return <div> Table View </div>;
};

const AddView = () => {
  return <div className="w-full h-full">Add New View</div>;
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
    component: GisDatasetLoader,
  },
  gisDatasetUpdate: {
    name: "Load New View",
    path: "/gisDatasetUpdate",
    component: GisDatasetLoader,
  },
  pwrUsrOnly: false,
};

export default GisDatasetConfig;
