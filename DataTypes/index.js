import Pages from "./default";
// ---------------------------
// ---- Deprecated
// ---------------------------
import freight_atlas_shapefile from "./freight_atlas_shapefile";
import npmrdsTravelTime from "./npmrdsTravelTime";
// ---------------------------
// ---- Basic Types
// ---------------------------
import gis_dataset from "./gis_dataset";


// ---------------------------
// ---- NPMRDS Types
// ---------------------------
import npmrds from "./npmrds";
import npmrds_travel_times_export_ritis from "./npmrds/npmrds_travel_times_export_ritis";
import npmrds_travel_times_export_etl from "./npmrds/npmrds_travel_times_export_etl";

import npmrds_travel_times_imp from "./npmrds/npmrds_travel_times_imp";
import npmrds_travel_times from "./npmrds/npmrds_travel_times";

import npmrds_tmc_identification_imp from "./npmrds/npmrds_tmc_identification_imp";
import npmrds_tmc_identification from "./npmrds/npmrds_tmc_identification";

// ---------------------------
// ---- Hazard Mitigation Types
// ---------------------------
import disaster_declarations_summaries_v2 from "./hazard_mitigation/disaster_declarations_summaries_v2";
import fema_nfip_claims_v1 from "./hazard_mitigation/fema_nfip_claims_v1";
import individuals_and_households_program_valid_registrations_v1
  from "./hazard_mitigation/individuals_and_households_program_valid_registrations_v1";
import public_assistance_funded_projects_details_v1
  from "./hazard_mitigation/public_assistance_funded_projects_details_v1";
import ncei_storm_events from './hazard_mitigation/ncei_storm_events';
import ncei_storm_events_enhanced from "./hazard_mitigation/ncei_storm_events_enhanced";
import zone_to_county from "./hazard_mitigation/zone_to_county";
import tiger_2017 from "./hazard_mitigation/tiger_2017";
import usda_crop_insurance_cause_of_loss from "./hazard_mitigation/usda";
import sba_disaster_loan_data_new from "./hazard_mitigation/sba";
import nri from "./hazard_mitigation/nri";
import per_basis from "./hazard_mitigation/per_basis_swd";
import hlr from "./hazard_mitigation/hlr";
import eal from "./hazard_mitigation/eal"
import disaster_loss_summary from "./hazard_mitigation/disaster_loss_summary";
import fusion from "./hazard_mitigation/fusion";

// ---------------------------
// ---- Tig Types
// ---------------------------
import tig_sed from './tig/sed'


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

  // hazmit types: geo
  zone_to_county,
  tiger_2017,

  // hazmit types: swd
  ncei_storm_events,
  ncei_storm_events_enhanced,

  // hazmit types: other data
  usda_crop_insurance_cause_of_loss,
  sba_disaster_loan_data_new,
  nri,

  // hazmit types: open fema data types
  disaster_declarations_summaries_v2,
  fema_nfip_claims_v1,
  individuals_and_households_program_valid_registrations_v1,
  public_assistance_funded_projects_details_v1,

  ofd: disaster_loss_summary,

  // hazmit types: AVAIL processing
  per_basis,
  hlr,
  eal,
  fusion,

  //TIG
  tig_sed
};

export { DataTypes, Pages };
