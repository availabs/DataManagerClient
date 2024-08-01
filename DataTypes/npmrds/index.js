import CreatePage from "../npmrds/pages/Create";
import ManagePage from "../npmrds/pages/manage";

const NpmrdsConfig = {
  sourceCreate: {
    name: "Create",
    component: CreatePage,
  },
  manage: {
    name: "Manage",
    path: "/manage",
    component: ManagePage,
  },
};

export default NpmrdsConfig;
