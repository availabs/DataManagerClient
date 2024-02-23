import Overview from "./Overview";
import Versions from "./Version/list";
import Admin from "./Admin"
import SymbologyEditor from "./Symbology"
import MapEditor from "./MapEditor"

const Pages = {
  overview: {
    name: "Overview",
    path: "",
    component: Overview
  },
  symbology: {
    name: "Symbology",
    path: "/symbology",
    component: SymbologyEditor,
  },
  mapeditor: {
    name: "Map Editor",
    path: "/mapeditor",
    fullWidth: true,
    hideBreadcrumbs: true,
    component: MapEditor,
  },
  versions: {
    name: "Versions",
    path: "/versions",
    hidden: "true",
    component: Versions
  },
  admin: {
    name: "Admin",
    path: "/admin",
    authLevel: 10,
    component: Admin
  }
};

export default Pages;
