import React, { useMemo } from "react";
import get from "lodash/get";
import sumBy from "lodash/sumBy";
import { regionalData } from "../constants/index";

const sedVars = {
  totpop: { name: "Total Population" },
  hhpop: { name: "Households" },
  hhnum: { name: "Household Population" },
  hhsize: { name: "Household Size" },
  hhincx: { name: "Household Income" },
  elf: { name: "Employed Labor Fouce" },
  emptot: { name: "Total Employment" },
  empret: { name: "Retail Employment" },
  empoff: { name: "Office Employment" },
  earnwork: { name: "Earnings" },
  unvenrol: { name: "Universirty Enrollment" },
  k_12_etot: { name: "School Enrollment" },
  gqpop: { name: "Group Quarters Population" },
  gqpopins: { name: "Group Quarters Instituional Population" },
  gqpopstr: { name: "Group Quarters Other Population" },
  gqpopoth: { name: "Group Quarters Homless Population" },
};

const summarizeVars = {
  subRegion: { name: "Sub Region" },
  region: { name: "Region" },
};

const areas = [
  ...Object.keys(regionalData?.regions || {}),
  ...Object.keys(regionalData?.sub_regions || {}),
];

const years = ["10", "17", "20", "25", "30", "35", "40", "45", "50", "55"];

