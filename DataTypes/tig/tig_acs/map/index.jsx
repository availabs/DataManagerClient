import React, { useMemo, useEffect, useState } from "react";
import {
  get,
  cloneDeep,
  isEqual,
  flattenDeep,
  range,
  uniqBy,
  set,
} from "lodash";

import ckmeans from "../../../../utils/ckmeans";
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
  const [subGeoids, setSubGeoIds] = useState([]);
  const { falcor, falcorCache } = useFalcor();
  const { pgEnv } = React.useContext(DamaContext);
  const max = new Date().getUTCFullYear();
  const yearRange = range(2010, max + 1);

  const [activeVar, geometry, year] = useMemo(() => {
    return [
      filters?.activeVar?.value,
      filters?.geometry?.value || "COUNTY",
      filters?.year?.value || 2019,
    ];
  }, [filters]);

  const viewYear = useMemo(() => year - (year % 10), [year]);

  const {
    counties = [],
    variables = [],
    customDependency = {},
  } = useMemo(
    () => get(activeView, "metadata", {}),
    [activeView, activeViewId]
  );

  const [countyViewId, trackViewIds] = useMemo(() => {
    const uniqueTrackIds = Object.values(customDependency).reduce(
      (ids, cur) => {
        if (!ids.includes(cur.id)) {
          (ids || []).push(cur.id);
        }
        return ids;
      },
      []
    );
    const countyViewId =
      (activeView?.view_dependencies || []).find(
        (v_id) => !uniqueTrackIds.includes(v_id)
      ) || null;
    return [countyViewId, uniqueTrackIds];
  }, [activeView, activeViewId]);

  const censusConfig = useMemo(
    () =>
      ((variables || []).find((d) => d.label === activeVar) || {}).value || [],
    [activeVar, variables]
  );

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
  }, [pgEnv, geometry, activeViewId, activeView]);

  useEffect(() => {
    async function getViewData() {
      await falcor
        .get(["geo", counties.map(String), [year], "tracts"])
        .then(() => {
          const d = (counties || []).reduce((a, c) => {
            a.push(
              ...get(falcorCache, ["geo", c, year, "tracts", "value"], [])
            );
            return a;
          }, []);
          setSubGeoIds(d);
          falcor.chunk(["acs", subGeoids, year, "tracts"]);
        });
    }

    getViewData();
  }, [counties, year]);

  // /**
  //  * This is depends on the Delected view...
  //  */
  // useEffect(() => {
  //   let rawView = get(
  //     falcorCache,
  //     [
  //       "dama",
  //       pgEnv,
  //       "views",
  //       "byId",
  //       activeView?.view_dependencies[0],
  //       "attributes",
  //     ],
  //     {}
  //   );

  //   const ogcFids = Object.values(mapGeoToOgc);
  //   let { sources, layers } = get(rawView, ["metadata", "value", "tiles"], {});

  //   const newSymbology = cloneDeep(tempSymbology || {}) || {
  //     sources: sources || [],
  //     layers: layers || [],
  //   };

  //   (sources || []).forEach(
  //     (s) => (s.source.url = s?.source?.url?.replace("$HOST", TILEHOST))
  //   );

  //   if (!newSymbology.hasOwnProperty("sources")) {
  //     newSymbology["sources"] = sources || [];
  //   }
  //   if (!newSymbology.hasOwnProperty("layers")) {
  //     newSymbology["layers"] = layers || [];
  //   }

  //   if (layers && layers[0]) {
  //     layers[0].filter = [
  //       "all",
  //       ["match", ["get", "ogc_fid"], [...ogcFids], true, false],
  //     ];
  //     newSymbology["layers"] = layers;
  //   }

  //   setTempSymbology(newSymbology);
  // }, [falcorCache, pgEnv, activeViewId, activeView]);

  useEffect(() => {
    const newSymbology = cloneDeep(tempSymbology || {});
    (activeView?.view_dependencies || []).forEach((v) => {
      const rawView = get(
        falcorCache,
        ["dama", pgEnv, "views", "byId", v, "attributes"],
        {}
      );

      let { sources, layers } = get(
        rawView,
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

    setTempSymbology(newSymbology);
  }, [falcorCache, pgEnv, activeViewId, activeView]);

  useEffect(() => {
    async function getACSData() {
      await falcor.get(["acs", [...counties], year, censusConfig]);
    }
    getACSData();
  }, [counties, censusConfig, year, geometry]);

  // useEffect(() => {
  //   const valueMap = (counties || []).reduce((a, c) => {
  //     let value = (censusConfig || []).reduce((aa, cc) => {
  //       const v = get(falcorCache, ["acs", c, 2019, cc], -666666666);
  //       if (v !== -666666666) {
  //         aa += v;
  //       }
  //       return aa;
  //     }, 0);
  //     a[c] = value;
  //     return a;
  //   }, {});

  //   const domain =
  //     ckmeans(Object.values(valueMap), Math.min(counties.length - 1, 5)) || [];
  //   const range = getColorRange(5, "YlOrRd", false);

  //   function colorScale(domain, value) {
  //     let color = "rgba(0,0,0,0)";
  //     domain.forEach((v, i) => {
  //       if (value >= v && value <= domain[i + 1]) {
  //         color = range[i];
  //       }
  //     });
  //     return color;
  //   }

  //   const colors = {};
  //   Object.keys(valueMap).forEach((geoid) => {
  //     colors[mapGeoToOgc[geoid]] = colorScale(domain, valueMap[geoid]);
  //   });

  //   let output = [
  //     "case",
  //     ["has", ["to-string", ["get", "ogc_fid"]], ["literal", colors]],
  //     ["get", ["to-string", ["get", "ogc_fid"]], ["literal", colors]],
  //     "#000",
  //   ];

  //   let newSymbology = Object.assign({}, cloneDeep(tempSymbology), {
  //     "fill-color": {},
  //   });

  //   if (!newSymbology.hasOwnProperty("fill-color")) {
  //     newSymbology["fill-color"] = {};
  //   }

  //   if (activeVar) {
  //     newSymbology["fill-color"][activeVar] = {
  //       type: "scale-threshold",
  //       settings: {
  //         range: range,
  //         domain: domain,
  //         title: variable,
  //       },
  //       value: output,
  //     };
  //   }

  //   if (!isEqual(tempSymbology, newSymbology)) {
  //     setTempSymbology(newSymbology);
  //   }
  // }, [variable, falcorCache, mapGeoToOgc]);

  function extractIntegerAfterV(str) {
    const match = str.match(/v(\d+)/);

    if (match && match[1]) {
      return parseInt(match[1], 10);
    }

    return null;
  }

  useEffect(() => {
    let activeLayer;
    if (geometry === "COUNTY") {
      activeLayer = (tempSymbology["layers"] || []).find(
        (v) => countyViewId === extractIntegerAfterV(v?.id)
      );
    } else if (geometry === "TRACT") {
      const selectedView = customDependency[`${viewYear}`];
      activeLayer = (tempSymbology["layers"] || []).find(
        (v) => selectedView.id === extractIntegerAfterV(v?.id)
      );
    }

    const valueMap = (counties || []).reduce((a, c) => {
      let value = (censusConfig || []).reduce((aa, cc) => {
        const v = get(falcorCache, ["acs", c, year, cc], -666666666);
        if (v !== -666666666) {
          aa += v;
        }
        return aa;
      }, 0);
      a[c] = value;
      return a;
    }, {});

    const domain =
      ckmeans(Object.values(valueMap), Math.min(counties.length - 1, 5)) || [];
    const range = getColorRange(5, "YlOrRd", false);

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
      "rgba(0,0,0,0)",
    ];

    let newSymbology = Object.assign({}, cloneDeep(tempSymbology));

    if (activeVar && activeLayer) {
      (newSymbology?.layers || []).forEach((l) => {
        set(newSymbology, `${l?.id}.fill-color.${activeVar}`, {
          value: "rgba(0,0,0,0)",
        });
      });

      newSymbology[activeLayer.id]["fill-color"][activeVar] = {
        type: "scale-threshold",
        settings: {
          range: range,
          domain: domain,
          title: activeVar,
        },
        value: output,
      };
    }

    if (!isEqual(tempSymbology, newSymbology)) {
      setTempSymbology(newSymbology);
    }
  }, [activeVar, falcorCache, geometry, year, tempSymbology]);

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
          <option className="ml-2  truncate" value={null}>
            none
          </option>
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
          {["COUNTY", "TRACT"].map((v, i) => (
            <option key={i} className="ml-2  truncate" value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {(Object.keys(customDependency) || []).length ? (
        <>
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
              {(yearRange || []).map((k, i) => (
                <option key={i} className="ml-2 truncate" value={k}>
                  {`${k}`}
                </option>
              ))}
            </select>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default ACSMapFilter;
