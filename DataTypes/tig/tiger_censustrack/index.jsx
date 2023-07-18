import React from "react";

import CreatePage from "../../gis_dataset/pages/Create";
import Table from "../../gis_dataset/pages/Table";

const TigCensustrackConfig = {
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
        dataType="tiger_censustrack"
      />
    ),
  },

  gisDatasetUpdate: {
    name: "Upload",
    path: "/gisDatasetUpdate",
    component: (props) => (
      <CreatePage
        {...props}
        dataType="tiger_censustrack"
      />
    ),
  },
};

export default TigCensustrackConfig;
