import React from "react"

import { useParams } from "react-router-dom"

import get from "lodash/get";
//import moment from "moment"

import { DamaContext } from "~/pages/DataManager/store";

import DataFetchTable from "./components/DataFetchTable";

const DateCell = ({ value, ...props }) => {
  // moment(value).format("YYYY-MM-DD HH:mm:ss A")
  return (
    <div>{ value.toString() }</div>
  )
}

const COLUMNS = [
  { accessor: "etl_context_id",
    Header: "ETL Context ID"
  },
  { accessor: "created_at",
    Header: "Created At",
    Cell: DateCell
  },
  { accessor: "type",
    Header: "Type"
  }
]

const TaskPageComponent = props => {
  const { etl_context_id } = useParams();

  const { pgEnv, falcor, falcorCache } = React.useContext(DamaContext);

  const fetchLength = React.useCallback(() => {
    return falcor.get([
      "dama", pgEnv, "latest", "events", "for", etl_context_id, "length"
    ]).then(res => {
      return get(res, ["json", "dama", pgEnv, "latest", "events", "for", etl_context_id, "length"], 0);
    });
  }, [falcor, pgEnv, etl_context_id]);

  const fetchData = React.useCallback(indices => {
    return falcor.get([
      "dama", pgEnv, "latest", "events", "for", etl_context_id, indices,
      ["etl_context_id", "created_at", "type"]
    ]);
  }, [falcor, pgEnv, etl_context_id]);

  const parseData = React.useCallback(indices => {
    return indices.map(i => {
      return {
        ...get(falcorCache,
          ["dama", pgEnv, "latest", "events", "for", etl_context_id, i]
        )
      };
    }).filter(r => Boolean(r.etl_context_id));
  }, [falcorCache, pgEnv, etl_context_id]);

  return (
    <div>
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
