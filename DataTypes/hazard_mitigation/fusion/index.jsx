import React, { useEffect, useState } from "react";
import Create from "./create";

import { DamaContext } from "../../../store";
import { Table, useFalcor } from "../../../../../modules/avl-components/src";
import get from "lodash/get";
import { BarGraph } from "../../../../../modules/avl-graph/src";
import { fnum, fnumIndex } from "../../../utils/macros"


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
  const disaster_numbers = new Set(['swd']);
  const swdTotal = {swd_tpd: 0, swd_tcd: 0, swd_ttd: 0};
  const ofdTotal = {ofd_tpd: 0, ofd_tcd: 0, ofd_ttd: 0};

  const processed_data = years.map(year => {
    const swdTotalPerYear = {swd_pd: 0, swd_cd: 0, swd_td: 0};
    const ofdTotalPerYear = {ofd_pd: 0, ofd_cd: 0, ofd_td: 0};

    const lossData = data
      .filter(d => d.year === year)
      .reduce((acc, d) => {
        const tmpDn = d.disaster_number;
        const tmpPd = +d.fusion_property_damage || 0,
          tmpCd =  +d.fusion_crop_damage || 0,
          tmptd = tmpPd + tmpCd + (+d.swd_population_damage || 0);

        if(tmpDn.includes('SWD')){
          swdTotalPerYear.swd_pd += tmpPd;
          swdTotalPerYear.swd_cd += tmpCd;
          swdTotalPerYear.swd_td += tmptd;

          swdTotal.swd_tpd += tmpPd;
          swdTotal.swd_tcd += tmpCd;
          swdTotal.swd_ttd += tmptd;
        }else{
          disaster_numbers.add(tmpDn);
          ofdTotalPerYear.ofd_pd += tmpPd;
          ofdTotalPerYear.ofd_cd += tmpCd;
          ofdTotalPerYear.ofd_td += tmptd;

          ofdTotal.ofd_tpd += tmpPd;
          ofdTotal.ofd_tcd += tmpCd;
          ofdTotal.ofd_ttd += tmptd;
        }

        return {
          ...acc, ...{
            [`${tmpDn}_pd`]: (acc[[`${tmpDn}_pd`]] || 0) + tmpPd,
            [`${tmpDn}_cd`]: (acc[`${tmpDn}_cd`] || 0) + tmpCd,
            [`${tmpDn}_td`]: (acc[`${tmpDn}_td`] || 0) + tmptd
          }
        };
      }, {});
    return { year, ...lossData, ...swdTotalPerYear, ...ofdTotalPerYear };
  });

  return { processed_data,  disaster_numbers: [...disaster_numbers] };
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

