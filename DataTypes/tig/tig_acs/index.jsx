import React from "react";
import Create from "./create";
import Update from "./update";
// import MapPage from "../../gis_dataset/pages/Map";
import ACSMapFilter from "./map";

import Table from './table';
import { AcsTableFilter, AcsTableTransform } from "./table/acsFilters";

const TigAcsConfig = {
  // map: {
  //   name: "Map",
  //   path: "/map",
  //   component: (props) => <MapPage {...props} MapFilter={ACSMapFilter} />,
  // },
  sourceCreate: {
    name: "Create",
    component: (props) => <Create {...props} dataType="tig_acs" />,
  },
  update: {
    name: "Update",
    path: "/update",
    component: (props) => <Update {...props} />,
  },
  table: {
    name: "Table",
    path: "/table",
    component: (props) => (
      <Table
        {...props}
        transform={AcsTableTransform}
        TableFilter={AcsTableFilter}
      />
    ),
  },
};

export default TigAcsConfig;
