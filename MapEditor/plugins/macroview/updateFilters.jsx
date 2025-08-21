import get from "lodash/get"
import set from "lodash/set"
import omit from "lodash/omit"

const AM_PEAK_KEY = 'amp';
const PM_PEAK_KEY = 'pmp';
const WEEKEND_KEY = 'we';
const MIDDAY_KEY = 'midd';
const OVERNIGHT_KEY = 'ovn';
const NO_PEAK_KEY = 'all';

const YEARS = [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016];
const filters = {
  geography: {
    name: 'Geography',
    type: 'select',
    domain: [],
    value: [],
    searchable: true,
    accessor: d => d.name,
    valueAccessor: d => d.value,
    multi: true,
  },
  network: {
    name: "Network",
    type: "select",
    value: "tmc",
    multi: false,
    searchable: false,
    accessor: d => d.name,
    valueAccessor: d => d.value,
    domain: [
      { name: "TMC", value: "tmc" },
      { name: "Conflation", value: "con" },
      // { name: "RIS", value: "ris" }
    ]
  },
  conflation: {
    name: "Conflation",
    type: "select",
    value: "tmc",
    multi: false,
    searchable: false,
    accessor: d => d.name,
    valueAccessor: d => d.value,
    active: false,
    domain: [
      { name: "TMC", value: "tmc" },
      { name: "RIS", value: "ris" },
      { name: "OSM", value: "osm" }
    ]
  },

  year: {
    name: 'Year',
    type: "select",
    multi: false,
    domain: [...YEARS],
    value: YEARS[0]
  },
  compareYear: {
    name: 'Compare Year',
    type: 'select',
    multi: false,
    domain: ["none", ...YEARS],
    value: "none",

  },
  measure: {
    name: 'Performance Measure',
    type: 'select',
    domain: [],
    value: 'lottr',
    searchable: true,
    multi: false,
    accessor: d => d.name,
    valueAccessor: d => d.value
  },
  freeflow: {
    name: "Threshold Speed",
    type: "select",
    accessor: d => d.name,
    valueAccessor: d => d.value,
    domain: [
      { name: "Freeflow", value: true },
      { name: "Speed Limit", value: false }
    ],
    value: false,
    multi: false,
    searchable: false,
    active: false
  },
  risAADT: {
    name: "AADT Source",
    type: "select",
    accessor: d => d.name,
    valueAccessor: d => d.value,
    domain: [
      { name: "RIS", value: true },
      { name: "NPMRDS", value: false }
    ],
    value: false,
    multi: false,
    searchable: false,
    active: false
  },
  fueltype: {
    name: "Fuel Type",
    type: "select",
    accessor: d => d.name,
    valueAccessor: d => d.value,
    domain: [
      { name: "Total (Gasoline & Diesel)", value: "total" },
      { name: "Gasoline", value: "gas" },
      { name: "Diesel", value: "diesel" }
    ],
    value: "total",
    multi: false,
    searchable: false,
    active: false
  },
  pollutant: {
    name: "Pollutant",
    type: "select",
    accessor: d => d.name,
    valueAccessor: d => d.value,
    domain: [
      { name: "CO² (Carbon Dioxide)", value: "co2" },
      { name: "CO (Carbon Monoxide)", value: "co" },
      { name: "NOx (Nitrogen Oxides)", value: "nox" },
      { name: "VOC (Volatile organic compound)", value: "voc" },
      { name: "PM₂.₅ (Fine Particles <= 2.5 microns)", value: "pm2_5" },
      { name: "PM₁₀ (Particulate Matter <= 10 microns)", value: "pm10" }
    ],
    value: "co2",
    multi: false,
    searchable: false,
    active: false
  },
  // perMiles: {
  //   name: "Sum By",
  //   type: "select",
  //   accessor: d => d.name,
  //   valueAccessor: d => d.value,
  //   domain: [
  //     { name: "Per Mile", value: true },
  //     { name: "Total", value: false }
  //   ],
  //   value: true,
  //   multi: false,
  //   searchable: false,
  //   active: false
  // },
  vehicleHours: {
    name: "Unit",
    type: "select",
    accessor: d => d.name,
    valueAccessor: d => d.value,
    domain: [
      { name: "Vehicle Hours", value: true },
      { name: "Person Hours", value: false }
    ],
    value: false,
    multi: false,
    searchable: false,
    active: false
  },
  percentiles: {
    name: "Percentile",
    type: "select",
    accessor: d => d.name,
    valueAccessor: d => d.value,
    multi: false,
    domain: [
      { name: "5th Percentile", value: "5pctl" },
      { name: "20th Percentile", value: "20pctl" },
      { name: "25th Percentile", value: "25pctl" },
      { name: "50th Percentile", value: "50pctl" },
      { name: "75th Percentile", value: "75pctl" },
      { name: "80th Percentile", value: "80pctl" },
      { name: "85th Percentile", value: "85pctl" },
      { name: "95th Percentile", value: "95pctl" }
    ],
    value: null,
    active: false
  },
  trafficType: {
    name: "Traffic Type",
    type: "select",
    accessor: d => d.name,
    valueAccessor: d => d.value,
    domain: [
      { name: "All Traffic", value: "all" },
      { name: "All Trucks", value: "truck" },
      { name: "Single Unit Trucks", value: "singl" },
      { name: "Combination Trucks", value: "combi" },
    ],
    value: 'all',
    active: false
  },
  peakSelector: {
    name: "Peak Selector",
    type: "select",
    accessor: d => d.name,
    valueAccessor: d => d.value,
    domain: [],
    value: null,
    multi: false,
    active: true
  },
  attributes: {
    name: "Attributes",
    type: "select",
    accessor: d => d.name,
    valueAccessor: d => d.value,
    domain: [],
    value: null,
    multi: false,
    active: false
  }
}

