import { useContext } from "react";

import {
  useEtlContext,
  EtlContextReact,
} from "pages/DataManager/utils/EtlContext";

export default function RequestStatusMessage() {
  const ctx = useContext(EtlContextReact);

  const {
    etlContextId,
    npmrdsDownloadName,
    requestStatusMsg,
    etlProcessFinalEvent,
  } = useEtlContext(ctx);

  // We use the EtlProcessDoneDataDisplay once we have the etlProcessFinalEvent.
  if (etlProcessFinalEvent) {
    return "";
  }

  if (!requestStatusMsg) {
    return "";
  }

  return (
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
            Request Status
          </th>
          <th style={{ border: "1px solid", borderColor: "black" }}>
            {" "}
            NPMRDS TravelTimes Export Name
          </th>
          <th style={{ border: "1px solid", borderColor: "black" }}>
            {" "}
            ETL Context ID
          </th>
        </tr>
      </thead>
      <tbody style={{ border: "1px solid" }}>
        <tr style={{ border: "1px solid" }}>
          <td
            style={{
              border: "1px solid",
              padding: "10px",
              backgroundColor: "white",
              color: "darkblue",
            }}
          >
            {requestStatusMsg}
          </td>
          <td
            style={{
              border: "1px solid",
              backgroundColor: "white",
              paddingLeft: "10px",
              paddingRight: "10px",
            }}
          >
            {npmrdsDownloadName || "unassigned"}
          </td>
          <td style={{ border: "1px solid", backgroundColor: "white" }}>
            {etlContextId}
          </td>
        </tr>
      </tbody>
    </table>
  );
}
