import React from "react";

import MapPage from "../../gis_dataset/pages/Map";
import CreatePage from "../../gis_dataset/pages/Create";
import Table from "../../gis_dataset/pages/Table";
;

const TigSedConfig = {
  map: {
    name: "Map",
    path: "/map",
    component: MapPage,
  },
  table: {
    name: "Table",
    path: "/table",
    component: Table
  },
  
  sourceCreate: {
    name: "Create",
    component: (props) => (
      <CreatePage
        {...props}
        dataType="tiger_conties"
      />
    ),
  },
  gisDatasetUpdate: {
    name: "Upload",
    path: "/gisDatasetUpdate",
    component: (props) => (
      <CreatePage
        {...props}
        dataType="tiger_conties"
      />
    ),
  },
};

export default TigSedConfig;
