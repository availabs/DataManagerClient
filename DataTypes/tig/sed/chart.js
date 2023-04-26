import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useParams, useHistory } from "react-router-dom";
import get from "lodash.get";

import { selectPgEnv } from "pages/DataManager/store";

import { useFalcor, withAuth } from "modules/avl-components/src";
import { LineGraph } from "modules/avl-graph/src";

const ViewSelector = ({ views }) => {
  const { viewId, sourceId, page } = useParams();
  const history = useHistory();

  return (
    <div className="flex flex-1">
      <div className="py-3.5 px-2 text-sm text-gray-400">Version : </div>
      <div className="flex-1">
        <select
          className="pl-3 pr-4 py-2.5 border border-blue-100 bg-blue-50 w-full bg-white mr-2 flex items-center justify-between text-sm"
          value={viewId}
          onChange={(e) =>
            history.push(`/source/${sourceId}/${page}/${e.target.value}`)
          }
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
  user,
  transform = identityMap,
  filterData = {},
  TableFilter = DefaultTableFilter,
}) => {
  const { viewId } = useParams();
  const { falcor, falcorCache } = useFalcor();
  const [filters, setFilters] = useState(filterData);
  const pgEnv = useSelector(selectPgEnv);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pgEnv, activeViewId]);

  const dataLength = React.useMemo(() => {
    return get(
      falcorCache,
      ["dama", pgEnv, "viewsbyId", activeViewId, "data", "length"],
      "No Length"
    );
  }, [pgEnv, activeViewId, falcorCache]);

  const attributes = React.useMemo(() => {
    return get(source, "metadata", [])
      ?.filter((d) => ["integer", "string", "number"].includes(d.type))
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
        .then((d) => {
          console.timeEnd("getViewData", maxData);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pgEnv, activeViewId, falcorCache, dataLength]);

  let years = get(activeView, ["metadata", "years"], []);

  const { data } = React.useMemo(
    () => transform(tableData, attributes, filters, years, "group_by_county"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tableData, attributes, transform, filters]
  );

  return (
    <div>
      <div className="flex">
        <div className="flex-1 pl-3 pr-4 py-2">Table View</div>
        <TableFilter filters={filters} setFilters={setFilters} />
        <ViewSelector views={views} />
      </div>
      <div style={{ height: "600px" }}>
        {data?.length ? (
          <>
            <LineGraph
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
          </>
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

export default withAuth(TablePage);
