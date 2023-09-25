import React, { useMemo, useEffect } from "react";
import { get, find, filter } from "lodash";
import { DamaContext } from "~/pages/DataManager/store";

const typeToLength = {
  state: 2,
  county: 5,
  place: 7,
  cousub: 10,
  tract: 11,
  blockgroup: 12,
};
var TEMPGEOID = "";
const ACSHoverComp = ({ data, layer }) => {
  const { falcor, falcorCache } = React.useContext(DamaContext);
  const {
    props: {
      filters,
      activeView: {
        metadata: { variables },
      },
    },
  } = layer;

  //console.log('hover', layer)

  const lId = data && data[1];

  const activeVar = useMemo(
    () => get(filters, "activeVar.value", ""),
    [filters]
  );
  const year = useMemo(() => get(filters, "year.value", "2019"), [filters]);
  const geometry = useMemo(
    () => get(filters, "geometry.value", "county"),
    [filters]
  );
  const activeLayerId = useMemo(
    () => `${geometry}_${year - (year % 10)}`,
    [geometry, year]
  );

  if (lId === activeLayerId) {
    TEMPGEOID = ((data && data[2]) || {}).geoid;
  } else {
    return "";
  }
  let geoid = TEMPGEOID;

  const censusConfig = get(
    find(variables, { label: activeVar }),
    "value.censusKeys",
    null
  );

  const divisorConfig = filter(
    get(find(variables, { label: activeVar }), "value.divisorKeys", null),
    Boolean
  );

  const isDivisor = useMemo(
    () => Boolean(divisorConfig && divisorConfig.length),
    [divisorConfig]
  );

  geoid = geoid.slice(0, typeToLength[`${geometry}`]);
  useEffect(() => {
    async function getACSData() {
      falcor.chunk(["acs", geoid, year, censusConfig]);
    }
    getACSData();
  }, [geoid, censusConfig, year, geometry]);

  const value = useMemo(
    () =>
      (censusConfig || []).reduce((aa, cc) => {
        const v = get(falcorCache, ["acs", geoid, year, cc], -666666666);
        if (v !== -666666666) {
          aa += v;
        }
        return aa;
      }, 0),
    [falcorCache, censusConfig, geoid, year]
  );

  const divisorValue = useMemo(
    () =>
      (divisorConfig || []).reduce((aa, cc) => {
        const v = get(falcorCache, ["acs", geoid, year, cc], -666666666);
        if (v !== -666666666) {
          aa += v;
        }
        return aa;
      }, 0),
    [falcorCache, divisorConfig, geoid, year]
  );

  return (
    <div className="bg-white p-4 max-h-64 scrollbar-xs overflow-y-scroll">
      <div className="flex border-b pt-1">
        <div className="flex-1 font-medium text-sm pl-1">{"geoid"}</div>
        <div className="flex-1 text-right font-thin pl-4 pr-1">{geoid}</div>
      </div>

      <div className="flex border-t pt-1">
        <div className="flex-1 font-medium text-sm pl-1">{activeVar}</div>
        <div className="flex-1 text-right font-thin pl-4 pr-1">
          {isDivisor && divisorValue !== 0
            ? `${(value / divisorValue).toFixed(2) * 100}%`
            : value}
        </div>
      </div>
    </div>
  );
};

export { ACSHoverComp };
