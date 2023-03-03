import deepFreeze from "deep-freeze-strict";

import { assign, cloneDeep, get, isEqual } from "lodash";

export const initialState = deepFreeze({
  databaseColumnNames: null,
  tableDescriptor: null,
});

export function init(config) {
  const clone = cloneDeep(initialState);

  const state = assign(clone, config);

  return state;
}

export default function reducer(state, action) {
  const { type, payload } = action;

  switch (type) {
    case "databaseColumnNames/UPDATE_DATABASE_COLUMN_NAMES": {
      const { databaseColumnNames } = state;

      if (isEqual(databaseColumnNames, payload)) {
        return state;
      }

      return { ...state, databaseColumnNames: payload };
    }

    case "tableDescriptor/UPDATE_TABLE_DESCRIPTOR": {
      const { tableDescriptor } = state;

      if (tableDescriptor === payload) {
        return state;
      }

      return { ...state, tableDescriptor: payload };
    }

    case "tableDescriptor/UPDATE_DATABASE_COLUMN_NAME": {
      const { rowIdx, colName: newColName } = payload;

      const { tableDescriptor } = state;

      const oldColName = get(tableDescriptor, ["columnTypes", rowIdx, "col"]);

      if (oldColName === newColName) {
        return state;
      }

      const newTblDscr = { ...tableDescriptor };
      newTblDscr.columnTypes = tableDescriptor.columnTypes.slice();
      newTblDscr.columnTypes[rowIdx] = {
        ...newTblDscr.columnTypes[rowIdx],
        col: newColName,
      };

      return { ...state, tableDescriptor: newTblDscr };
    }

    default:
      return state;
  }
}