const updateSubMeasures = (measure, filters, falcor) => {
  const {
    // fetchData,
    peakSelector,
    freeflow,
    risAADT,
    // perMiles,
    vehicleHours,
    attributes,
    percentiles,
    trafficType,
    fueltype,
    pollutant
  } = filters;

  const cache = falcor.getCache();

  const mIds = get(cache, ["pm3", "measureIds","value"], []);
  const mInfo = get(cache, ["pm3", "measureInfo"], {});

  peakSelector.active = false;
  peakSelector.domain = [];
  trafficType.active = false;
  trafficType.value = 'all'

  freeflow.active = false;
  risAADT.active = false;
  // perMiles.active = false;
  vehicleHours.active = false;
  percentiles.active = false;

  attributes.active = false;

  fueltype.active = false;
  pollutant.active = false;

  switch (measure) {
    case "emissions":
      peakSelector.active = true;

      fueltype.active = true;
      fueltype.value = "total";
      pollutant.active = true;
      pollutant.value = "co2";

      peakSelector.domain = [
        { name: "No Peak", value: NO_PEAK_KEY },
        { name: "AM Peak", value: AM_PEAK_KEY },
        { name: "Off Peak", value: "off" },
        { name: "PM Peak", value: PM_PEAK_KEY },
        { name: "Overnight", value: OVERNIGHT_KEY },
        { name: "Weekend", value: WEEKEND_KEY }
      ]
      risAADT.active = true;
      break;
    case "RIS":
      attributes.active = true;
      attributes.domain = mIds.filter(m => /^RIS_/.test(m))
        .map(id => ({
          name: get(mInfo, [id, "fullname"], id),
          value: id.replace("RIS_", "")
        }));
      break;
    case "TMC":
      attributes.active = true;
      attributes.domain =  mIds.filter(m => /^TMC_/.test(m)).filter(m => m !== "TMC_tmc")
        .map(id => ({
          name: get(mInfo, [id, "fullname"], id),
          value: id.replace("TMC_", "")
        }));
      break;
    case "lottr":
      peakSelector.active = true;
      peakSelector.domain = [
        // { name: "No Peak", value: NO_PEAK_KEY },
        { name: "AM Peak", value: AM_PEAK_KEY },
        { name: "Midday", value: MIDDAY_KEY },
        // { name: "Off Peak", value: "off" },
        { name: "PM Peak", value: PM_PEAK_KEY },
        { name: "Weekend", value: WEEKEND_KEY }
      ]
      break;
    case "tttr":
      peakSelector.active = true;
      peakSelector.domain = [
        // { name: "No Peak", value: NO_PEAK_KEY },
        { name: "AM Peak", value: AM_PEAK_KEY },
        { name: "Midday", value: MIDDAY_KEY },
        // { name: "Off Peak", value: "off" },
        { name: "PM Peak", value: PM_PEAK_KEY },
        { name: "Weekend", value: WEEKEND_KEY },
        { name: "Overnight", value: OVERNIGHT_KEY }
      ]
      break;
    case "phed":
      peakSelector.active = true;
      peakSelector.domain = [
        { name: "No Peak", value: NO_PEAK_KEY },
        { name: "AM Peak", value: AM_PEAK_KEY },
        { name: "PM Peak", value: PM_PEAK_KEY }
      ]
      freeflow.active = true;
      risAADT.active = true;
      // perMiles.active = true;
      vehicleHours.active = true;
      trafficType.active = true;
      break;
    case "ted":
      freeflow.active = true;
      risAADT.active = true;
      // perMiles.active = true;
      vehicleHours.active = true;
      trafficType.active = true;
      break;
    case "pti":
    case "tti":
      peakSelector.active = true;
      peakSelector.domain = [
        { name: "No Peak", value: NO_PEAK_KEY },
        { name: "AM Peak", value: AM_PEAK_KEY },
        { name: "PM Peak", value: PM_PEAK_KEY }
      ]
      break;
    case "pct_bins_reporting":
      peakSelector.active = true;
      peakSelector.domain = [
        { name: "No Peak", value: NO_PEAK_KEY },
        { name: "AM Peak", value: AM_PEAK_KEY },
        { name: "Off Peak", value: "off" },
        { name: "PM Peak", value: PM_PEAK_KEY },
        { name: "Overnight", value: OVERNIGHT_KEY },
        { name: "Weekend", value: WEEKEND_KEY }
      ]
      peakSelector.value = 'none';
    break;
    case "speed":
      peakSelector.active = true;
      peakSelector.domain = [
        { name: "No Peak", value: "total" },
        { name: "AM Peak", value: AM_PEAK_KEY },
        { name: "Off Peak", value: "off" },
        { name: "PM Peak", value: PM_PEAK_KEY },
        { name: "Overnight", value: OVERNIGHT_KEY },
        { name: "Weekend", value: WEEKEND_KEY }
      ]
      percentiles.active = true;
      break;
    default:
      break;
  }

  if (!peakSelector.domain.reduce((a, c) => a || (c.value === peakSelector.value), false)) {
    peakSelector.value = measure === "speed" ? "total" : "none";
  }

  // if ((measure !== "phed") && (measure !== "ted")) {
  //   freeflow.value = false;
  //   perMiles.value = false;
  //   vehicleHours.value = false;
  // } else {
  //   freeflow.value = true;
  //   perMiles.value = true;
  //   vehicleHours.value = true;
  // }

  freeflow.value = false;
  // perMiles.value = false;
  vehicleHours.value = false;
  risAADT.value = false;

  percentiles.value = null;
  attributes.value = null;


  return {
    peakSelector,
    freeflow,
    risAADT,
    // perMiles,
    vehicleHours,
    attributes,
    percentiles,
    trafficType,
    fueltype,
    pollutant
  }
// console.log("updateSubMeasures:", filters)
}

