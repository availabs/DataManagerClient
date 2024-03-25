import React from "react"

import { Link, useNavigate } from "react-router-dom"

import get from "lodash/get";
//import moment from "moment"

import { DamaContext } from "~/pages/DataManager/store";

import DataFetchTable from "./components/DataFetchTable";

const ETL_CONTEXT_ATTRS = [
  "etl_status",
  "etl_context_id",
  "created_at",
  "terminated_at",
  "source_id",
  "parent_context_id",
  "type"
];


const LinkCell = ({ value }) => {
  const stopPropagation = React.useCallback(e => {
    e.stopPropagation();
  }, []);
  return (
    <div onClick={ stopPropagation }>
      <Link to={ `/task/${ value }` }
        className="w-full block border-b hover:border-blue-400 hover:text-blue-500"
      >
        { value }
      </Link>
    </div>
  )
}

const DateCell = ({ value }) => {
  return (
    <div>{ value.toString() }</div>
  )
}


const COLUMNS = [
  {
    accessor: "etl_context_id",
    Header: "ETL Context ID",
  },
  {
    accessor: "type",
    Header: "Type",
    Cell: (d) => {
      //Split off the ":initial"
      //replace hyphens with spaces
      //capitalize
      const formattedType = d.value.split(":")[0].replace("-"," ");
      return <div className="capitalize">{formattedType}</div>;
    }
  },
  {
    accessor: "source_name",
    Header: "Source Name",
  },
  { accessor: "created_at", Header: "Created At", Cell: DateCell },
  { accessor: "terminated_at", Header: "Terminated At", Cell: DateCell },
  { accessor: "etl_status", Header: "ETL Status" },
];

const TasksComponent = (props) => {
  const { pgEnv, falcor, falcorCache } = React.useContext(DamaContext);

  const fetchLength = React.useCallback(() => {
    return falcor.get([
      "dama", pgEnv, "latest", "events", "length"
    ]).then(res => {
      return get(res, ["json", "dama", pgEnv, "latest", "events", "length"], 0);
    });
  }, [falcor, pgEnv]);

  const fetchData = React.useCallback(
    (indices) => {
      return falcor
        .get(["dama", pgEnv, "latest", "events", indices, ETL_CONTEXT_ATTRS])
        .then((data) => {
          const sourceIds = Object.values(
            get(data, ["json", "dama", pgEnv, "latest", "events"])
          )
            .map((etlContext) => etlContext.source_id)
            .filter((sourceId) => !!sourceId);

          return falcor.get([
            "dama",
            pgEnv,
            "sources",
            "byId",
            sourceIds,
            "attributes",
            "name",
          ]);
        });
    },
    [falcor, pgEnv]
  );

  const parseData = React.useCallback(
    (indices) => {
      return indices
        .map((i) => ({
          ...get(falcorCache, ["dama", pgEnv, "latest", "events", i]),
        }))
        .map((r) => {
          if (r.source_id) {
            const sourceName = get(falcorCache, [
              "dama",
              pgEnv,
              "sources",
              "byId",
              r.source_id,
              "attributes",
              "name",
            ]);
            r.source_name = sourceName;
          }
          return r;
        })
        .filter((r) => Boolean(r.etl_context_id));
    },
    [falcorCache, pgEnv]
  );

  const navigate = useNavigate();

  const onRowClick = React.useCallback((e, row) => {
    if (e.ctrlKey) {
      window.open(`/task/${ row.values.etl_context_id }`, "_blank");
    }
    else {
      navigate(`/task/${ row.values.etl_context_id }`);
    }
  }, [navigate]);

  return (
    <div>
      <DataFetchTable columns={ COLUMNS }
        fetchLength={ fetchLength }
        fetchData={ fetchData }
        parseData={ parseData }
        onRowClick={ onRowClick }
        sortBy="created_at"
        sortOrder="desc"
        disableFilters
        disableSortBy/>
    </div>
  )
}
export default TasksComponent;
