import Pages from "./default";
// ---------------------------
// ---- Deprecated
// ---------------------------
import freight_atlas_shapefile from "./freight_atlas_shapefile";
// ---------------------------
// ---- Basic Types
// ---------------------------
import gis_dataset from "./gis_dataset";


// ---------------------------
// ---- NPMRDS Types
// ---------------------------
// import npmrds from "./npmrds";
// import npmrds_travel_times_export_ritis from "./npmrds/npmrds_travel_times_export_ritis";
// import npmrds_travel_times_export_etl from "./npmrds/npmrds_travel_times_export_etl";

// import npmrds_travel_times_imp from "./npmrds/npmrds_travel_times_imp";
// import npmrds_travel_times from "./npmrds/npmrds_travel_times";

// import npmrds_tmc_identification_imp from "./npmrds/npmrds_tmc_identification_imp";
// import npmrds_tmc_identification from "./npmrds/npmrds_tmc_identification";

// ---------------------------
// ---- Hazard Mitigation Types
// ---------------------------
import disaster_declarations_summaries_v2 from "./hazard_mitigation/disaster_declarations_summaries_v2";
import fima_nfip_claims_v1 from "./hazard_mitigation/fema_nfip_claims_v1";
import fima_nfip_claims_v1_enhanced from "./hazard_mitigation/fema_nfip_claims_v1_enhanced";
import individuals_and_households_program_valid_registrations_v1
  from "./hazard_mitigation/individuals_and_households_program_valid_registrations_v1";
import public_assistance_funded_projects_details_v1
  from "./hazard_mitigation/public_assistance_funded_projects_details_v1";
import public_assistance_funded_projects_details_v1_enhanced
  from "./hazard_mitigation/public_assistance_funded_projects_details_v1_enhanced";
import hazard_mitigation_grant_program_disaster_summaries_v2
  from "./hazard_mitigation/hazard_mitigation_grant_program_disaster_summaries_v2/index.jsx";
import hazard_mitigation_assistance_mitigated_properties_v3
  from "./hazard_mitigation/hazard_mitigation_assistance_mitigated_properties_v3/index.jsx";
import hazard_mitigation_assistance_projects_v3
  from "./hazard_mitigation/hazard_mitigation_assistance_projects_v3/index.jsx";
import hazard_mitigation_assistance_projects_v3_enhanced
  from "./hazard_mitigation/hazard_mitigation_assistance_projects_v3_enhanced/index.jsx";
import ncei_storm_events from './hazard_mitigation/ncei_storm_events';
import ncei_storm_events_enhanced from "./hazard_mitigation/ncei_storm_events_enhanced";
import zone_to_county from "./hazard_mitigation/zone_to_county";
import tiger_2017 from "./hazard_mitigation/tiger_2017";
import tiger_2017_full from "./hazard_mitigation/tiger_2017_full";
import usda_crop_insurance_cause_of_loss from "./hazard_mitigation/usda";
import usda_crop_insurance_cause_of_loss_enhanced from "./hazard_mitigation/usda_enhanced";
import sba_disaster_loan_data_new from "./hazard_mitigation/sba";
import nri from "./hazard_mitigation/nri";
import nri_tracts from "./hazard_mitigation/nri_tracts/index.jsx";
import per_basis from "./hazard_mitigation/per_basis_swd";
import per_basis_fusion from "./hazard_mitigation/per_basis_fusion";
import hlr from "./hazard_mitigation/hlr";
import eal from "./hazard_mitigation/eal"
import disaster_loss_summary from "./hazard_mitigation/disaster_loss_summary";
import fusion from "./hazard_mitigation/fusion";
//import open_fema_data from "./hazard_mitigation/open_fema_data";

// ---------------------------
// ---- Tig Types
// ---------------------------
import {tig_sed_taz, tig_sed_county} from './tig/sed'
import tiger_counties from './tig/tiger_counties'
import tiger_censustrack from './tig/tiger_censustrack'
import tig_acs from './tig/tig_acs'
import tig_project from './tig/project'


const DataTypes = {
  //freight_atlas_shapefile,
  gis_dataset,

  // npmrds,

  // npmrds_travel_times_export_ritis,
  // npmrds_travel_times_export_etl,

  // npmrds_travel_times_imp,
  // npmrds_travel_times,

  // npmrds_tmc_identification_imp,
  // npmrds_tmc_identification,

  // // hazmit types: geo
  // zone_to_county,
  tiger_2017,
  tiger_2017_full,

  // // // hazmit types: swd
  ncei_storm_events,
  ncei_storm_events_enhanced,

  //TIG
  tig_sed_taz,
  tig_sed_county,
  tiger_counties,
  tiger_censustrack,
  tig_acs,
  tig_project,

  // hazmit types: other data
  usda_crop_insurance_cause_of_loss,
  usda_crop_insurance_cause_of_loss_enhanced,
  sba_disaster_loan_data_new,
  nri,
  nri_tracts,

  // // hazmit types: open fema data types
  disaster_declarations_summaries_v2,
  //fima_nfip_claims_v1,
  fima_nfip_claims_v1_enhanced,
  individuals_and_households_program_valid_registrations_v1,
  public_assistance_funded_projects_details_v1,
  public_assistance_funded_projects_details_v1_enhanced,
  hazard_mitigation_grant_program_disaster_summaries_v2,
  hazard_mitigation_assistance_mitigated_properties_v3,
  hazard_mitigation_assistance_projects_v3,
  hazard_mitigation_assistance_projects_v3_enhanced,
  // open_fema_data,

  disaster_loss_summary,

  // hazmit types: AVAIL processing
  per_basis,
  per_basis_fusion,
  hlr,
  eal,
  fusion

};

export { DataTypes, Pages };
