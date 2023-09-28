import React from "react"

import get from "lodash/get"

import { DamaContext } from "~/pages/DataManager/store"

const useViewVariable = (viewId, variable) => {

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
    if (!(dataLength && variable)) return;
    falcor.get([
      "dama", pgEnv, "viewsbyId", viewId, "databyIndex",
      { from: 0, to: dataLength - 1 }, variable
    ])
  }, [falcor, pgEnv, viewId, dataLength, variable]);

  const [data, setData] = React.useState([]);

  React.useEffect(() => {
    if (!variable) setData([]);

    const dataById = get(falcorCache, ["dama", pgEnv, "viewsbyId", viewId, "databyId"], {});
    const data = Object.keys(dataById)
      .map(id => {
        const value = get(dataById, [id, variable], null);
        return {
          id,
          var: variable,
          value: value === 'null' ? null : value
        }
      }).filter(d => d.value !== null);
    setData(data);
  }, [falcorCache, pgEnv, viewId, variable]);

  return data;
}

export default useViewVariable;
