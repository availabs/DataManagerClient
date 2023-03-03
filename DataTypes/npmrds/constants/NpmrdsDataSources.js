// Copied from https://github.com/availabs/avail-data-manager-controller/blob/main/src/data_types/npmrds/domain/index.ts

const NpmrdsDataSources = {
  // The Raw RITIS NPMRDS Travel Times Export download with its three ZIP archives.
  NpmrdsTravelTimesExportRitis: "NpmrdsTravelTimesExportRitis",

  // The ETL output
  NpmrdsTravelTimesExportEtl: "NpmrdsTravelTimesExportEtl",

  // The NPMRDS Travel Times Postgres DB Tables
  NpmrdsTravelTimesImp: "NpmrdsTravelTimesImp",
  NpmrdsTravelTimes: "NpmrdsTravelTimes",

  // The NPMRDS TMC Identification Postgres DB Tables
  NpmrdsTmcIdentificationImp: "NpmrdsTmcIdentificationImp",
  NpmrdsTmcIdentification: "NpmrdsTmcIdentification",
};

export default NpmrdsDataSources;
