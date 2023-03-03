import CreateAllNpmrdsDataSources, {
  getIsAlreadyCreated,
} from "./tasks/CreateAllNpmrdsDataSources";

const config = {
  sourceCreate: {
    name: "Create",
    component: CreateAllNpmrdsDataSources,
  },

  getIsAlreadyCreated,

  pwrUsrOnly: false,
};

export default config;
