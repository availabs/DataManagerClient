import React, { useMemo, useEffect } from "react";
import { ckmeans } from "simple-statistics";
import { getColorRange } from "~/modules/avl-components/src";
import { useFalcor } from "~/modules/avl-components/src";
import { DamaContext } from "~/pages/DataManager/store";
import { get, cloneDeep, isEqual } from "lodash";

import { DAMA_HOST } from "~/config";

const getTilehost = (DAMA_HOST) =>
  DAMA_HOST === "http://localhost:3369"
    ? "http://localhost:3370"
    : DAMA_HOST + "/tiles";

const TILEHOST = getTilehost(DAMA_HOST);

const ACSMapFilter = ({
  source,
  metaData,
  filters,
  setFilters,
  setTempSymbology,
  tempSymbology,
  activeView,
  activeViewId,
}) => {
  const { falcor, falcorCache } = useFalcor();
  const { pgEnv } = React.useContext(DamaContext);
  let activeVar = useMemo(() => get(filters, "activeVar.value", ""), [filters]);

  const { counties, variables } = useMemo(() => {
    return get(activeView, "metadata", {});
  }, [activeView, activeViewId]);

  const censusConfig = useMemo(() => {
    return (
      ((variables || []).find((d) => d.label === activeVar) || {}).value || []
    );
  }, [activeVar, variables]);

  const mapGeoToOgc = useMemo(() => {
    let d = get(
      falcorCache,
      [
        "dama",
        pgEnv,
        "viewsbyId",
        activeView?.view_dependencies[0],
        "options",
        JSON.stringify({
          filter: { geoid: counties },
        }),
        "databyIndex",
      ],
      {}
    );

    return (Object.values(d) || []).reduce((acc, cur) => {
      return Object.assign({}, acc, { [cur?.geoid]: cur?.ogc_fid });
    }, {});
  }, [falcorCache, pgEnv, activeViewId, activeView]);

  console.log("counties", counties);
  console.log("mapGeoToOgc", mapGeoToOgc);

  useEffect(() => {
    async function getViewData() {
      await falcor.get([
        "dama",
        pgEnv,
        "views",
        "byId",
        [activeView?.view_dependencies[0]],
        "attributes",
        "metadata",
      ]);

      await falcor.get([
        "dama",
        pgEnv,
        "viewsbyId",
        [activeView?.view_dependencies[0]],
        "options",
        JSON.stringify({
          filter: { geoid: [...counties] },
        }),
        "databyIndex",
        { from: 0, to: counties.length - 1 },
        ["geoid", "ogc_fid"],
      ]);
    }

    getViewData();
  }, [pgEnv, activeViewId, activeView]);

  useEffect(() => {
    let rawView = get(
      falcorCache,
      [
        "dama",
        pgEnv,
        "views",
        "byId",
        activeView?.view_dependencies[0],
        "attributes",
      ],
      {}
    );

    const ogcFids = Object.values(mapGeoToOgc);

    let { sources, layers } = get(rawView, ["metadata", "value", "tiles"], {});

    const newSymbology = cloneDeep(tempSymbology || {}) || {
      sources: sources || [],
      layers: layers || [],
    };

    (sources || []).forEach(
      (s) => (s.source.url = s?.source?.url?.replace("$HOST", TILEHOST))
    );

    if (!newSymbology.hasOwnProperty("sources")) {
      newSymbology["sources"] = sources || [];
    }
    if (!newSymbology.hasOwnProperty("layers")) {
      newSymbology["layers"] = layers || [];
    }

    if (layers && layers[0]) {
      layers[0].filter = [
        "all",
        ["match", ["get", "ogc_fid"], [...ogcFids], true, false],
      ];
      newSymbology["layers"] = layers;
    }

    setTempSymbology(newSymbology);
  }, [falcorCache, pgEnv, activeViewId, activeView]);

  useEffect(() => {
    async function getACSData() {
      await falcor.get(["acs", [...counties], 2019, censusConfig]);
    }
    getACSData();
  }, [activeVar, counties, censusConfig]);

  useEffect(() => {
    const valueMap = (counties || []).reduce((a, c) => {
      let value = (censusConfig || []).reduce((aa, cc) => {
        const v = get(falcorCache, ["acs", c, 2019, cc], -666666666);
        if (v !== -666666666) {
          aa += v;
        }
        return aa;
      }, 0);
      a[c] = value;
      return a;
    }, {});

    console.log("valueMap\n\n", valueMap);
    const domain = (
      ckmeans(Object.values(valueMap), Math.min(counties.length - 1, 5)) || []
    ).reduce((acc, d, dI) => {
      if (dI === 0) {
        acc.push(d[0], d[d.length - 1]);
      } else {
        acc.push(d[d.length - 1]);
      }
      return acc;
    }, []);

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
      colors[mapGeoToOgc[geoid]] = colorScale(domain, valueMap[geoid]);
    });

    let output = [
      "case",
      ["has", ["to-string", ["get", "ogc_fid"]], ["literal", colors]],
      ["get", ["to-string", ["get", "ogc_fid"]], ["literal", colors]],
      "#000",
    ];

    let newSymbology = Object.assign({}, cloneDeep(tempSymbology), {
      "fill-color": {},
    });
    if (!newSymbology.hasOwnProperty("fill-color")) {
      newSymbology["fill-color"] = {};
    }
    if (activeVar) {
      newSymbology["fill-color"][activeVar] = {
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
  }, [activeVar, falcorCache, mapGeoToOgc]);

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
            <option key={i} className="ml-2  truncate" value={k?.label}>
              {k?.label}
            </option>
          ))}
        </select>
      </div>

      {/* <div className="py-3.5 px-2 text-sm text-gray-400">Year:</div>
      <div className="">
        <select
          className="pl-3 pr-4 py-2.5 border border-blue-100 bg-blue-50 w-full bg-white mr-2 flex items-center justify-between text-sm"
          value={year}
          onChange={(e) =>
            setFilters({
              ...filters,
              activeVar: { value: `${varType}_${e.target.value}` },
            })
          }
        >
          {(metaData?.years || ["2010"]).map((k, i) => (
            <option key={i} className="ml-2  truncate" value={i}>
              {k}
            </option>
          ))}
        </select>
      </div> */}
    </div>
  );
};

export default ACSMapFilter;
