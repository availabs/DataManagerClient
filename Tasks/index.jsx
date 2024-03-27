import React from "react"

import { useNavigate } from "react-router-dom"

import get from "lodash/get";
import moment from "moment"

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

const StartedAtCell = (d) => {
  const { value } = d;
  const now = moment(new Date());
  const cellMoment = moment(value);
  const displayTimeThreshold = moment( now.subtract(14, 'days'));

  let formattedDate; 
  if( cellMoment.isAfter(displayTimeThreshold) ){
    formattedDate = moment(value).format("DD MMMM hh:mm a");
  }
  else{
    formattedDate = moment(value).format("MMMM Do YYYY");
  }

  return (
    <div>{ formattedDate }</div>
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
    Cell: ({value}) => {
      //Split off the ":initial"
      //replace hyphens with spaces
      //capitalize
      const formattedType = value.split(":")[0].replace("-"," ");
      return <div className="capitalize">{formattedType}</div>;
    }
  },
  {
    accessor: "source_name",
    Header: "Source Name",
  },
  { accessor: "created_at", Header: "Started", Cell: StartedAtCell },
  { accessor: "duration", Header: "Duration"},
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

          if(r.terminated_at){
            const terminatedAtTime = moment(r.terminated_at);
            const createdAtTime = moment(r.created_at);
            const diffTime = terminatedAtTime.diff(createdAtTime, 'seconds');

            if(diffTime < 2 ){
              const duration = moment.duration(terminatedAtTime.diff(createdAtTime)).as('milliseconds');
              r.duration = `${Math.round(duration)} ms`
            }
            else if(diffTime < 600) {
              const duration = moment.duration(terminatedAtTime.diff(createdAtTime)).as('seconds');
              r.duration = `${Math.round(duration)} seconds`
            }
            else{
              const duration = moment.duration(terminatedAtTime.diff(createdAtTime)).as('minutes');
              r.duration = `${Math.round(duration)} minutes`
            }
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
