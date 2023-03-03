import { createSimpleSelector } from "pages/DataManager/utils/Reducks";

export const selectMaxSeenId = createSimpleSelector("maxSeenEventId");
export const selectGisUploadId = createSimpleSelector("gisUploadId");
export const selectFileUploadStatus = createSimpleSelector("fileUploadStatus");
export const selectUploadedFile = createSimpleSelector("uploadedFile");
export const selectUploadErrMsg = createSimpleSelector("uploadErrMsg");
