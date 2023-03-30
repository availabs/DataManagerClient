import React from "react";


import MapPage from "../../gis_dataset/pages/Map";
import CreatePage from "../../gis_dataset/pages/Create";
import Table from "../../gis_dataset/pages/Table";


import {SedMapFilter, SedTableFilter, SedTableTransform} from './sedCustom'
// import { getAttributes } from 'pages/DataManager/components/attributes'



const TigSedConfig = {
  map: {
    name: "Map",
    path: "/map",
    component: (props) => <MapPage {...props} MapFilter={SedMapFilter} />,
  },
  table: {
    name: "Table",
    path: "/table",
    component: (props) => <Table {...props}  transform={SedTableTransform} TableFilter={SedTableFilter}/>,
  },
  sourceCreate: {
    name: "Create",
    component: CreatePage,
  },
  gisDatasetUpdate: {
    name: "Upload",
    path: "/gisDatasetUpdate",
    component: CreatePage,
  }
};

export default TigSedConfig;
