import Overview from "./Overview";
import Metadata from "./Metadata";
import Versions from "./Version/list";
import AddVersion from "./Version/add";
import Uploads from "./Uploads";
import Admin from "./Admin"


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
    hidden: false,
    component: Metadata,
  },
  uploads: {
    name: "Uploads",
    path: "/uploads",
    authLevel: 5,
    hidden: true,
    component: Uploads,
  },
  add_version: {
    name: "Add Version",
    path: "/add_version",
    authLevel: 5,
    hidden: true,
    component: AddVersion
  },
  admin: {
    name: "Admin",
    path: "/admin",
    authLevel: 10,
    component: Admin
  }
};

export default Pages;
