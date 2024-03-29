import React from "react"

import { useParams } from "react-router-dom"

import get from "lodash/get";
//import moment from "moment"

import { DamaContext } from "~/pages/DataManager/store";

import DataFetchTable from "./components/DataFetchTable";
import { Breadcrumbs } from "./components/Breadcrumbs";


const DateCell = ({ value, ...props }) => {
  // moment(value).format("YYYY-MM-DD HH:mm:ss A")
  return (
    <div>{ value.toString() }</div>
  )
}

const COLUMNS = [
  { accessor: "etl_context_id", Header: "ETL Context ID" },
  {
    accessor: "event_id",
    Header: "Event ID",
  },
  { accessor: "created_at", Header: "Created At", Cell: DateCell },
  { accessor: "type", Header: "Type" },
];

const TaskPageComponent = props => {
  const { etl_context_id } = useParams();

  const { pgEnv, falcor, falcorCache } = React.useContext(DamaContext);

  const EVENT_LENGTH_PATH = [
    "dama",
    pgEnv,
    "etlContexts",
    etl_context_id,
    "allEvents",
    "length",
  ];

  const generateAllEventsPath = (indices) => ([
    "dama",
    pgEnv,
    "etlContexts",
    etl_context_id,
    "allEvents",
    indices,
    ["event_id","etl_context_id", "created_at", "type"]
  ])

  const fetchLength = React.useCallback(() => {
    return falcor.get(EVENT_LENGTH_PATH);
  }, [falcor, pgEnv, etl_context_id]);

  const fetchData = React.useCallback(indices => {
    return falcor.get(generateAllEventsPath(indices));
  }, [falcor, pgEnv, etl_context_id]);

  const parseData = React.useCallback(indices => {
    return indices.map(i => {
      const dataPath = generateAllEventsPath(i);
      dataPath.pop(); //Removes `attr` from path
      return {
        ...get(falcorCache, dataPath),
      };
    }).filter(r => Boolean(r.etl_context_id));
  }, [falcorCache, pgEnv, etl_context_id]);

  return (
    <div>
      <Breadcrumbs />
      <DataFetchTable columns={ COLUMNS }
        fetchLength={ fetchLength }
        fetchData={ fetchData }
        parseData={ parseData }
        sortBy="created_at"
        sortOrder="desc"
        disableFilters
        disableSortBy/>
    </div>
  )
}
export default TaskPageComponent;
