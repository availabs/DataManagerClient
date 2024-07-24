import Pages from "./default";

// ---------------------------
// ---- Basic Types
// ---------------------------
import gis_dataset from "./gis_dataset";
import csv_dataset from "./csv_dataset";
import npmrds from "./npmrds";

const damaDataTypes = {
  gis_dataset,
  csv_dataset,
  npmrds
}

function registerDataType (name, dataType) {
  damaDataTypes[name] = dataType
}

export { damaDataTypes, Pages, registerDataType };

