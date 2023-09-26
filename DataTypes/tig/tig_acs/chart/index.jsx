import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { get } from "lodash";

import { DamaContext } from "~/pages/DataManager/store";
import { ResponsiveBar } from "@nivo/bar";
import { fips2Name, regionalData } from "./../../constants/index";

const ViewSelector = ({ views }) => {
  const { viewId } = useParams();

  return (
    <div className="flex flex-1">
      <div className="py-3.5 px-2 text-sm text-gray-400">Version : </div>
      <div className="flex-1">
        <select
          className="pl-3 pr-4 py-2.5 border border-blue-100 bg-blue-50 w-full bg-white mr-2 flex items-center justify-between text-sm"
          value={viewId}
        >
          {views
            .sort((a, b) => b.view_id - a.view_id)
            .map((v, i) => (
              <option key={i} className="ml-2  truncate" value={v.view_id}>
                {v.version ? v.version : v.view_id}
              </option>
            ))}
        </select>
      </div>
    </div>
  );
};

const ChartPage = ({
  views,
  transform = () => null,
  filterData = {},
  ChartFilter = <div />,
}) => {
  const { viewId } = useParams();
  const { falcor, falcorCache } = React.useContext(DamaContext);
  const [filters, _setFilters] = useState(filterData);
  const setFilters = useCallback((filters) => {
    _setFilters((prev) => ({ ...prev, ...filters }));
  }, []);

  const activeView = useMemo(() => {
    return get(
      views.filter((d) => d.view_id === viewId),
      "[0]",
      views[0]
    );
  }, [views, viewId]);

  const [variables, years] = useMemo(() => {
    return [
      get(activeView, "metadata.variables", []),
      get(activeView, "metadata.years", []),
    ];
  }, [activeView]);

  const geoids = useMemo(
    () => get(activeView, "metadata.counties", []),
    [activeView]
  );

  const [activeCensusKeys, activeDivisorKeys] = useMemo(
    () => [
      (variables.find((v) => v.label === filters?.activeVar?.value || "") || {})
        ?.value?.censusKeys || [],
      (
        (
          variables.find((v) => v.label === filters?.activeVar?.value || "") ||
          {}
        )?.value?.divisorKeys || []
      ).filter(Boolean),
    ],
    [(variables, filters)]
  );

  const [activeYear, area, summarize] = useMemo(
    () => [
      get(filters, "year.value", "2019"),
      get(filters, "area.value", "all"),
      get(filters, "summarize.value", "county"),
    ],
    [filters]
  );

  useEffect(() => {
    async function getACSData() {
      if (geoids.length > 0)
        falcor.chunk(["acs", geoids, activeYear, [...activeCensusKeys, ...activeDivisorKeys]]);
    }
    getACSData();
  }, [geoids, activeCensusKeys, activeYear]);

  const valueMap = useMemo(() => {
    const geos = Object.keys(fips2Name) || geoids || [];
    return (geos || []).reduce((a, c) => {
      let censusVal = 0,
        divisorVal = 0,
        censusFlag = false,
        divisorFalg = false;
      (activeCensusKeys || []).forEach((cc) => {
        const tmpVal = get(falcorCache, ["acs", c, activeYear, cc], null);
        if (tmpVal !== null) {
          censusFlag = true;
          censusVal += tmpVal;
        }
      });

      let tempFlag = Boolean(activeDivisorKeys.length);

      if (tempFlag) {
        if (activeDivisorKeys.length > 0) {
          (activeDivisorKeys || []).forEach((cc) => {
            const tmpVal = get(falcorCache, ["acs", c, activeYear, cc], null);
            if (tmpVal !== null) {
              divisorFalg = true;
              divisorVal += tmpVal;
            }
          });
        }
      }

      if (tempFlag) {
        a[c] = divisorFalg
          ? `${Math.round((censusVal / divisorVal) * 100)}`
          : null;
      } else {
        a[c] = censusFlag ? censusVal : null;
      }
      return a;
    }, {});
  }, [falcorCache, geoids, activeCensusKeys, activeDivisorKeys, activeYear]);

  let { data } = useMemo(
    () => transform({ valueMap, filters, isDivisor: Boolean(activeDivisorKeys.length) }),
    [valueMap, transform, filters]
  );
  return (
    <div>
      <div className="flex">
        <ChartFilter
          filters={filters}
          setFilters={setFilters}
          variables={variables}
          years={(years||[]).sort()}
        />
        <ViewSelector views={views} />
      </div>
      <div style={{ height: "600px" }}>
        <ResponsiveBar
          data={data}
          keys={["value"]}
          indexBy="id"
          margin={{ top: 20, right: 60, bottom: 50, left: 100 }}
          pixelRatio={2}
          padding={0.15}
          innerPadding={0}
          minValue="auto"
          maxValue="auto"
          groupMode="stacked"
          layout="horizontal"
          reverse={false}
          valueScale={{ type: "linear" }}
          indexScale={{ type: "band", round: true }}
          colors={{ scheme: "category10" }}
          borderColor={{
            from: "color",
            modifiers: [
              ["darker", 0.6],
              ["opacity", 0.5],
            ],
          }}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: filters?.activeVar?.value,
            legendPosition: "middle",
            legendOffset: 36,
          }}
          enableGridX={true}
          enableGridY={false}
          enableLabel={true}
          labelSkipWidth={12}
          labelSkipHeight={12}
          labelTextColor={{
            from: "color",
            modifiers: [["darker", 1.6]],
          }}
          isInteractive={true}
          legends={[]}
        />
      </div>
    </div>
  );
};

export default ChartPage;