//no side effects/mutations/effects/etc.
//literally just tells you what your `data-column` is
const getMeasure = (filters) => {
  const {
    measure,
    peakSelector,
    freeflow,
    risAADT,
    // perMiles,
    vehicleHours,
    attributes,
    percentiles,
    trafficType,
    fueltype,
    pollutant
  } = filters;

// console.log("getMeasure:", filters)

  const out = [
    measure.value,
    (trafficType.value !== "all") && trafficType.value,
     freeflow.value && measure.value !== "freeflow" ? "freeflow" : null,
        //freeflow.value && measure.value !== "freeflow" ? null : "freeflow",
    risAADT.value ? "ris" : false,
    fueltype.active && (fueltype.value !== "total") ? fueltype.value : false,
    pollutant.active && pollutant.value,
    fueltype.active && (fueltype.value === "gas") ? "pass" : false,
    fueltype.active && (fueltype.value === "diesel") ? "truck" : false,
    // perMiles.value && "per_mi",
    vehicleHours.value && "vhrs",
    (measure.value === "speed") && percentiles.value,
    (peakSelector.value !== "none") && peakSelector.value,
    attributes.value
  ].filter(Boolean).join("_")

  const NOT_MEASURES = ["RIS", "TMC", "speed_total"];

  if (NOT_MEASURES.includes(out)) {
// console.log("getMeasure::out", "");
    return ""
  }

// console.log("getMeasure::out", out);

  return out
}

export {filters, updateSubMeasures, getMeasure}