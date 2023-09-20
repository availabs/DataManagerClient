import React, { useEffect, useState } from "react";

import Map from "../../gis_dataset/pages/Map";
import CreatePage from "../../gis_dataset/pages/Create";
import Table from "../../gis_dataset/pages/Table";

const HBTableFilter = ({ source, filters, setFilters, data, columns }) => {
    const timePeriod = filters['period']?.value || null;
    const functionalClass = filters['functional_class']?.value || null;

    function onlyUnique(value, index, array) {
      return array.indexOf(value) === index;
    }

    const allTimePeriods = data.map((val, i) => val.period).filter(onlyUnique);
    const allFunctionalClasses = data.map((val, i) => val.functional_class).filter(onlyUnique);
    
    useEffect(() => {
      if(!timePeriod)
        setFilters({'period' : { value: 'all_day'}});

      if(!functionalClass)
      setFilters({'functional_class' : { value: 'total'}});
    }, []);

    return (
      <div className='flex flex-1'>
        <div className='py-3.5 px-2 text-sm text-gray-400'>Time period : </div>
        <div className='flex-1'>
          <select
              className="pl-3 pr-4 py-2.5 border border-blue-100 bg-blue-50 w-full bg-white mr-2 flex items-center justify-between text-sm"
              value={timePeriod}
              onChange={(e) => setFilters({'period' :{ value: e.target.value}})}
            >
              {allTimePeriods?.map((v,i) => (
                <option key={i} className="ml-2  truncate" value={v}>
                  {v}
                </option>
              ))}
          </select>
        </div>
        <div className='py-3.5 px-2 text-sm text-gray-400'>Functional class : </div>
        <div className='flex-1'>
          <select
              className="pl-3 pr-4 py-2.5 border border-blue-100 bg-blue-50 w-full bg-white mr-2 flex items-center justify-between text-sm"
              value={functionalClass}
              onChange={(e) => setFilters({'functional_class' :{ value: e.target.value}})}
            >
              {allFunctionalClasses?.map((v,i) => (
                <option key={i} className="ml-2  truncate" value={v}>
                  {v}
                </option>
              ))}
          </select>
        </div>
      </div>
    )
}

const BPMTableTransform = (tableData, attributes, filters) => {
    
  const filterKeys = Object.keys(filters);
  
  let data = tableData;
  filterKeys.forEach((key, i) => {
    data = data.reduce((acc, val) => {
      if(filters[key].value == val[key]) {
          acc.push(val);
      } 
      return acc;
    }, []);
  });

  const sumAll = {};
  data.reduce((i, data) => {
    if(data?.functional_class != "total")
    sumAll[data?.area] = {
      total_vehicle_miles_traveled: Number(data.vehicle_miles_traveled) + sumAll[data.area]?.total_vehicle_miles_traveled || 0,
      total_vehicle_hours_traveled: Number(data.vehicle_hours_traveled) + sumAll[data.area]?.total_vehicle_hours_traveled || 0,
      total_speed: data.ave_speed + sumAll[data.area]?.total_speed || 0,
      count: 1+sumAll[data?.area]?.count || 0
    }
  }, {});

  Object.keys(sumAll).reduce((i, key) => {
    sumAll[key].avg_speed = sumAll[key].total_speed/sumAll[key].count;
  }, []);

  console.log('what is the value of the data: ', data);
  // console.log("what is the values of sumAll: ", sumAll);
  const columns = [
      {
        Header: 'County',
        accessor: 'area'
      },
      {
        Header: 'VMT (in Thousands)',
        accessor: 'vehicle_miles_traveled',
        Cell: (d) => <div>{Math.round(d.value).toLocaleString()}</div>
      },
      {
        Header: 'VHT (in Thousands)',
        accessor: 'vehicle_hours_traveled',
        Cell: (d) => <div>{Math.round(d.value).toLocaleString()}</div>
      },
      {
        Header: 'Avg. Speed (Miles/Hr)',
        accessor: 'ave_speed',
        Cell: (d) => <div>{(d.value).toFixed(2).toLocaleString()}</div>
      }
    ]

  
    return {
      data: data,
      columns: columns,
      // attributes
      //   //?.filter(d => ['area','vehicle_miles_traveled'].includes(d))
      //   ?.map((d) => ({
      //     Header: d,
      //     accessor: d,
      //   })),
    };
};


/*
    transform={HBTableTransform}
    TableFilter={HBTableFilter}
*/
const config = {

  table: {
    name: "Table",
    path: "/table",
    component: (props) => (
      <Table
        {...props}
        transform={BPMTableTransform}
        TableFilter={HBTableFilter}
      />
    ),
  },
  map: {
    name: "Map",
    path: "/map",
    component: (props) => (
      <Map
        {...props}
      />
    ),
  },
  sourceCreate: {
    name: "Create",
    component: CreatePage
  }
  
};

export default config
