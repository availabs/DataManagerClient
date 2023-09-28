import React, { useContext, useMemo, useEffect, useState } from "react";
import {
  get,
  cloneDeep,
  isEqual,
  flattenDeep,
  range,
  uniqBy,
  set,
  unset,
  uniq,
} from "lodash";

import ckmeans from "~/pages/DataManager/utils/ckmeans";
import { getColorRange } from "~/modules/avl-components/src";
import { useFalcor } from "~/modules/avl-components/src";
import { DamaContext } from "~/pages/DataManager/store";
import { DAMA_HOST } from "~/config";

const getTilehost = (DAMA_HOST) =>
  DAMA_HOST === "http://localhost:3369"
    ? "http://localhost:3370"
    : DAMA_HOST + "/tiles";

const TILEHOST = getTilehost(DAMA_HOST);

const ACSMapFilter = ({
  filters,
  setFilters,
  setTempSymbology,
  tempSymbology,
  activeView,
  activeViewId,
}) => {
  const { pgEnv } = useContext(DamaContext);
  const { falcor, falcorCache } = useFalcor();
  const [subGeoids, setSubGeoIds] = useState([]);

  const max = new Date().getUTCFullYear();
  const yearRange = range(2010, max + 1);

  const [activeVar, geometry, year] = useMemo(() => {
    return [
      filters?.activeVar?.value,
      filters?.geometry?.value || "county",
      filters?.year?.value || 2019,
    ];
  }, [filters]);

  const viewYear = useMemo(() => year - (year % 10), [year]);
  const activeLayerId = useMemo(
    () => `${geometry}_${viewYear}`,
    [geometry, viewYear]
  );

  const metaYears = useMemo(
    () => get(activeView, "metadata.years", []).sort(),
    [activeView]
  );
  let { counties = [], variables = [] } = useMemo(
    () => get(activeView, "metadata", {}),
    [activeView, activeViewId]
  );

  const [censusConfig, divisorKeys] = useMemo(
    () => [
      (((variables || []).find((d) => d.label === activeVar) || {}).value || {})
        .censusKeys || [],
      (((variables || []).find((d) => d.label === activeVar) || {}).value || {})
        .divisorKeys || [],
    ],
    [activeVar, variables]
  );

  if (!activeVar) {
    setFilters({
      ...filters,
      activeVar: { value: variables[0]?.label || null },
    });
  }

  useEffect(() => {
    async function getViewData() {
      await falcor.get([
        "dama",
        pgEnv,
        "views",
        "byId",
        activeView?.view_dependencies,
        "attributes",
        "metadata",
      ]);
    }
    getViewData();
  }, [pgEnv, activeViewId, activeView]);

  // ------ Updated -------

  // const subGeoids = React.useMemo(async () => {
  //   async function getViewData() {
  //     falcor
  //       .get([
  //         "dama",
  //         [pgEnv],
  //         "tiger",
  //         activeView?.view_dependencies,
  //         counties.map(String),
  //         [viewYear],
  //         ["tracts"],
  //       ])
  //       .then(() => {
  //         const d = (counties || []).reduce((a, c) => {
  //           a.push(
  //             ...get(
  //               falcorCache,
  //               [
  //                 "dama",
  //                 pgEnv,
  //                 "tiger",
  //                 activeView?.view_dependencies[0],
  //                 c,
  //                 viewYear,
  //                 "tracts",
  //                 "value",
  //               ],
  //               []
  //             )
  //           );
  //           return a;
  //         }, []);
  //         return uniq(d);
  //       });
  //   }
  //   return await getViewData();
  // }, [falcorCache, pgEnv, activeViewId, activeView, counties, viewYear]);

  // ------ Updated -------

  useEffect(() => {
    async function getViewData() {
      falcor
        .get([
          "dama",
          [pgEnv],
          "tiger",
          activeView?.view_dependencies,
          counties.map(String),
          [viewYear],
          ["tracts"],
        ])
        .then(() => {
          const d = (counties || []).reduce((a, c) => {
            a.push(
              ...get(
                falcorCache,
                [
                  "dama",
                  pgEnv,
                  "tiger",
                  activeView?.view_dependencies[0],
                  c,
                  viewYear,
                  "tracts",
                  "value",
                ],
                []
              )
            );
            return a;
          }, []);
          setSubGeoIds(uniq(d));
        });
    }
    getViewData();
  }, [falcorCache, pgEnv, activeViewId, activeView, counties, viewYear]);

  useEffect(() => {
    const newSymbology = cloneDeep(tempSymbology || {});
    (activeView?.view_dependencies || []).forEach((v) => {
      let { sources, layers } = get(
        get(falcorCache, ["dama", pgEnv, "views", "byId", v, "attributes"], {}),
        ["metadata", "value", "tiles"],
        {}
      );

      if (sources && sources.length) {
        (sources || []).forEach((s) => {
          if (s && s.source)
            s.source.url = s?.source?.url?.replace("$HOST", TILEHOST);
        });
      }

      if (!newSymbology.hasOwnProperty("sources")) {
        newSymbology["sources"] = sources || [];
      } else {
        if (sources) newSymbology["sources"].push(flattenDeep(sources));
      }

      if (!newSymbology.hasOwnProperty("layers")) {
        newSymbology["layers"] = layers || [];
      } else {
        if (layers) newSymbology["layers"].push(flattenDeep(layers));
      }
    });

    newSymbology["sources"] = uniqBy(
      flattenDeep(newSymbology["sources"]),
      "id"
    );
    newSymbology["layers"] = uniqBy(flattenDeep(newSymbology["layers"]), "id");
    if (!isEqual(tempSymbology, newSymbology)) {
      setTempSymbology(newSymbology);
    }
  }, [falcorCache, pgEnv, activeViewId, activeView]);

  useEffect(() => {
    async function getACSData() {
      const geoids = geometry === "county" ? counties : subGeoids;
      if (geoids.length > 0) {
        falcor.chunk(["acs", geoids, year, [...censusConfig, ...divisorKeys]]);
      }
    }
    getACSData();
  }, [counties, subGeoids, censusConfig, divisorKeys, year, geometry]);

  useEffect(() => {
    let geoids;
    let activeLayer = (tempSymbology["layers"] || []).find(
      (v) => v.id === activeLayerId
    );

    if (geometry === "county") geoids = counties;
    else if (geometry === "tract") geoids = subGeoids;

    // -------- OLD --------
    // const valueMap = (geoids || []).reduce((a, c) => {
    //   let value = (censusConfig || []).reduce((aa, cc) => {
    //     const v = get(falcorCache, ["acs", c, year, cc], -666666666);
    //     if (v !== -666666666) {
    //       aa += v;
    //     }
    //     return aa;
    //   }, 0);
    //   a[c] = value;
    //   return a;
    // }, {});
    // -------- OLD --------

    // -------- NEW --------
    const valueMap = (geoids || []).reduce((a, c) => {
      let censusVal = 0,
        divisorVal = 0,
        censusFlag = false,
        divisorFalg = false;
      (censusConfig || []).forEach((cc) => {
        const tmpVal = get(falcorCache, ["acs", c, year, cc], null);
        if (tmpVal !== null) {
          censusFlag = true;
          censusVal += tmpVal;
        }
      });

      let tempFlag = Boolean(divisorKeys.length);

      if (tempFlag) {
        if (divisorKeys.length > 0) {
          (divisorKeys || []).forEach((cc) => {
            const tmpVal = get(falcorCache, ["acs", c, year, cc], null);
            if (tmpVal !== null) {
              divisorFalg = true;
              divisorVal += tmpVal;
            }
          });
        }
      }

      if (tempFlag) {
        a[c] = divisorFalg ? Math.round((censusVal / divisorVal) * 100) : null;
      } else {
        a[c] = censusFlag ? censusVal : null;
      }
      return a;
    }, {});
    // -------- NEW --------

    const ckmeansLen = Math.min((Object.values(valueMap) || []).length, 5);
    const values = Object.values(valueMap || {});
    let domain = [0, 10, 25, 50, 75, 100];
    if (ckmeansLen <= values.length) {
      domain = ckmeans(values, ckmeansLen) || [];
    }
    const range = getColorRange(5, "YlOrRd", false);

    if (!(domain && domain?.length > 5)) {
      const n = domain?.length || 0;
      for (let i = n; i < 5; i++) {
        domain.push(domain[i - 1] || 0);
      }
    }

    function colorScale(domain, value) {
      let color = "rgba(0,0,0,0)";
      (domain || []).forEach((v, i) => {
        if (value >= v && value <= domain[i + 1]) {
          color = range[i];
        }
      });
      return color;
    }

    const colors = {};
    Object.keys(valueMap).forEach((geoid) => {
      colors[geoid] = colorScale(domain, valueMap[geoid]);
    });

    let output = [
      "case",
      ["has", ["to-string", ["get", "geoid"]], ["literal", colors]],
      ["get", ["to-string", ["get", "geoid"]], ["literal", colors]],
      "rgba(0,0,0,0.0)",
    ];

    let newSymbology = Object.assign({}, cloneDeep(tempSymbology));
    if (activeVar && activeLayer) {
      (newSymbology?.layers || []).forEach((l) => {
        unset(newSymbology, `${l?.id}`);
        // set(newSymbology, `${l?.id}.visibility.default.value`, "none");
        set(newSymbology, `${l?.id}.fill-color.default.value`, "rgba(0,0,0,0)");
        // set(newSymbology, `${l?.id}.visibility.default.`, "none");
      });

      set(newSymbology, `${activeLayer.id}.fill-color.${activeVar}`, {
        type: "threshold",
        settings: {
          range: range,
          domain: domain,
          title: activeVar,
        },
        value: output,
      });
      unset(newSymbology, `${activeLayer.id}.layout`);
    }
    if (!isEqual(tempSymbology, newSymbology)) {
      setTempSymbology(newSymbology);
    }
  }, [
    tempSymbology,
    activeLayerId,
    activeViewId,
    censusConfig,
    divisorKeys,
    falcorCache,
    activeView,
    subGeoids,
    activeVar,
    geometry,
    year,
  ]);

  return (
    <div className="flex flex-1 border-blue-100">
      <div className="py-3.5 px-2 text-sm text-gray-400">Variable: </div>
      <div className="flex-1">
        <select
          className="pl-3 pr-4 py-2.5 border border-blue-100 bg-blue-50 w-full bg-white mr-2 flex items-center justify-between text-sm"
          value={activeVar}
          onChange={(e) => {
            setFilters({
              ...filters,
              activeVar: { value: `${e.target.value}` },
            });
          }}
        >
          {(variables || []).map((k, i) => (
            <option key={i} className="ml-2 truncate" value={k?.label}>
              {k?.label}
            </option>
          ))}
        </select>
      </div>

      <div className="py-3.5 px-2 text-sm text-gray-400">Type: </div>
      <div className="flex-1">
        <select
          className="pl-3 pr-4 py-2.5 border border-blue-100 bg-blue-50 w-full bg-white mr-2 flex items-center justify-between text-sm"
          value={geometry}
          onChange={(e) => {
            setFilters({
              ...filters,
              geometry: {
                value: `${e.target.value}`,
              },
            });
          }}
        >
          {["county", "tract"].map((v, i) => (
            <option key={i} className="ml-2 truncate" value={v}>
              {v?.toUpperCase()}
            </option>
          ))}
        </select>
      </div>
      <div className="py-3.5 px-2 text-sm text-gray-400">Year:</div>
      <div className="">
        <select
          className="pl-3 pr-4 py-2.5 border border-blue-100 bg-blue-50 w-full bg-white mr-2 flex items-center justify-between text-sm"
          value={year}
          onChange={(e) => {
            setFilters({
              ...filters,
              year: {
                value: `${e.target.value}`,
              },
            });
          }}
        >
          {(metaYears || []).map((k, i) => (
            <option key={i} className="ml-2 truncate" value={k}>
              {`${k}`}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ACSMapFilter;
