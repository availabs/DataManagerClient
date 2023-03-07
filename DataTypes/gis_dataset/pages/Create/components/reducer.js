import get from 'lodash/get'


export function reducer(state, action) {
  
  if (action.type === 'update') {
  
    return {
      ...state,
      ...action.payload
    };
  
  } else if (action.type === 'update_dbColName') {
  
    const { rowIdx, colName: newColName } = action.payload;
    const { tableDescriptor } = state;
    const oldColName = get(tableDescriptor, ["columnTypes", rowIdx, "col"]);

    if (oldColName === newColName) { return state; }

    const newTblDscr = { ...tableDescriptor };
    newTblDscr.columnTypes = tableDescriptor.columnTypes.slice();
    newTblDscr.columnTypes[rowIdx] = {
      ...newTblDscr.columnTypes[rowIdx],
      col: newColName,
    };

    return { ...state, tableDescriptor: newTblDscr };
  }

  return state

}

