import { createSimpleIdentityAction } from "pages/DataManager/utils/Reducks";

export const updateDatabaseColumnNames = createSimpleIdentityAction(
  "databaseColumnNames/UPDATE_DATABASE_COLUMN_NAMES"
);

export const updateTableDescriptor = createSimpleIdentityAction(
  "tableDescriptor/UPDATE_TABLE_DESCRIPTOR"
);

export const updateGisDatasetLayerDatabaseColumnName = (rowIdx, colName) => ({
  type: "tableDescriptor/UPDATE_DATABASE_COLUMN_NAME",
  payload: {
    rowIdx,
    colName,
  },
});
