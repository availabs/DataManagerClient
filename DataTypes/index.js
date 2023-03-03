import Pages from "./default";
import freight_atlas_shapefile from "./freight_atlas_shapefile";
import npmrdsTravelTime from "./npmrdsTravelTime";
import gis_dataset from "./gis_dataset";

import npmrds from "./npmrds";
import npmrds_travel_times_export_ritis from "./npmrds/npmrds_travel_times_export_ritis";
import npmrds_travel_times_export_etl from "./npmrds/npmrds_travel_times_export_etl";

import npmrds_travel_times_imp from "./npmrds/npmrds_travel_times_imp";
import npmrds_travel_times from "./npmrds/npmrds_travel_times";

import npmrds_tmc_identification_imp from "./npmrds/npmrds_tmc_identification_imp";
import npmrds_tmc_identification from "./npmrds/npmrds_tmc_identification";

const DataTypes = {
  freight_atlas_shapefile,
  npmrdsTravelTime,
  gis_dataset,

  npmrds,

  npmrds_travel_times_export_ritis,
  npmrds_travel_times_export_etl,

  npmrds_travel_times_imp,
  npmrds_travel_times,

  npmrds_tmc_identification_imp,
  npmrds_tmc_identification,
};

export { DataTypes, Pages };
