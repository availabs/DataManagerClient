import { useContext } from "react";
import { useHistory } from "react-router-dom";

import { DAMA_HOST } from "config";

import {
  useEtlContext,
  EtlContextReact,
} from "pages/DataManager/utils/EtlContext";

export default function RequestStatusMessage() {
  const history = useHistory();
  const ctx = useContext(EtlContextReact);

  const { etlProcessFinalEvent } = useEtlContext(ctx);

  if (!etlProcessFinalEvent) {
    return "";
  }

  const {
    payload: { damaIntegrationDoneData },
  } = etlProcessFinalEvent;

  const tableRows = damaIntegrationDoneData.map(
    ({
      name,
      source_id,
      view_id,
      source_dependencies,
      view_dependencies,
      metadata = {},
    }) => {
      const { files = {} } = metadata;
      const fileTypes = Object.keys(files);

      const dowloadLinks = fileTypes.map((name) => {
        const { path } = files[name];

        return (
          <li>
            <a key={name} href={`${DAMA_HOST}/files${path}`}>
              {name}
            </a>
          </li>
        );
      });

      return (
        <tr key={name} style={{ border: "1px solid" }}>
          <td
            style={{
              border: "1px solid",
              padding: "10px",
              backgroundColor: "white",
              color: "darkblue",
              cursor: "pointer",
            }}
            onClick={() => {
              history.push(`/datasources/source/${source_id}`);
            }}
          >
            {name}
          </td>
          <td
            style={{
              border: "1px solid",
              backgroundColor: "white",
              paddingLeft: "10px",
              paddingRight: "10px",
            }}
          >
            {source_id}
          </td>
          <td style={{ border: "1px solid", backgroundColor: "white" }}>
            {view_id}
          </td>
          <td style={{ border: "1px solid", backgroundColor: "white" }}>
            {(source_dependencies || []).join(", ")}
          </td>
          <td style={{ border: "1px solid", backgroundColor: "white" }}>
            {(view_dependencies || []).join(", ")}
          </td>
          <td
            style={{
              border: "1px solid",
              backgroundColor: "white",
              color: "blue",
            }}
          >
            <ul>{dowloadLinks}</ul>
          </td>
        </tr>
      );
    }
  );

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
            Data Source Name
          </th>
          <th style={{ border: "1px solid", borderColor: "black" }}>
            {" "}
            Source ID
          </th>
          <th style={{ border: "1px solid", borderColor: "black" }}>
            {" "}
            View ID
          </th>
          <th style={{ border: "1px solid", borderColor: "black" }}>
            {" "}
            Source Dependencies
          </th>
          <th style={{ border: "1px solid", borderColor: "black" }}>
            {" "}
            View Dependencies
          </th>
          <th style={{ border: "1px solid", borderColor: "black" }}>
            {" "}
            Download Links
          </th>
        </tr>
      </thead>
      <tbody style={{ border: "1px solid" }}>{tableRows}</tbody>
    </table>
  );
}
