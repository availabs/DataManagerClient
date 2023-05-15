import Overview from "./Overview";
// import Metadata from "./Metadata";
import Versions from "./Versions";
// import AddVersion from "./AddVersion";

const Pages = {
  overview: {
    name: "Overview",
    path: "",
    component: Overview
  },
  /*meta: {
    name: "Metadata",
    path: "/meta",
    component: Metadata,
  },*/
  versions: {
    name: "Versions",
    path: "/versions",
    component: Versions
  },
  // add_version: {
  //   name: "Add Version",
  //   path: "/add_version",
  //   component: AddVersion
  // }
};

export default Pages;
