import { createSimpleSelector } from "pages/DataManager/utils/Reducks";

export const selectDatabaseColumnNames = createSimpleSelector(
  "databaseColumnNames"
);

export const selectTableDescriptor = createSimpleSelector("tableDescriptor");
