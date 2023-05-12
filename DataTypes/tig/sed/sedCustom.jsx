import React, { useMemo, useEffect} from "react";
import get from "lodash/get";
import { useSelector } from "react-redux";
import { selectPgEnv } from "~/pages/DataManager/store"
import { useFalcor } from "~/modules/avl-components/src"
import * as d3scale from "d3-scale"
import ckmeans from '../../../utils/ckmeans'
import cloneDeep from 'lodash/cloneDeep'

const defaultRange = ['#ffffb2', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#b10026']
const defaultDomain = [0,872,2047,3649,6934,14119,28578]
const sedVars = {
  totpop: { name: "Total Population", domain: defaultDomain, range: defaultRange},
  hhpop: { name: "Households", domain: defaultDomain, range: defaultRange},
  hhnum: { name: "Household Population", domain: defaultDomain, range: defaultRange},
  hhsize: { name: "Household Size", domain: defaultDomain, range: defaultRange},
  hhincx: { name: "Household Income", domain: defaultDomain, range: defaultRange},
  elf: { name: "Employed Labor Fouce", domain: defaultDomain, range: defaultRange},
  emptot: { name: "Total Employment", domain: defaultDomain, range: defaultRange},
  empret: { name: "Retail Employment", domain: defaultDomain, range: defaultRange},
  empoff: { name: "Office Employment", domain: defaultDomain, range: defaultRange},
  earnwork: { name: "Earnings", domain: defaultDomain, range: defaultRange},
  unvenrol: { name: "Universirty Enrollment", domain: defaultDomain, range: defaultRange},
  k_12_etot: { name: "School Enrollment", domain: defaultDomain, range: defaultRange},
  gqpop: { name: "Group Quarters Population", domain: defaultDomain, range: defaultRange},
  gqpopins: { name: "Group Quarters Instituional Population", domain: defaultDomain, range: defaultRange},
  gqpopstr: { name: "Group Quarters Other Population", domain: defaultDomain, range: defaultRange},
  gqpopoth: { name: "Group Quarters Homless Population", domain: defaultDomain, range: defaultRange}
};

const sedVarsCounty = {
    "tot_pop": {name: 'Total Population (in 000s)', domain: [0,74,213,481,750,1134,2801], range: defaultRange},
    "tot_emp": {name: 'Total Employment', domain: defaultDomain, range: defaultRange},
    "emp_pay": {name: 'Payroll Employment', domain: defaultDomain, range: defaultRange},
    "emp_prop": {name: 'Proprietors Employment', domain: defaultDomain, range: defaultRange},
    "hh_pop": {name: 'Household Population', domain: defaultDomain, range: defaultRange},
    "gq_pop": {name: 'Group Quarters Population', domain: defaultDomain, range: defaultRange},
    "hh_num": {name: 'Households', domain: defaultDomain, range: defaultRange},
    "hh_size": {name: 'Household Size', domain: defaultDomain, range: defaultRange},
    "lf": {name: 'Labor Force', domain: defaultDomain, range: defaultRange}
}

//const years = ["10", "17", "20", "25", "30", "35", "40", "45", "50", "55"];

const SedMapFilter = ({ 
    source, 
    metaData, 
    filters, 
    setFilters, 
    setTempSymbology,
    tempSymbology,
    activeViewId 
  }) => {
  const {falcor, falcorCache} = useFalcor();
  const pgEnv = useSelector(selectPgEnv);
  let activeVar = useMemo(() => get(filters, "activeVar.value", ""), [filters]);
  let varType = useMemo(
    () =>
      typeof activeVar === "string"
        ? activeVar.substring(0, activeVar.length - 2)
        : "",
    [activeVar]
  );
  let year = useMemo(
    () => (typeof activeVar === "string" ? activeVar.slice(-1) : "0"),
    [activeVar]
  );

  let varList = useMemo(() => {
    return source.type === 'tig_sed_county' ? sedVarsCounty : sedVars
  },[source.type])

  useEffect(() => {
    //console.log('calculate the tempSymbology',activeVar)
    const updateSymbology = () => {
      falcor.get(['dama',pgEnv, 'viewsbyId' ,activeViewId, 'data', 'length'])
        .then(d => {
          let length = get(d, 
            ['json', 'dama', pgEnv, 'viewsbyId' ,activeViewId, 'data', 'length'], 
          0)

          // console.log('length',length)
          return falcor.chunk([
            'dama',
            pgEnv,
            'viewsbyId',
            activeViewId,
            'databyIndex', 
            [...Array(length).keys()],
            activeVar
          ])
        }).then(() => {
            const dataById = get(falcorCache, 
              ['dama', pgEnv, 'viewsbyId', activeViewId, 'databyId'], 
            {})

            //console.log('getColorScale', dataById, falcorCache)

            const colorScale = d3scale.scaleThreshold()
              .domain(varList[varType].domain)
              .range(varList[varType].range);

            let colors = Object.keys(dataById).reduce((out, id) => {
              out[+id] = colorScale(dataById[+id][activeVar]) || "#000"
              return out
            },{})
            let output = ["get",["to-string",["get","ogc_fid"]], ["literal", colors]]

            let newSymbology = cloneDeep(tempSymbology) || {'fill-color':{}}
            if(!newSymbology['fill-color']) {
              newSymbology['fill-color'] = {}
            }
            newSymbology['fill-color'][activeVar] = { 
              type: 'scale-threshold',
              settings: {
                range: varList[varType].range, 
                domain: varList[varType].domain,
                title: varList[varType].name
              },
              value: output
            }

            //console.log('newSymbology', newSymbology)
            
            setTempSymbology(newSymbology)

        })
    }
    if(activeVar.length > 0){
      updateSymbology()
    } 
  },[activeVar, varType, year,falcorCache])

  React.useEffect(() => {
    //console.log("SedMapFilter", activeVar);
    if (!activeVar) {
      setFilters({
        ...filters,
        activeVar: { value: source.type === 'tig_sed_county' ? 'tot_pop_0' : "totpop_0" },
      });
    }
  }, []);
  //console.log(varType, year, activeVar);

  return (
    <div className="flex flex-1 border-blue-100">
      <div className="py-3.5 px-2 text-sm text-gray-400">Variable: </div>
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
      </div>
    </div>
  );
};

const SedTableFilter = ({ source, filters, setFilters }) => {
  let activeVar = useMemo(() => get(filters, "activeVar.value", ""), [filters]);
  console.log("SedTableFilter", filters);
  React.useEffect(() => {
    if (!get(filters, "activeVar.value", "")) {
      setFilters({
        ...filters,
        activeVar: { value: source?.type === 'tig_sed_county' ? 'tot_pop' : "totpop" },
      });
    }
  }, []);
  let varList = useMemo(() => {
    return source.type === 'tig_sed_county' ? sedVarsCounty : sedVars
  },[source.type])

  //console.log(, year,activeVar)

  return (
    <div className="flex flex-1 border-blue-100">
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
          {Object.keys(varList).map((k, i) => (
            <option key={i} className="ml-2  truncate" value={k}>
              {varList[k].name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

const SedTableTransform = (tableData, attributes, filters, years,source) => {
  let activeVar = get(filters, "activeVar.value", "totpop");

  let updatedYears = years?.map((str) => (''+str).slice(-2));
  const columns = [
    {
      Header: source.type === 'tig_sed_county' ? "County" : "TAZ",
      accessor: source.type === 'tig_sed_county' ? "county" : "taz"
    },
  ];

  updatedYears.forEach((y, i) => {
    columns.push({
      Header: `20${y}`,
      accessor: `${activeVar}_${i}`,
      Cell: ({ value }) => Math.round(value).toLocaleString(),
    });
  });

  return {
    data: tableData,
    columns,
  };
};

const SedHoverComp = ({ data, layer }) => {
  const { falcor, falcorCache } = useFalcor() 
  const { source: { type }, attributes, activeViewId, props: { filters, activeView: {metadata: { years } } }  } = layer

  const pgEnv = useSelector(selectPgEnv);
  const id = React.useMemo(() => get(data, '[0]', null), [data])
  let activeVar = useMemo(() => get(filters, "activeVar.value", ""), [filters]);

  //console.log('filters', filters , layer)

  React.useEffect(() => {
    falcor.get([
      'dama',
      pgEnv, 
      'viewsbyId',
      activeViewId, 
      'databyId', 
      id,
      attributes
    ])
  }, [falcor, pgEnv, activeViewId, id, attributes])
    

  const attrInfo = React.useMemo(() => {
    return get(falcorCache, [
        'dama',
        pgEnv, 
        'viewsbyId',
        activeViewId, 
        'databyId', 
        id
      ], {});
  }, [id, falcorCache, activeViewId, pgEnv]);



  let year = years[activeVar.split('_')[1] || 0]
  let varName = type === 'tig_sed_taz' ? 
    sedVars[activeVar.split('_')[0] || 'tot_pop']?.name || '' :
    sedVarsCounty[activeVar.slice(0,-2) || 'totpop']?.name || '' 

    console.log(type, sedVarsCounty[activeVar.slice(-2) || 'totpop']?.name || '' , activeVar.slice(0,-2) )

  return (
    <div className='bg-white p-4 max-h-64 scrollbar-xs overflow-y-scroll'>
     {varName} {year}
      <div className='font-medium pb-1 w-full border-b '>{layer.source.display_name}</div>
          { type === 'tig_sed_taz' ? 
            <div className='flex border-b pt-1' >
            <div className='flex-1 font-medium text-sm pl-1'>TAZ</div>
            <div className='flex-1 text-right font-thin pl-4 pr-1'>{attrInfo?.['taz']}</div>
          </div> : ''}
          <div className='flex border-b pt-1' >
            <div className='flex-1 font-medium text-sm pl-1'>County</div>
            <div className='flex-1 text-right font-thin pl-4 pr-1'>{attrInfo?.['county']}</div>
          </div>
          <div className='flex border-b pt-1' >
            <div className='flex-1 font-medium text-sm pl-1'>Value</div>
            <div className='flex-1 text-right font-thin pl-4 pr-1'>{get(attrInfo, activeVar,'').toLocaleString()}</div>
          </div>
        
    </div>
  )
}

export { SedMapFilter, SedTableFilter, SedTableTransform, SedHoverComp };
