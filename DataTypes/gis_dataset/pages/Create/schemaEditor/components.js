import { useState, useEffect } from "react";

import debounce from "lodash/debounce";
import mapValues from "lodash/mapValues";
// import Dropdown from "react-dropdown";
// import "react-dropdown/style.css";


const FreeFormColumnNameInput = ({ publishStatus, field, col, onChange }) => {
  return (
    <input
      className="w-full p-2 flex-1 shadow bg-grey-50 focus:bg-blue-100 border-gray-300"
      disabled={publishStatus !== "AWAITING"}
      id={field}
      defaultValue={col || ""}
      onChange={onChange}
    />
  );
};

const ConstrainedColumnNameInput = ({ publishStatus, field, col, availableDbColNames, onChange }) => {
  
  if (!availableDbColNames) {
    return "";
  }

  const matches = col && availableDbColNames.includes(col);

  const key = `col-names-dropdown-for-${field}`;

  const hasAvailableDbColNames = availableDbColNames.filter(Boolean).length > 0;

  if (!availableDbColNames.length) {
    return (
      <span style={{ color: "darkgray" }}>
        All table columns have been assigned.
      </span>
    );
  }

  if (matches && availableDbColNames.length === 1) {
    return <span className='text-center'>{col}</span>;
  }

  return (
    <select
      key={key}
      className="w-full p-2 flex-1 shadow bg-grey-50 focus:bg-blue-100 border-gray-300"
      onChange={(e) => onChange(e.target.value)}
      value={matches ? col : ""}
      placeholder="Select the db column name"
      disabled={
        !hasAvailableDbColNames || publishStatus !== "AWAITING"
      }
    >
      {availableDbColNames.map(col => <option value={col}>{col}</option>)}
    </select>
  );
};

export const GisDatasetLayerDatabaseDbSchemaForm = ({state, dispatch}) => {
  
  const { 
    layerName, 
    tableDescriptor, 
    publishStatus, 
    databaseColumnNames 
  } = state;

  const [omittedFields, setOmittedFields] = useState(null);
  const [defaultMappings, setDefaultMappings] = useState(null);

  const tableDescriptorColumnTypes =
    tableDescriptor && tableDescriptor.columnTypes;

  const gisDatasetFieldNamesToDbColumns =
    tableDescriptorColumnTypes &&
    tableDescriptorColumnTypes.reduce((acc, { key, col }) => {
      acc[key] = col || null;
      return acc;
    }, {});

  useEffect(() => {
    if (defaultMappings === null && gisDatasetFieldNamesToDbColumns) {
      setDefaultMappings(gisDatasetFieldNamesToDbColumns);
    }
  }, [defaultMappings, gisDatasetFieldNamesToDbColumns]);

  useEffect(() => {
    if (gisDatasetFieldNamesToDbColumns && !omittedFields) {
      setOmittedFields(
        mapValues(gisDatasetFieldNamesToDbColumns, (v) => v === null)
      );
    }
  }, [gisDatasetFieldNamesToDbColumns, omittedFields]);

  if (!layerName) {
    return "";
  }

  if (!gisDatasetFieldNamesToDbColumns) {
    return (
      <span className='w-full p-10 text-center'>
        Please wait... the server is analyzing the {layerName} layer. This may
        take a few moments.
      </span>
    );
  }

  if (!omittedFields) {
    return null;
  }

  const InputElem = databaseColumnNames
    ? ConstrainedColumnNameInput
    : FreeFormColumnNameInput;

  const assignedColNamesSet = new Set(
    Object.values(gisDatasetFieldNamesToDbColumns).filter(Boolean)
  );

  const availableDbColNames =
    databaseColumnNames &&
    databaseColumnNames
      .filter((c) => !assignedColNamesSet.has(c))
      .filter(Boolean);

  return (
    <div>
      <span className='text-lg font-bold'>
        Field Names Mappings
      </span>
      <div>
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-center" style={{ paddingRight: "40px" }}>
                GIS Dataset Field Name
              </th>
              <th className="text-center">Database Column Name</th>
              <th className="text-center">Omit</th>
            </tr>
          </thead>
          <tbody>
            {tableDescriptorColumnTypes.map(({ key, col }, rowIdx) => {
              let fieldColNameOptions;
              if (Array.isArray(availableDbColNames)) {
                fieldColNameOptions = assignedColNamesSet.has(col)
                  ? [col, ...availableDbColNames]
                  : availableDbColNames;
              }

              const ColNameCell = omittedFields[key] ? (
                <span />
              ) : (
                <InputElem
                  {...{
                    availableDbColNames: fieldColNameOptions,
                    publishStatus,
                    field: key,
                    col,
                    onChange: debounce((e) => {
                      const value = e.target ? e.target.value : e.value;

                      dispatch(
                        {type:'update_dbColName', payload: {rowIdx, colName: value }}
                      );
                    }, 500),
                  }}
                />
              );

              return (
                <tr key={key} className="border-b">
                  <td className="py-4 text-left">{key}</td>
                  <td className="text-center  p-2">{ColNameCell}</td>
                  <td className='text-center'>
                    <input
                      type="checkbox"
                      checked={!col}
                      disabled={
                        fieldColNameOptions && fieldColNameOptions.length === 0
                      }
                      onChange={() => {
                        const newOmittedFields = {
                          ...omittedFields,
                          [key]: !omittedFields[key],
                        };

                        setOmittedFields(newOmittedFields);
                        if (col) {
                          dispatch(
                            {type:'update_dbColName', payload: {rowIdx, colName:""}}
                          );
                        } else if (!fieldColNameOptions) {
                          dispatch(
                            {type:'update_dbColName', payload: {
                              rowIdx,
                              colName: defaultMappings[key]
                            }}
                          );
                        }
                      }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
