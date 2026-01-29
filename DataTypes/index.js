import Pages from "./default";

// ---------------------------
// ---- Basic Types
// ---------------------------
import gis_dataset from "./gis_dataset";
import csv_dataset from "./csv_dataset";
import analytics from "./analytics";
import file_upload from "./file_upload"

const damaDataTypes = {
  gis_dataset,
  csv_dataset,
  analytics,
  file_upload
}

function registerDataType (name, dataType) {
  damaDataTypes[name] = dataType
}

export { damaDataTypes, Pages, registerDataType };

