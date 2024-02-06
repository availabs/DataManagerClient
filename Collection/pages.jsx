import { Pages } from "../DataTypes";
import OverviewPage from './overview';

const CollectionPages = {
  ...Pages,
  overview: {
    name: "Overview",
    path: "",
    component: OverviewPage,
  },
};

export default CollectionPages;