import React, { useState } from "react";

import { useParams, useNavigate } from "react-router-dom";
import get from "lodash/get";

import { DamaContext } from "~/pages/DataManager/store";

// import { useFalcor } from "~/modules/avl-components/src";
import { LineGraph } from "~/modules/avl-graph/src";

const ViewSelector = ({ views }) => {
  const { viewId } = useParams();

  return (
    <div className="flex flex-1">
      <div className="py-3.5 px-2 text-sm text-gray-400">Version : </div>
      <div className="flex-1">
        <select
          className="pl-3 pr-4 py-2.5 border border-blue-100 bg-blue-50 w-full bg-white mr-2 flex items-center justify-between text-sm"
          value={viewId}

        >
          {views
            .sort((a, b) => b.view_id - a.view_id)
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
    columns: attributes.map((d) => ({
      Header: d,
      accessor: d,
    })),
  };
};

const TablePage = ({
  source,
  views,
  transform = identityMap,
  filterData = {},
  TableFilter = DefaultTableFilter,
}) => {
  const { viewId } = useParams();
  const [filters, _setFilters] = useState(filterData);
  const setFilters = React.useCallback(filters => {
    _setFilters(prev => ({ ...prev, ...filters }));
  }, []);
  const { pgEnv, falcor, falcorCache, user } = React.useContext(DamaContext)

  const activeView = React.useMemo(() => {
    return get(
      views.filter((d) => d.view_id === viewId),
      "[0]",
      views[0]
    );
  }, [views, viewId]);

  const activeViewId = React.useMemo(
    () => get(activeView, `view_id`, null),
    [activeView]
  );

  React.useEffect(() => {
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
    return (source?.metadata?.columns || source?.metadata || [])
      .filter((d) => ["integer", "string", "number"].includes(d.type))
      .map((d) => d.name);
  }, [source]);

  React.useEffect(() => {
    if (dataLength > 0) {
      let maxData = Math.min(dataLength, 10000);
      falcor
        .chunk([
          "dama",
          pgEnv,
          "viewsbyId",
          activeViewId,
          "databyIndex",
          [...Array(maxData).keys()],
          attributes,
        ])
    }
  }, [pgEnv, activeViewId, dataLength, attributes]);

  const tableData = React.useMemo(() => {
    let data = Object.values(
      get(
        falcorCache,
        ["dama", pgEnv, "viewsbyId", activeViewId, "databyIndex"],
        []
      )
    ).map((d) => get(falcorCache, d.value, {}));

    return data;
  }, [pgEnv, activeViewId, falcorCache, dataLength]);

  let years = get(activeView, ["metadata", "years"], []);

  const { data } = React.useMemo(
    () => transform(tableData, attributes, filters, years, "group_by_county"),
    [tableData, attributes, transform, filters]
  );

  const [ref, setRef] = React.useState(null);

  return (
    <div>
      <div className="flex">
        <TableFilter filters={filters} setFilters={setFilters}
          node={ ref }/>
        <ViewSelector views={views} />
      </div>
      <div style={{ height: "600px" }} ref={ setRef }>
        {data?.length ? (
          <LineGraph
            colors={["#3366cc","#dc3912","#ff9900","#109618","#990099","#0099c6","#dd4477","#66aa00","#b82e2e","#316395","#994499","#22aa99","#aaaa11","#6633cc","#e67300","#8b0707","#651067","#329262","#5574a6","#3b3eac","#b77322","#16d620","#b91383","#f4359e","#9c5935","#a9c413","#2a778d","#668d1c","#bea413","#0c5922","#743411"]}
            data={data}
            axisBottom={{ tickDensity: 1 }}
            axisLeft={{
              lzabel: "Values",
              showGridLines: false,
              tickDensity: 1,
            }}
            axisRight={{
              label: "Year",
              showGridLines: false,
            }}
            hoverComp={{
              idFormat: (id, data) => data.name,
              yFormat: ",.2f",
              showTotals: false,
            }}
            margin={{
              top: 20,
              bottom: 25,
              left: 80,
              right: 30,
            }}
          />
        ) : (
          <div
            className="text-center justify-content-center"
            style={{ height: "600px", lineHeight: "600px" }}
          >
            No Chart Data Available
          </div>
        )}
      </div>
    </div>
  );
};

export default TablePage;