const RenderValidation = ({ data = {}, tolerance = 1, formatData = d => fnum(Math.floor((d))) }) => {
  const compareTypes = [['NCEI', 'Fusion NCEI'], ['OFD', 'Fusion OFD']];
  const compareCols = ['property_damage', 'crop_damage', 'population_damage'];
  const invalidData = []
  const cols = ['', 'Property Damage', 'Crop Damage', 'Population Damage'];

  if (!Object.keys(data).length) return null;
  const isValid = compareTypes.reduce((acc, types) => {
    const tmp = compareCols.reduce((subAcc, col) => {

      const tmpRes = types.reduce((acc, type) => {
        return !acc ? Math.abs(data[type][col]) : Math.abs(acc - Math.abs(data[type][col]));
      }, null) < tolerance;

      if(!tmpRes) invalidData.push({types, col});
      return subAcc && tmpRes
    }, true)
    return acc && tmp;
  }, true);

  return (
    <div>
      <div className={`overflow-hidden border-2 border-${isValid ? `green-300` : `red-200`}`}>
        <i className={`text-sm ${isValid ? `text-[#46951a]` : `text-red-900`}`}> {isValid ? `Valid` : `Invalid`} with tolerance {tolerance}</i>

        <div className={`flex flex-row items-center py-4 sm:py-2 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6`}>
          {
            cols
              .map(col => (
                <dt className="text-sm text-gray-900">
                  {col}
                </dt>
              ))
          }
          {
            Object.keys(data).map(type => (
              <>
                <dt className="text-gray-600">
                  {type}
                </dt>

                {
                  Object.keys(data[type])
                    .map(col => (
                      <dt className={`text-sm 
                      ${
                        !isValid && 
                        invalidData.find(d => d.types.includes(type) && d.col === col) ? `text-red-900` : `text-gray-900`
                      }`}>
                        {formatData(data[type][col])}
                      </dt>
                    ))
                }
              </>
            ))
          }
        </div>
      </div>
    </div>
  );
}

const RenderComparativeStats = ({data = []}) => {
  const cols = Object.keys((data[0] || {})).filter(c => c.includes('total') || c.includes('diff') || c === 'disaster_number')
  return (
    <>
      <div
        className={'flex flex-row py-4 sm:py-2 sm:gap-4 sm:px-6 text-lg font-md'}>
        Breakdown
      </div>

      <div className={`py-4 sm:py-2  sm:gap-4 sm:px-6 border-b-2 max-w-5xl`}>
        <Table
          columns={
            cols.map(col => ({
              Header: col,
              accessor: col,
              Cell: cell => col === 'disaster_number' ? cell.value : fnum((cell.value)),
              align: 'left',
              sortType: 'basic'
            }))
          }
          data={data}
          pageSize={100}
        />


      </div>
    </>
  )
}

const Stats = ({ source, views }) => {
  const { pgEnv } = React.useContext(DamaContext)
  const { falcor, falcorCache } = useFalcor();
  const [activeView, setActiveView] = useState(views[0].view_id);
  const [compareView, setCompareView] = useState(views[0].view_id);
  const [compareMode, setCompareMode] = useState(undefined);
  const [ctype, setCtype] = useState('pd');

  useEffect(() => {
    falcor.get(
      ["fusion", pgEnv, "source", source.source_id, "view", [activeView, compareView], 'total', ["lossByYearByDisasterNumber"]],
      ["fusion", pgEnv, "source", source.source_id, "view", [activeView, compareView], ["validateLosses", "dataSourcesBreakdown"]]
    );
  }, [activeView, compareView, pgEnv, source.source_id, falcor]);

  const metadataActiveView = get(falcorCache, ["fusion", pgEnv, "source", source.source_id, "view", activeView, 'total', "lossByYearByDisasterNumber", "value"], []);
  const compareLossesActiveView = get(falcorCache, ["fusion", pgEnv, "source", source.source_id, "view", activeView, "validateLosses", "value"], {});
  const breakdownActiveView = get(falcorCache, ["fusion", pgEnv, "source", source.source_id, "view", activeView, "dataSourcesBreakdown", "value"], {});
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
                keys={disaster_numbers.map(dn => `${dn}_td`)}
                indexBy={"year"}
                axisBottom={{ tickDensity: 3, axisColor: '#000', axisOpacity: 0  }}
                axisLeft={{ format: d => fnumIndex(d, 0), gridLineOpacity: 0.1, showGridLines: true, ticks: 5, axisColor: '#000', axisOpacity: 0 }}
                paddingInner={0.1}
                // colors={(value, ii, d, key) => ctypeColors[key]}
                hoverComp={{
                    HoverComp: HoverComp,
                    valueFormat: fnumIndex,
                    keyFormat: k => k.replace('_td', '')
                }}
                groupMode={"stacked"}
              />
          </div>
      }

      <div className={`pt-4`}>
        <RenderComparativeStats data={breakdownActiveView} />
      </div>

      <div className={`pt-4`}>
        <RenderValidation data={compareLossesActiveView} />
      </div>
      <div className={`pt-4`}>
        <RenderValidation data={compareLossesActiveView} tolerance={0.0009} formatData={d => parseFloat(d).toFixed(4).toLocaleString()}/>
      </div>
    </>
  );
};

const NceiStormEventsConfig = {
  
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
