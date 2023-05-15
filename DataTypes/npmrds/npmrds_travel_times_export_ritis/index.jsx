import React from "react";

import main from "./tasks/main";
import ViewsTable from "./components/ViewsTable";
import EtlContextsTable from "./components/EtlContextsTable";

const Table = (/*{ source }*/) => {
  return <div> Table View </div>;
};

const pages = [
  {
    name: "Table",
    path: "/table",
    component: Table,
  },
  {
    name: "Views",
    path: "/views-table",
    component: ViewsTable,
  },
  {
    name: "Request",
    path: "/request",
    component: main,
  },
  {
    name: "ETL Processes",
    path: "/etl-processes",
    component: EtlContextsTable,
  },
];

const config = pages.reduce((acc, page) => {
  const { path } = page;
  const key = path.replace(/^\//, "");

  acc[key] = page;
  return acc;
}, {});

export default config;
