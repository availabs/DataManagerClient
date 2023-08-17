import React, { useEffect, useMemo } from "react";
import Select from "react-select";
import makeAnimated from "react-select/animated";

const MultiSelect = ({
  options,
  onChange,
  value,
  selectMessage = "",
  ...props
}) => {
  const animatedComponents = makeAnimated();
  return (
    <Select
      options={options}
      onChange={onChange}
      value={value}
      hideSelectedOptions={true}
      closeMenuOnSelect={false}
      isMulti
      placeholder={`-- Select ${selectMessage} --`}
      components={{ animatedComponents }}
      {...props}
    />
  );
};

const AcsTableTransform = (tableData, censusColumns) => {
  const columns = censusColumns?.map((c) => ({
    Header: c?.toUpperCase(),
    accessor: c,
  }));

  return {
    data: tableData,
    columns,
  };
};

const AcsTableFilter = ({
  variables,
  years,
  geometries,
  filters,
  setFilters,
  tableColumns,
  setTableColumns,
}) => {
  const [geometry, year] = useMemo(() => {
    return [
      filters?.geometry?.value || "county",
      filters?.year?.value || 2019,
    ];
  }, [filters]);

  const variableOptions = Object.keys(variables).map((v) => ({
    label: v,
    value: v,
  }));

  useEffect(() => {
    if (!geometry && geometries && geometries.length) {
      setFilters({
        ...filters,
        geometry: { value: geometries[0] },
      });
    }
    if (!year && years && years.length) {
      setFilters({
        ...filters,
        year: { value: years[0] },
      });
    }
  }, []);

  return (
    <div className="flex flex-1 border-blue-100">
      <div className="py-3.5 px-2 text-sm text-gray-400">Variable: </div>
      <div className="flex-1">
        <MultiSelect
          value={(tableColumns || []).map((prod) => ({
            label: prod,
            value: prod,
          }))}
          closeMenuOnSelect={false}
          options={variableOptions || []}
          onChange={(value) => {
            setTableColumns(value.map(v => v.value));
          }}
          isSearchable
        />
      </div>
      <div className="py-3.5 px-2 text-sm text-gray-400">Year:</div>
      <div className="flex-1">
        <select
          className="pl-3 pr-4 py-2.5 border border-blue-100 bg-blue-50 w-full bg-white mr-2 flex items-center justify-between text-sm"
          value={year}
          onChange={(e) => {
            setFilters({
              ...filters,
              year: {
                value: e.target.value,
              },
            });
          }}
        >
          {(years || []).map((k, i) => (
            <option key={i} className="ml-2 truncate" value={k}>
              {`${k}`}
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
          {geometries.map((v, i) => (
            <option key={i} className="ml-2 truncate" value={v}>
              {v?.toUpperCase()}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export { AcsTableFilter, AcsTableTransform };
