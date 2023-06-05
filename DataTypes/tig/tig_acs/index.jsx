import React, {useMemo, useEffect} from "react";
import AcsSelection from "./acsSelection";
import MapPage from "../../gis_dataset/pages/Map";
import { useFalcor } from "~/modules/avl-components/src"
import { DamaContext } from "~/pages/DataManager/store"
import get from 'lodash/get'


const ACSMapFilter = ({ 
    source, 
    metaData, 
    filters, 
    setFilters, 
    setTempSymbology,
    tempSymbology,
    activeView,
    activeViewId 
  }) => {
  const {falcor, falcorCache} = useFalcor();
  const { pgEnv } = React.useContext(DamaContext)
  let activeVar = useMemo(() => get(filters, "activeVar.value", ""), [filters]);
  
  //console.log('ACSMapFilter', source, metaData, activeView, filters, tempSymbology)
  useEffect(() => {
    console.log('get faclor deps', activeViewId, activeView)
    falcor.get(['dama'])// get all data from view where id = this views dep
  },[,activeViewId])

  useEffect(() => {
    console.log('update map sources', activeViewId, activeView)
    // read data out of falcorcache from that view
    // - view.metadata.tiles
    // - setTempSymbology { sources: view.metadata.tiles.sources, layers: view.metadata.tiles.layers}
  },[,activeViewId])
  // useEffect(() => {
  //   //const updateSymbology = () => {}
  //   console.o
  // },[activeVar, falcorCache])

  
  //console.log(varType, year, activeVar);

  return (
    <div className="flex flex-1 border-blue-100">
      ACS Map filter does nothing

      {/*<div className="py-3.5 px-2 text-sm text-gray-400">Variable: </div>
      <div className="flex-1">
        <select
          className="pl-3 pr-4 py-2.5 border border-blue-100 bg-blue-50 w-full bg-white mr-2 flex items-center justify-between text-sm"
          value={varType}
          onChange={(e) =>
            setFilters({
              ...filters,
              activeVar: { value: `${e.target.value}_${year}` },
            })
          }
        >
          <option className="ml-2  truncate" value={null}>
            none
          </option>
          {Object.keys(varList).map((k, i) => (
            <option key={i} className="ml-2  truncate" value={k}>
              {varList[k].name}
            </option>
          ))}
        </select>
      </div>

      <div className="py-3.5 px-2 text-sm text-gray-400">Year:</div>
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
      </div>*/}
    </div>
  );
};



const TigAcsConfig = {
  map: {
    name: "Map",
    path: "/map",
    component: (props) => <MapPage 
      {...props} 
      MapFilter={ACSMapFilter} 
    />,
  },
  sourceCreate: {
    name: "Create",
    component: (props) => <AcsSelection {...props} dataType="tig_acs" />,
  },
};

export default TigAcsConfig;
