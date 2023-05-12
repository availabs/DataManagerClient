import React from "react";

import ActiveNpmrdsTravelTimesViewSummary from "./components/ActiveNpmrdsTravelTimesViewSummary";

const Table = (/*{ source }*/) => {
  return <div> Table View Foo </div>;
};

const pages = [
  {
    name: "Table",
    path: "/table",
    component: Table,
  },
  {
    name: "Active View",
    path: "/active-npmrds-travel-times-view",
    component: ActiveNpmrdsTravelTimesViewSummary,
  },
];

const config = pages.reduce((acc, page) => {
  const { path } = page;
  const key = path.replace(/^\//, "");

  acc[key] = page;
  return acc;
}, {});

export default config;