const SedMapFilter = ({ source, activeVar, setActiveVar }) => {
  let varType = useMemo(
    () =>
      typeof activeVar === "string"
        ? activeVar.substring(0, activeVar.length - 3)
        : "",
    [activeVar]
  );

  let year = useMemo(
    () => (typeof activeVar === "string" ? activeVar.slice(-2) : "10"),
    [activeVar]
  );

  React.useEffect(() => {
    if (!activeVar) {
      setActiveVar("totpop_10");
    }
  }, []);
  console.log(varType, year, activeVar);

  return (
    <div className="flex flex-1 border-blue-100">
      <div className="py-3.5 px-2 text-sm text-gray-400">Variable: </div>
      <div className="flex-1">
        <select
          className="pl-3 pr-4 py-2.5 border border-blue-100 bg-blue-50 w-full bg-white mr-2 flex items-center justify-between text-sm"
          value={varType}
          onChange={(e) => setActiveVar(`${e.target.value}_${year}`)}
        >
          <option className="ml-2  truncate" value={null}>
            none
          </option>
          {Object.keys(sedVars).map((k, i) => (
            <option key={i} className="ml-2  truncate" value={k}>
              {sedVars[k].name}
            </option>
          ))}
        </select>
      </div>

      <div className="py-3.5 px-2 text-sm text-gray-400">Year:</div>
      <div className="">
        <select
          className="pl-3 pr-4 py-2.5 border border-blue-100 bg-blue-50 w-full bg-white mr-2 flex items-center justify-between text-sm"
          value={year}
          onChange={(e) => setActiveVar(`${varType}_${e.target.value}`)}
        >
          {years.map((k, i) => (
            <option key={i} className="ml-2  truncate" value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

const SedChartFilter = ({ source, filters, setFilters }) => {
  let activeVar = useMemo(() => get(filters, "activeVar.value", ""), [filters]);
  let area = useMemo(() => get(filters, "area.value", ""), [filters]);
  let summarize = useMemo(() => get(filters, "summarize.value", ""), [filters]);

  React.useEffect(() => {
    if (!get(filters, "activeVar.value", null)) {
      setFilters({
        ...filters,
        area: { value: "all" },
        activeVar: { value: "totpop" },
        summarize: { value: "county" },
      });
    }
    if (!get(filters, "area.value", null)) {
      setFilters({
        ...filters,
        area: { value: "all" },
        activeVar: { value: "totpop" },
        summarize: { value: "county" },
      });
    }
    if (!get(filters, "summarize.value", null)) {
      setFilters({
        ...filters,
        area: { value: "all" },
        activeVar: { value: "totpop" },
        summarize: { value: "county" },
      });
    }
  }, []);

  return (
    <div className="flex border-blue-100">
      <div className="py-3.5 px-2 text-sm text-gray-400">Area: </div>
      <div className="flex-1" style={{ width: "min-content" }}>
        <select
          className="pl-3 pr-4 py-2.5 border border-blue-100 bg-blue-50 w-full bg-white mr-2 flex items-center justify-between text-sm"
          value={area}
          onChange={(e) =>
            setFilters({
              ...filters,
              area: { value: e.target.value },
              summarize: {
                value: e.target.value === "all" ? summarize : "county",
              },
            })
          }
        >
          <option className="ml-2  truncate" value={"all"}>
            All
          </option>
          {(areas || []).map((area, i) => (
            <option key={i} className="ml-2  truncate" value={area}>
              {area}
            </option>
          ))}
        </select>
      </div>
      <div className="py-3.5 px-2 text-sm text-gray-400">Summarize: </div>
      <div className="flex-1">
        <select
          className="pl-3 pr-4 py-2.5 border border-blue-100 bg-blue-50 w-full bg-white mr-2 flex items-center justify-between text-sm"
          value={summarize}
          onChange={(e) =>
            setFilters({ ...filters, summarize: { value: e.target.value } })
          }
        >
          <option className="ml-2  truncate" value={"county"}>
            county
          </option>
          {area === "all" ? (
            <>
              {Object.keys(summarizeVars).map((k, i) => (
                <option key={i} className="ml-2  truncate" value={k}>
                  {summarizeVars[k]?.name}
                </option>
              ))}
            </>
          ) : null}
        </select>
      </div>
      <div className="py-3.5 px-2 text-sm text-gray-400">Variable: </div>
      <div className="flex-1">
        <select
          className="pl-3 pr-4 py-2.5 border border-blue-100 bg-blue-50 w-full bg-white mr-2 flex items-center justify-between text-sm"
          value={activeVar}
          onChange={(e) =>
            setFilters({ ...filters, activeVar: { value: e.target.value } })
          }
        >
          <option className="ml-2  truncate" value={""}>
            none
          </option>
          {Object.keys(sedVars).map((k, i) => (
            <option key={i} className="ml-2  truncate" value={k}>
              {sedVars[k].name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

const getSelectedArea = (area, groupByTableData) => {
  let selectedGroupByTableData = {};
  if (regionalData?.regions?.hasOwnProperty(area)) {
    regionalData?.regions[area]?.forEach((key) => {
      selectedGroupByTableData[key] = groupByTableData[key];
    });
  } else if (regionalData?.sub_regions?.hasOwnProperty(area)) {
    regionalData?.sub_regions[area]?.forEach((key) => {
      selectedGroupByTableData[key] = groupByTableData[key];
    });
  }
  return selectedGroupByTableData;
};

const SedChartTransform = (tableData, attributes, filters, flag) => {
  let activeVar = get(filters, "activeVar.value", "totpop");
  let summarize = get(filters, "summarize.value", "county");
  let area = get(filters, "area.value", "all");

  const columns = [];
  (years || []).forEach((y) => {
    (columns || []).push({
      Header: `20${y}`,
      accessor: `${activeVar}_${y}`,
    });
  });

  /**
   * GroupBy county_nam
   */
  let groupByTableData = (tableData || []).reduce((g, d) => {
    const { county_nam } = d;
    if (county_nam !== null) {
      g[`${county_nam}`] = g[`${county_nam}`] ?? [];
      g[`${county_nam}`].push(d);
    }
    return g;
  }, {});

  if (area !== "all") {
    groupByTableData = getSelectedArea(area, groupByTableData);
  }

  const getSum = (accessor, summarizeKeys, groupByTableData) => {
    let sum = 0;
    (summarizeKeys || []).forEach((k) => {
      const selectedCounty = groupByTableData[`${k}`] || {};
      sum += Math.floor(sumBy(selectedCounty, `${accessor}`) || 0);
    });
    return sum;
  };

  /**
   * Modify graph data accordingly
   */
  let finalGraphData = new Array(Object.keys(groupByTableData).length).fill({});
  if (flag === "group_by_county") {
    if (summarize !== "county") {
      const keys =
        summarize === "subRegion"
          ? regionalData?.sub_regions
          : regionalData?.regions;
      finalGraphData = new Array(Object.keys(keys).length).fill({});
      finalGraphData = Object.keys(keys).map((key) => ({
        id: key,
        name: key,
        data: (columns || []).map((col) => ({
          x: col?.Header,
          y: getSum(col?.accessor, keys[`${key}`], groupByTableData),
        })),
      }));
    } else {
      finalGraphData = Object.keys(groupByTableData).map((key) => ({
        id: key,
        name: key,
        data: (columns || []).map((col) => ({
          x: col?.Header,
          y: Math.floor(
            sumBy(groupByTableData[`${key}`], `${col.accessor}`) || 0
          ),
        })),
      }));
    }
  }
  /* [
    {
      name: New York County,
      data: [{ 
        x: 15, // year
        y: 35636 //value of totpop_15
      },
      ...
      {
        x:55,
        y: 2346236, //value of totpop_55
      }
      ]
    },
    {
      name: Kings COunty
      data:[
        {///
      ]
    }
  ]
*/
  return {
    data: finalGraphData,
    columns,
  };
};

export { SedChartFilter, SedMapFilter, SedChartTransform };
