import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useParams, useHistory } from "react-router-dom";

import { Modal } from "modules/avl-components/src";

import { getEtlContextsForDamaSourceId } from "pages/DataManager/utils/FalcorApi";

import { selectPgEnv } from "pages/DataManager/store";

const RawJsonModal = (props) => {
  const { selectedEvent, close } = props;

  const show = !!selectedEvent;

  return (
    <Modal open={show}>
      <div className="relative">
        <div
          onClick={close}
          className={`
            absolute top-1 right-1
            rounded hover:bg-gray-400
            flex items-center justify-center
            cursor-pointer
          `}
        >
          <span className="fa fa-close" />
        </div>

        <div className="w-full h-full overflow-y-auto">
          <pre>{JSON.stringify(selectedEvent, null, 4)}</pre>
        </div>
      </div>
    </Modal>
  );
};

function EtlEventsContextTable(etlContexts) {
  const history = useHistory();

  const [eventIdx, setEventIdx] = useState(-1);

  const etlEvents = etlContexts && etlContexts.map(({ events }) => events);

  const selectedEvent = (etlEvents && etlEvents[eventIdx]) || null;

  const close = () => setEventIdx(-1);

  const modal = RawJsonModal({ selectedEvent, close });

  if (!etlContexts) {
    return "";
  }

  const tableRows = etlEvents
    .map((events, i) => {
      const { INITIAL: initialEvent, LATEST: { type = "INITIAL" } = {} } =
        events;

      if (
        initialEvent.type !==
        "dama/data_types/npmrds/dt-npmrds_travel_times_export_ritis:INITIAL"
      ) {
        return null;
      }

      const {
        payload: {
          state = null,
          start_date = null,
          end_date = null,
          is_expanded = null,
        } = {},
        meta: { etl_context_id },
      } = initialEvent;

      const latestEventType = type.replace(/.*:/g, "");

      return (
        <tr key={`event=${i}`} style={{ border: "1px solid" }}>
          <td style={{ border: "1px solid", backgroundColor: "white" }}>
            <span
              style={{ cursor: "pointer", color: "blue" }}
              onClick={() => {
                history.push(`/etl-context/${etl_context_id}`);
              }}
            >
              {etl_context_id}
            </span>
          </td>
          <td style={{ border: "1px solid", backgroundColor: "white" }}>
            {state}
          </td>
          <td style={{ border: "1px solid", backgroundColor: "white" }}>
            {start_date}
          </td>
          <td style={{ border: "1px solid", backgroundColor: "white" }}>
            {end_date}
          </td>
          <td style={{ border: "1px solid", backgroundColor: "white" }}>
            {is_expanded ? "true" : "false"}
          </td>
          <td
            style={{
              border: "1px solid",
              color: "blue",
              backgroundColor: "white",
              cursor: "pointer",
            }}
            onClick={() => setEventIdx(i)}
          >
            {latestEventType}
          </td>
        </tr>
      );
    })
    .filter(Boolean);

  return (
    <div>
      <table
        className="w-2/3"
        style={{
          margin: "40px auto",
          textAlign: "center",
          border: "1px solid",
          borderColor: "back",
        }}
      >
        <thead
          style={{
            color: "black",
            backgroundColor: "#d5e7ff",
            fontWeight: "bolder",
            textAlign: "center",
            marginTop: "40px",
            fontSize: "20px",
            border: "1px solid",
            borderColor: "black",
          }}
        >
          <tr>
            <th style={{ border: "1px solid", borderColor: "black" }}>
              {" "}
              ETL Context ID
            </th>
            <th style={{ border: "1px solid", borderColor: "black" }}>
              {" "}
              State
            </th>
            <th style={{ border: "1px solid", borderColor: "black" }}>
              {" "}
              Start Date
            </th>
            <th style={{ border: "1px solid", borderColor: "black" }}>
              {" "}
              End Date
            </th>
            <th style={{ border: "1px solid", borderColor: "black" }}>
              {" "}
              Expanded Map
            </th>
            <th style={{ border: "1px solid", borderColor: "black" }}>
              {" "}
              Latest Event Type
            </th>
          </tr>
        </thead>
        <tbody style={{ border: "1px solid" }}>{tableRows}</tbody>
      </table>
      {modal}
    </div>
  );
}

export default function EtlContextsStatusTable() {
  const [etlContextStatus, setEtlContextStatus] = React.useState("RUNNING");
  const [etlContexts, setEtlContexts] = React.useState(null);

  const pgEnv = useSelector(selectPgEnv);

  const { sourceId } = useParams();

  const otherStatus = etlContextStatus === "RUNNING" ? "STOPPED" : "RUNNING";

  React.useEffect(() => {
    (async () => {
      if (etlContextStatus !== null) {
      }

      const ctxs = await getEtlContextsForDamaSourceId(
        pgEnv,
        sourceId,
        etlContextStatus
      );

      setEtlContexts(ctxs || []);
    })();
  }, [pgEnv, sourceId, etlContextStatus]);

  const table = EtlEventsContextTable(etlContexts);

  if (!etlContexts) {
    return "";
  }

  const buttonColor = etlContextStatus === "RUNNING" ? "red" : "green";
  const buttonClassName = `text-white font-bold py-2 px-4 border rounded`;

  const titleColor = etlContextStatus === "RUNNING" ? "green" : "red";

  console.log(buttonClassName);

  const toggle = (
    <div>
      <button
        style={{ backgroundColor: buttonColor }}
        className={buttonClassName}
        onClick={() => setEtlContextStatus(otherStatus)}
      >
        Show {otherStatus}
      </button>
      <div style={{ paddingTop: "20px" }}>
        <h2
          style={{
            fontSize: "25px",
            textAlign: "center",
            marginBottom: "15px",
            fontWeight: "bold",
          }}
        >
          NPMRDS Travel Times Exports{" "}
          <span style={{ color: titleColor }}>{etlContextStatus}</span> ETL
          Processes
        </h2>
      </div>
      {table}
    </div>
  );

  return <div>{toggle}</div>;
}
