import React, { useMemo, useState } from "react";

import { Select } from "modules/avl-components/src";
import { LineGraph } from "modules/avl-graph/src";

const availableStats = [
  "total_tmcs",
  "total_miles",
  "avg_pct_epochs_reporting",
  "median_pct_epochs_reporting",
  "max_pct_epochs_reporting",
  "min_pct_epochs_reporting",
  "var_pct_epochs_reporting",
  "stddev_pct_epochs_reporting",
];

const Stats = ({ source }) => {
  const [state, setState] = useState("ny");
  const [stat, setStat] = useState("total_tmcs");

  const availableStates = Object.keys(source.statistics).sort();
  const selectedStats = source.statistics[state];

  const lineData = useMemo(() => {
    const d = {};

    const yrmos = Object.keys(selectedStats).sort();

    for (const yrmo of yrmos) {
      const frcs = Object.keys(selectedStats[yrmo]);

      for (const frc of frcs) {
        const y =
          stat === "median_pct_epochs_reporting"
            ? selectedStats[yrmo][frc].quartiles_pct_epochs_reporting[1]
            : selectedStats[yrmo][frc][stat];

        d[frc] = d[frc] || [];
        d[frc].push({
          x: yrmo,
          y,
        });
      }
    }

    return Object.keys(d).map((frc) => ({
      id: frc,
      data: d[frc],
    }));
  }, [selectedStats, stat]);

  return (
    <div>
      <h4>Stats View</h4>

      <Select
        options={availableStates}
        onChange={(state) => setState(state)}
        value={state}
        multi={false}
        removable={false}
        searchable={false}
      />

      <Select
        options={availableStats}
        onChange={(stat) => setStat(stat)}
        value={stat}
        multi={false}
        removable={false}
        searchable={false}
      />

      <div className="bg-white rounded relative" style={{ height: "30rem" }}>
        <LineGraph
          data={lineData}
          margin={{ right: 25 }}
          padding={0}
          axisLeft={true}
          axisBottom={true}
          hoverComp={{ yFormat: ",.2f" }}
        />
      </div>
    </div>
  );
};

const NpmrdsTravelTimeConfig = {
  stats: {
    name: "Stats",
    path: "/stats",
    component: Stats,
  },
};

export default NpmrdsTravelTimeConfig;
