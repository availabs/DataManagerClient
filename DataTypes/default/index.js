import Overview from "./Overview";
import Metadata from "./Metadata";
import Versions from './Versions'

const Pages = {
  overview: {
    name: "Overview",
    path: "",
    component: Overview,
  },
  meta: {
    name: "Metadata",
    path: "/meta",
    component: Metadata,
  },
  versions: {
    name: "Versions",
    path: "/versions",
    component: Versions,
  },
};

export default Pages;
