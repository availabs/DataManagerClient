import { createSimpleSelector } from "pages/DataManager/utils/Reducks";

export const selectLayerNames = createSimpleSelector("layerNames");

export const selectLayerName = createSimpleSelector("layerName");

export const selectLayerAnalysis = createSimpleSelector("layerAnalysis");

export const selectLyrAnlysErrMsg = createSimpleSelector("lyrAnlysErrMsg");
