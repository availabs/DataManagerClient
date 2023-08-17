import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useContext,
} from "react";
import { get, uniq } from "lodash";
import { Table } from "~/modules/avl-components/src";
import { useParams, useNavigate } from "react-router-dom";

import { DamaContext } from "~/pages/DataManager/store";

var years = Array.from(
  Array(new Date().getFullYear() - 2 - 2009),
  (_, i) => i + 2010
);
var geometries = ["county", "tracts"];

const ViewSelector = ({ views }) => {
  const { viewId, sourceId, page } = useParams();
  const navigate = useNavigate();

  return (
    <div className="flex">
      <div className="py-3.5 px-2 text-sm text-gray-400">Version : </div>
      <div className="flex-1">
        <select
          className="pl-3 pr-4 py-2.5 border border-blue-100 bg-blue-50 w-full bg-white mr-2 flex items-center justify-between text-sm"
          value={viewId}
          onChange={(e) =>
            navigate(`/source/${sourceId}/${page}/${e.target.value}`)
          }
        >
          {views
            ?.sort((a, b) => b.view_id - a.view_id)
            .map((v, i) => (
              <option key={i} className="ml-2 truncate" value={v.view_id}>
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

const TablePage = ({
  views,
  transform = identityMap,
  filterData = {},
  TableFilter = DefaultTableFilter,
}) => {
  const { viewId } = useParams();
  const [filters, _setFilters] = useState(filterData);
  const [acsTractGeoids, setAcsTractGeoids] = useState([]);
  const [tableColumns, setTableColumns] = useState([]);
  const setFilters = useCallback((filters) => {
    _setFilters((prev) => ({ ...prev, ...filters }));
  }, []);
  const { pgEnv, falcor, falcorCache } = useContext(DamaContext);

  const [geometry, year] = useMemo(() => {
    return [
      filters?.geometry?.value || "county",
      filters?.year?.value || 2019,
    ];
  }, [filters]);

  const viewYear = useMemo(() => year - (year % 10), [year]);
  const activeView = useMemo(() => {
    return get(
      views?.filter((d) => d.view_id === viewId),
      "[0]",
      views[0]
    );
  }, [views, viewId]);

  const activeViewId = useMemo(
    () => get(activeView, "view_id", null),
    [activeView]
  );

  const variables = useMemo(() => {
    return get(activeView, "metadata.variables", []).reduce((acc, cur) => {
      const key = cur?.label;
      acc[key] = cur?.value?.censusKeys || [];
      return acc;
    }, {});
  }, [activeView]);

  useEffect(() => {
    if (variables && Object.keys(variables) && Object.keys(variables).length) {
      setTableColumns(Object.keys(variables));
    }
  }
  , []);
  
  const geoids = useMemo(
    () => get(activeView, "metadata.counties", []),
    [activeView]
  );

  useEffect(() => {
    async function getViewData() {
      falcor
        .get([
          "dama",
          [pgEnv],
          "tiger",
          activeView?.view_dependencies,
          geoids.map(String),
          [viewYear],
          ["tracts"],
        ])
        .then(() => {
          const d = (geoids || []).reduce((a, c) => {
            a.push(
              ...get(
                falcorCache,
                [
                  "dama",
                  pgEnv,
                  "tiger",
                  activeView?.view_dependencies[0],
                  c,
                  viewYear,
                  "tracts",
                  "value",
                ],
                []
              )
            );
            return a;
          }, []);
          setAcsTractGeoids(uniq([...d]));
        });
    }
    getViewData();
  }, [falcorCache, pgEnv, activeViewId, activeView, geoids, viewYear]);

  const censusConfig = useMemo(
    () =>
      (Object.keys(variables) || []).reduce((acc, cur) => {
        acc = [...acc, ...variables[cur]];
        return acc;
      }, []),
    [variables]
  );

  useEffect(() => {
    async function getACSData() {
      const geos = geometry === "county" ? geoids : acsTractGeoids;
      if (geos.length > 0) falcor.chunk(["acs", geos, year, censusConfig]);
    }
    getACSData();
  }, [censusConfig, year, geometry]);

  const tableData = useMemo(() => {
    const geos = geometry === "county" ? geoids : acsTractGeoids;

    // ---------------- Keep this Code ---------------------------------
    // return (geos || []).reduce((a, c) => {
    //   let value = (censusConfig || []).reduce((aa, cc) => {
    //     const censusName =
    //       findKey(variables, (valueArray) => includes(valueArray, cc)) || null;
    //     let yearValue = (years || []).reduce((aaa, ccc) => {
    //       const v = get(falcorCache, ["acs", c, ccc, cc], null);
    //       const tableRow = {
    //         geoid: c,
    //         [`${censusName}`]: v === -666666666 ? null : v,
    //       };
    //       aaa = [...aaa, tableRow];
    //       return aaa;
    //     }, []);
    //     aa = [...aa, ...yearValue];
    //     return aa;
    //   }, []);
    //   a = [...a, ...value];
    //   return a;
    // }, []);
    // ---------------- Keep this Code ---------------------------------

    return (geos || []).reduce((a, c) => {
      let tableRow = {
        geoid: c,
      };
      (tableColumns || []).forEach((cc) => {
        let val = 0;
        (variables[cc] || []).forEach((v) => {
          const tmpVal = get(falcorCache, ["acs", c, year, v], 0);
          val += tmpVal > 0 ? tmpVal : 0;
        });

        tableRow[`${cc}`] = val === 0 ? null : val;
      });
      a = [...a, tableRow];
      return a;
    }, []);
  }, [activeViewId, falcorCache, geometry, tableColumns, year, variables]);

  const { data, columns } = useMemo(
    () => transform(tableData, ["geoid", ...tableColumns]),
    [tableData]
  );

  return (
    <div>
      <div className="flex">
        <div className="flex-1 pl-3 pr-4 py-2">Table View</div>
        <TableFilter
          filters={filters}
          setFilters={setFilters}
          variables={variables}
          years={years}
          geometries={geometries}
          data={data}
          columns={columns}
          tableColumns={tableColumns}
          setTableColumns={setTableColumns}
        />
        <ViewSelector views={views} />
      </div>
      <div className="max-w-6xl">
        <Table data={data} columns={columns} pageSize={50} />
      </div>
    </div>
  );
};

export default TablePage;
