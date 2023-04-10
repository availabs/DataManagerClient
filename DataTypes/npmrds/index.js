import CreateAllNpmrdsDataSources, {
  getIsAlreadyCreated,
} from "./tasks/CreateAllNpmrdsDataSources";

const config = {
  sourceCreate: {
    name: "Create",
    component: CreateAllNpmrdsDataSources,
  },
};

export default config;
