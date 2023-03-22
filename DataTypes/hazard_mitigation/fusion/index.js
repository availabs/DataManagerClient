import React, { useEffect, useState } from "react";
import Create from "./create";
import AddVersion from "../../default/AddVersion";
import { useSelector } from "react-redux";
import { selectPgEnv } from "../../../store";
import { useFalcor } from "../../../../../modules/avl-components/src";
import get from "lodash.get";
import { BarGraph } from "../../../../../modules/avl-graph/src";

const fnumIndex = (d) => {
  if (d >= 1000000000) {
    return `${parseInt(d / 1000000000)} B`;
  } else if (d >= 1000000) {
    return `${parseInt(d / 1000000)} M`;
  } else if (d >= 1000) {
    return `${parseInt(d / 1000)} K`;
  } else {
    return `${d}`;
  }
};

const RenderVersions = (domain, value, onchange) => (
  <select
    className={`w-40 pr-4 py-3 bg-white mr-2 flex items-center text-sm`}
    value={value}
    onChange={(e) => onchange(e.target.value)
    }
  >
    {domain.map((v, i) => (
      <option key={i} value={v.view_id} className="ml-2  truncate">{v.version}</option>
    ))}
  </select>
);

const ProcessDataForMap = (data) => React.useMemo(() => {
    const years = [...new Set(data.map(d => d.year))];
    const disaster_numbers = new Set();
    const processed_data = years.map(year => {
        const lossData = data
          .filter(d => d.year === year)
          .reduce((acc, d) => {
              disaster_numbers.add(d.disaster_number);
              return {
                  ...acc, ...{
                      [`${d.disaster_number}_pd`]: d.fusion_property_damage,
                      [`${d.disaster_number}_cd`]: d.fusion_crop_damage
                  }
              }
          }, {});
        return { year, ...lossData };
    });

    return {processed_data, disaster_numbers: [...disaster_numbers]}
}, [data]);

const HoverComp = ({data, keys, indexFormat, keyFormat, valueFormat}) => {
    return (
      <div className={`
      flex flex-col px-2 pt-1 rounded bg-white
      ${keys.length <= 1 ? "pb-2" : "pb-1"}`}>
          <div className="font-bold text-lg leading-6 border-b-2 mb-1 pl-2">
              {indexFormat(get(data, "index", null))}
          </div>
          {keys.slice()
            // .filter(k => get(data, ["data", k], 0) > 0)
            .filter(key => data.key === key)
            .reverse().map(key => (
              <div key={key} className={`
            flex items-center px-2 border-2 rounded transition
            ${data.key === key ? "border-current" : "border-transparent"}
          `}>
                  <div className="mr-2 rounded-sm color-square w-5 h-5"
                       style={{
                           backgroundColor: get(data, ["barValues", key, "color"], null),
                           opacity: data.key === key ? 1 : 0.2
                       }}/>
                  <div className="mr-4">
                      {keyFormat(key)}:
                  </div>
                  <div className="text-right flex-1">
                      {valueFormat(get(data, ["data", key], 0))}
                  </div>
              </div>
            ))
          }
          {keys.length <= 1 ? null :
            <div className="flex pr-2">
                <div className="w-5 mr-2"/>
                <div className="mr-4 pl-2">
                    Total:
                </div>
                <div className="flex-1 text-right">
                    {valueFormat(keys.reduce((a, c) => a + get(data, ["data", c], 0), 0))}
                </div>
            </div>
          }
      </div>
    )
}

const Stats = ({ source, views }) => {
  const pgEnv = useSelector(selectPgEnv);
  const { falcor, falcorCache } = useFalcor();
  const [activeView, setActiveView] = useState(views[0].view_id);
  const [compareView, setCompareView] = useState(views[0].view_id);
  const [compareMode, setCompareMode] = useState(undefined);
  const [ctype, setCtype] = useState('pd');

  useEffect(() => {
    falcor.get(
      ["fusion", pgEnv, "source", source.source_id, "view", [activeView, compareView], "lossByYearByDisasterNumber"]
    );
  }, [activeView, compareView, pgEnv, source.source_id, falcor]);

  const metadataActiveView = get(falcorCache, ["fusion", pgEnv, "source", source.source_id, "view", activeView, "lossByYearByDisasterNumber", "value"], []);
  const metadataCompareView = get(falcorCache, ["ncei_storm_events_enhanced", pgEnv, "source", source.source_id, "view", compareView, "lossByYearByDisasterNumber", "value"], []);
  const { processed_data: chartDataActiveView, disaster_numbers } = ProcessDataForMap(metadataActiveView);

  return (
    <>
      <div key={"versionSelector"}
           className={"flex flex-row items-center py-4 sm:py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"}>
        <label>Current Version: </label>
        {RenderVersions(views, activeView, setActiveView)}
        <button
          className={`${compareMode ? `bg-red-50 hover:bg-red-400` : `bg-blue-100 hover:bg-blue-600`}
                     hover:text-white align-right border-2 border-gray-100 p-2 hover:bg-gray-100`}
          disabled={views.length === 1}
          onClick={() => setCompareMode(!compareMode)}
        >
          {compareMode ? `Discard` : `Compare`}
        </button>
      </div>

      <div key={"compareVersionSelector"}
           className={"flex flex-row items-center py-4 sm:py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"}>
        {compareMode ? <label>Compare with Version: </label> : null}
        {compareMode ? RenderVersions(views, compareView, setCompareView) : null}
      </div>

      {
        !metadataActiveView || metadataActiveView.length === 0 ? <div> Stats Not Available </div> :
          <div className={`w-full p-4 my-1 block flex flex-col`} style={{height: '350px'}}>
              <label key={'nceiLossesTitle'} className={'text-lg'}> Loss by Disaster Number
                  {/*{views.find(v => v.view_id.toString() === activeView.toString()).version}*/}
              </label>
              <BarGraph
                key={"numEvents"}
                data={chartDataActiveView}
                keys={disaster_numbers.map(dn => `${dn}_pd`)}
                indexBy={"year"}
                axisBottom={d => d}
                axisLeft={{ format: fnumIndex, gridLineOpacity: 1, gridLineColor: "#9d9c9c" }}
                paddingInner={0.1}
                // colors={(value, ii, d, key) => ctypeColors[key]}
                hoverComp={{
                    HoverComp: HoverComp,
                    valueFormat: fnumIndex,
                    keyFormat: k => k.replace('_pd', '').replace('_cd', '')
                }}
                groupMode={"stacked"}
              />
          </div>
      }
    </>
  );
};

const NceiStormEventsConfig = {
  add_version: {
    name: "Add Version",
    path: "/add_version",
    component: AddVersion
  },
  stats: {
    name: "Stats",
    path: "/stats",
    component: Stats
  },
  sourceCreate: {
    name: "Create",
    component: Create
  }

};

export default NceiStormEventsConfig;
