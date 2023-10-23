
import React, { useState } from 'react';
import {  Table } from '~/modules/avl-components/src'
import get from 'lodash/get'
import { useParams, useNavigate } from 'react-router-dom'

import { DamaContext } from "~/pages/DataManager/store";
// import { SymbologyControls } from '~/pages/DataManager/components/SymbologyControls'

const ViewSelector = ({views}) => {
  const { viewId, sourceId, page } = useParams()
  const navigate = useNavigate()
  const { baseUrl  } = React.useContext(DamaContext)

  return (
    <div className="flex">
      <div className="py-3.5 px-2 text-sm text-gray-400">Version  ss: </div>
      <div className="flex-1">
        <select
          className="pl-3 pr-4 py-2.5 border border-blue-100 bg-blue-50 w-full bg-white mr-2 flex items-center justify-between text-sm"
          value={viewId}
          onChange={(e) => navigate(`/${baseUrl}/source/${sourceId}/${page}/${e.target.value}`)}
        >
          {views
            ?.sort((a, b) => b.view_id - a.view_id)
            .map((v, i) => (
              <option key={i} className="ml-2  truncate" value={v.view_id}>
                {v.version ? v.version : v.view_id}
              </option>
            ))}
        </select>
      </div>
    </div>
  );
};

const DefaultTableFilter = () => <div />;

const identityMap = (tableData, attributes) => {
  return {
    data: tableData,
    columns: attributes?.map((d) => ({
      Header: d,
      accessor: d,
    })),
  };
};
// import { getAttributes } from '~/pages/DataManager/Source/attributes'
const TablePage = ({
  source,
  views,
  transform = identityMap,
  filterData = {},
  TableFilter = DefaultTableFilter,
  showViewSelector = true
}) => {
  const { viewId } = useParams();
  const [filters, _setFilters] = useState(filterData);
  const setFilters = React.useCallback(filters => {
    _setFilters(prev => ({ ...prev, ...filters }));
  }, []);

  const { pgEnv, falcor, falcorCache, user  } = React.useContext(DamaContext)

  const activeView = React.useMemo(() => {
    return get(
      views?.filter((d) => d.view_id === viewId),
      "[0]",
      views[0]
    );
  }, [views, viewId]);
  const activeViewId = React.useMemo(
    () => get(activeView, `view_id`, null),
    [activeView]
  );

  React.useEffect(() => {
    console.time("getviewLength");
    //console.log('getviewLength', pgEnv,activeViewId)
    falcor
      .get(["dama", pgEnv, "viewsbyId", activeViewId, "data", "length"])
      .then((d) => {
        console.timeEnd("getviewLength");
      });
  }, [pgEnv, activeViewId]);

  const dataLength = React.useMemo(() => {
    return get(
      falcorCache,
      ["dama", pgEnv, "viewsbyId", activeViewId, "data", "length"],
      "No Length"
    );
  }, [pgEnv, activeViewId, falcorCache]);

  const attributes = React.useMemo(() => {
    
    let md = get(source, ["metadata", "columns"], get(source, "metadata", []));
    if (!Array.isArray(md)) {
      md = [];
    }

    return md
      .filter((d) => ["integer", "string", "number"].includes(d.type))
      .map((d) => d.name);
  }, [source]);

  // const metadata = get(source,'metadata',[])

  // falcor.chunk([
    //   "dama", pgEnv, "viewsbyId", activeViewId, "databyIndex",
    //   , variables
    // ])
  React.useEffect(() => {
    if (dataLength > 0) {
      console.log("dataLength", dataLength);
      let maxData = Math.min(dataLength, 10000);
      console.time("getViewData", maxData);
      falcor
        .chunk(
          [
            "dama",
            pgEnv,
            "viewsbyId",
            activeViewId,
            "databyIndex",
            Array.from(Array(maxData-1).keys()),//{"from":0, "to": maxData-1},
            attributes,
          ]
        )
        .then((d) => {
          console.timeEnd("getViewData", maxData);
        });
    }
  }, [pgEnv, activeViewId, dataLength, attributes]);

  const tableData = React.useMemo(() => {
    let maxData = Math.min(dataLength, 5000);

    let data = Object.values(
      get(
        falcorCache,
        ["dama", pgEnv, "viewsbyId", activeViewId, "databyIndex"],
        []
      )
    ).map((d) => get(falcorCache, d.value, {}));

    //console.log('attr data from cache', data)

    return data;
  }, [pgEnv, activeViewId, falcorCache, dataLength]);

  let years = get(activeView, ["metadata", "years"], []);

  const { data, columns } = React.useMemo(
    () => transform(tableData, attributes, filters, years, source),
    [tableData, attributes, transform, filters, years, source]
  );

  const [sortBy, sortOrder] = React.useMemo(() => {
    const col =  columns.filter(d => d.sortBy)?.[0]
    console.log('the col', col)
    return [col?.accessor || '', col?.sortBy || 'asc']
  },[columns])
  

  console.log('sort', sortBy, columns)

  return (
    <div>
      <div className="flex">
        {/*<div className="flex-1 pl-3 pr-4 py-2">Table View</div>*/}
        <TableFilter filters={filters} setFilters={setFilters} source={source}
          data={tableData} columns={columns}/>
        { showViewSelector ? <ViewSelector views={views} /> : '' }
      </div>
      <div className="max-w-6xl">
        <Table 
          data={data} 
          columns={columns} 
          sortBy={sortBy}
          sortOrder={sortOrder}
          pageSize={50} 
        />
        {/* <pre>
          {JSON.stringify(attributes,null,3)}
        </pre>*/}
      </div>
    </div>
  );
};

export default TablePage;
