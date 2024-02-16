import React from "react"

import get from "lodash/get"

import { DamaContext } from "~/pages/DataManager/store"

const EmptyObject = {};
const EmptyArray = [];

export const useViewVariable = (viewId, variable, filteredVariableIds = EmptyArray) => {

  const variableId = get(variable, "variableId", variable);
  if (!variableId) return [];

  const variables = React.useMemo(() => {
    return [variableId, ...filteredVariableIds].filter(Boolean);
  }, [variableId, filteredVariableIds]);

  const { pgEnv, falcor, falcorCache  } = React.useContext(DamaContext);

  React.useEffect(() => {
    falcor.get(["dama", pgEnv, "viewsbyId", viewId, "data", "length"])
  }, [falcor, pgEnv, viewId]);

  const [dataLength, setDataLength] = React.useState(0);
  React.useEffect(() => {
    const dl = get(falcorCache, ["dama", pgEnv, "viewsbyId", viewId, "data", "length"], 0);
    setDataLength(dl);
  }, [falcorCache, pgEnv, viewId]);

  React.useEffect(() => {
    if (!(dataLength && variables.length)) return;
    falcor.get([
      "dama", pgEnv, "viewsbyId", viewId, "databyIndex",
      { from: 0, to: dataLength - 1 }, variables
    ])
  }, [falcor, pgEnv, viewId, dataLength, variables]);

  const [data, setData] = React.useState([]);

  React.useEffect(() => {
    if (!variables.length) setData([]);

    const dataById = get(falcorCache, ["dama", pgEnv, "viewsbyId", viewId, "databyId"], {});
    const data = Object.keys(dataById)
      .map(id => {
        return variables.reduce((a, c) => {
          const value = get(dataById, [id, c], null);
          a[c] = value === 'null' ? null : value;
          return a;
        }, { id });
      }).filter(d => d.value !== null);
    setData(data);
  }, [falcorCache, pgEnv, viewId, variables]);

  return data;
}
