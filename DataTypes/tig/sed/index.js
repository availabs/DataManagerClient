import React from "react";

import MapPage from "../../gis_dataset/pages/Map";
import CreatePage from "../../gis_dataset/pages/Create";
import Table from "../../gis_dataset/pages/Table";
import Chart from "./chart";

import { SedMapFilter, SedTableFilter, SedTableTransform } from "./sedCustom";
import { SedChartFilter, SedChartTransform } from "./sedChartCustom";
import { SedCustomAttribute } from "./sedCustomAttribute";
import { customRules } from "./sedCustomRules";
import dbCols from "./dbCols.json";
// import { getAttributes } from 'pages/DataManager/components/attributes'

//console.log('dbCols', dbCols)

const TigSedConfig = {
  map: {
    name: "Map",
    path: "/map",
    component: (props) => <MapPage {...props} MapFilter={SedMapFilter} />,
  },
  table: {
    name: "Table",
    path: "/table",
    component: (props) => (
      <Table
        {...props}
        transform={SedTableTransform}
        TableFilter={SedTableFilter}
      />
    ),
  },
  chart: {
    name: "Chart",
    path: "/chart",
    component: (props) => (
      <Chart
        {...props}
        transform={SedChartTransform}
        TableFilter={SedChartFilter}
      />
    ),
  },
  sourceCreate: {
    name: "Create",
    component: (props) => (
      <CreatePage
        {...props}
        dataType="tig_sed"
        customRules={customRules}
        databaseColumnNames={dbCols}
        CustomAttributes={SedCustomAttribute}
      />
    ),
  },
  gisDatasetUpdate: {
    name: "Upload",
    path: "/gisDatasetUpdate",
    component: (props) => (
      <CreatePage
        {...props}
        dataType="tig_sed"
        customRules={customRules}
        databaseColumnNames={dbCols}
        CustomAttributes={SedCustomAttribute}
      />
    ),
  },
};

export default TigSedConfig;
