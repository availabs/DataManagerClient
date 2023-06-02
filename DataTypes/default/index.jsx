import Overview from "./Overview";
import Metadata from "./Metadata";
import Versions from "./Versions";
// import AddVersion from "./AddVersion";

const Pages = {
  overview: {
    name: "Overview",
    path: "",
    component: Overview
  },
  versions: {
    name: "Versions",
    path: "/versions",
    hidden: "true",
    component: Versions
  },
   meta: {
    name: "Metadata",
    path: "/meta",
    component: Metadata,
  },
  // add_version: {
  //   name: "Add Version",
  //   path: "/add_version",
  //   component: AddVersion
  // }
};

export default Pages;
