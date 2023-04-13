import React from "react";


import MapPage from "../../gis_dataset/pages/Map";
import CreatePage from "../../gis_dataset/pages/Create";
import Table from "../../gis_dataset/pages/Table";
import Chart from './chart';

import {SedMapFilter, SedTableFilter, SedTableTransform} from './sedCustom';
import {SedTableFilter2, SedTableTransform2 }  from './sedCustom2';
import dbCols from './dbCols.json'
// import { getAttributes } from 'pages/DataManager/components/attributes'

//console.log('dbCols', dbCols)

const TigSedConfig = {
  map: {
    name: "Map",
    path: "/map",
    component: (props) => 
      <MapPage 
        {...props} 
        MapFilter={SedMapFilter} 
      />
  },
  table: {
    name: "Table",
    path: "/table",
    component: (props) =>
      <Table 
        {...props}  
        transform={SedTableTransform} 
        TableFilter={SedTableFilter}
      />,
  },
  chart: {
    name: "Chart",
    path: "/chart",
    component: (props) => <Chart {...props}  transform={SedTableTransform2} TableFilter={SedTableFilter2} />, 
  },
  sourceCreate: {
    name: "Create",
    component: (props) => <CreatePage {...props} databaseColumnNames={dbCols} />,
  },
  gisDatasetUpdate: {
    name: "Upload",
    path: "/gisDatasetUpdate",
    component: (props) => <CreatePage {...props} />,
  }
};

export default TigSedConfig;
