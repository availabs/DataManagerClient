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

// hazmit types
import ncei_storm_events from './ncei_storm_events';
import ncei_storm_events_enhanced from "./ncei_storm_events_enhanced";
import zone_to_county from "./zone_to_county";
import tiger_2017 from "./tiger_2017";
import open_fema_data from "./open_fema_data";
import usda_crop_insurance_cause_of_loss from "./usda";
import sba_disaster_loan_data_new from "./sba";
import nri from "./nri";
import per_basis from "./per_basis_swd";
import hlr from "./hlr";
import eal from "./eal"
import disaster_loss_summary from "./disaster_loss_summary";

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

  // hazmit types
  ncei_storm_events,
  ncei_storm_events_enhanced,
  zone_to_county,
  tiger_2017,
  open_fema_data,
  usda_crop_insurance_cause_of_loss,
  sba_disaster_loan_data_new,
  nri,
  per_basis,
  hlr,
  eal,
  disaster_loss_summary
};

export { DataTypes, Pages };
