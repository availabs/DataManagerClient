import React from "react";

import MapPage from "../../gis_dataset/pages/Map";
import CreatePage from "../../gis_dataset/pages/Create";
import Table from "../../gis_dataset/pages/Table";
import Chart from "./chart";

import { SedMapFilter, SedTableFilter, SedTableTransform, SedHoverComp } from "./sedCustom";
import { SedChartFilter, SedChartTransform } from "./sedChartTaz";
import { SedChartFilterCounty, SedChartTransformCounty } from "./sedChartCounty";

import { SedCustomAttribute } from "./sedCustomAttribute";
import { customRules } from "./sedCustomRules";
import dbColsTaz from "./dbColsTaz.json";
import dbColsCounty from "./dbColsCounty.json";
// import { getAttributes } from '~/pages/DataManager/components/attributes'
import TigSedTazOverview from "./TigSedTazOverview"
import TigSedCountyOverview from "./TigSedCountyOverview"

export const tig_sed_taz = {
  overview: {
    name: "Overview",
    path: "",
    tag: 'test',
    component: TigSedTazOverview
  },
  map: {
    name: "Map",
    path: "/map",
    component: (props) => <MapPage
      {...props}
      MapFilter={SedMapFilter}
      HoverComp={SedHoverComp}
    />,
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
        dataType="tig_sed_taz"
        customRules={customRules}
        databaseColumnNames={dbColsTaz}
        CustomAttributes={SedCustomAttribute}
      />
    ),
  },
  add_version: {
    name: "Add Version",
    path: "/add_version",
    hidden: true,
    component: (props) => (
      <CreatePage
        {...props}
        dataType="tig_sed_taz"
        customRules={customRules}
        databaseColumnNames={dbColsTaz}
        CustomAttributes={SedCustomAttribute}
      />
    ),
  },
};


export const tig_sed_county = {
  overview: {
    name: "Overview",
    path: "",
    tag: 'test',
    component: TigSedCountyOverview
  },
  map: {
    name: "Map",
    path: "/map",
    component: (props) => <MapPage
      {...props}
      MapFilter={SedMapFilter}
      HoverComp={SedHoverComp}
    />,
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
        transform={SedChartTransformCounty}
        TableFilter={SedChartFilterCounty}
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
        databaseColumnNames={dbColsCounty}
        CustomAttributes={SedCustomAttribute}
      />
    ),
  },
  add_version: {
    name: "Add Version",
    path: "/add_version",
    hidden:true,
    component: (props) => (
      <CreatePage
        {...props}
        dataType="tig_sed_county"
        customRules={customRules}
        databaseColumnNames={dbColsCounty}
        CustomAttributes={SedCustomAttribute}
      />
    ),
  },
};
