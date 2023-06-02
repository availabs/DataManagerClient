import MapPage from "./pages/Map";
import CreatePage from "./pages/Create";
import Table from "./pages/Table";
import Uploads from "./pages/Uploads";

// import { getAttributes } from 'pages/DataManager/components/attributes'



const GisDatasetConfig = {
  map: {
    name: "Map",
    path: "/map",
    component: MapPage,
  },
  table: {
    name: "Table",
    path: "/table",
    component: Table,
  },
  // This key is used to filter in src/pages/DataManager/Source/create.js
  sourceCreate: {
    name: "Create",
    component: CreatePage,
  },
  gisDatasetUpdate: {
    name: "Load New View",
    path: "/gisDatasetUpdate",
    hidden: true,
    component: CreatePage,
  },
  uploads: {
    name: "Uploads",
    path: "/uploads",
    hidden: true,
    component: Uploads,
  },
};

export default GisDatasetConfig;
