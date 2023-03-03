import { useContext } from "react";

import {
  useEtlContext,
  EtlContextReact,
} from "pages/DataManager/utils/EtlContext";

import PublishStatus from "../../../constants/PublishStatus";

export function PublishButton({ publishOperation }) {
  const ctx = useContext(EtlContextReact);

  const {
    layerName,
    publishStatus,
    uploadErrMsg,
    lyrAnlysErrMsg,
    tableDescriptor,
  } = useEtlContext(ctx);

  if (!layerName || uploadErrMsg || lyrAnlysErrMsg || !tableDescriptor) {
    return "";
  }

  let publishButtonText = "Publish";
  let publishButtonBgColor = "#3b82f680";

  if (publishStatus === PublishStatus.IN_PROGRESS) {
    publishButtonText = "Publishing...";
    publishButtonBgColor = "#e5e7eb";
  }
  if (publishStatus === PublishStatus.PUBLISHED) {
    publishButtonText = "Published";
    publishButtonBgColor = "#e5e7eb";
  }

  if (publishStatus === PublishStatus.ERROR) {
    publishButtonText = "Publish Error";
    publishButtonBgColor = "red";
  }

  return (
    <span
      style={{
        display: "inline-block",
        marginTop: "20px",
        textAlign: "center",
        padding: "10px",
        fontSize: "25px",
        border: "2px solid",
        borderRadius: "25px",
        backgroundColor: publishButtonBgColor,
      }}
      onClick={() => {
        if (publishStatus === PublishStatus.AWAITING) {
          publishOperation(ctx);
        }
      }}
    >
      {publishButtonText}
    </span>
  );
}

export function PublishErrorMessage() {
  const ctx = useContext(EtlContextReact);

  const { etlContextId, publishStatus, publishErrMsg } = useEtlContext(ctx);

  if (publishStatus !== PublishStatus.ERROR) {
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
          backgroundColor: "red",
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
            Publish Error
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
              color: "darkred",
            }}
          >
            {publishErrMsg}
          </td>
          <td style={{ border: "1px solid", backgroundColor: "white" }}>
            {etlContextId}
          </td>
        </tr>
      </tbody>
    </table>
  );
}
