import React from "react";
import Create from "./create";
import MapPage from "../../gis_dataset/pages/Map";
import ACSMapFilter from "./map";

const TigAcsConfig = {
  map: {
    name: "Map",
    path: "/map",
    component: (props) => <MapPage {...props} MapFilter={ACSMapFilter} />,
  },
  sourceCreate: {
    name: "Create",
    component: (props) => <Create {...props} dataType="tig_acs" />,
  },
};

export default TigAcsConfig;
