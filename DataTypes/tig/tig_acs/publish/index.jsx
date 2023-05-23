import React from "react";
import { useNavigate } from "react-router-dom";

const submitUpload = (props, navigate) => {
  const runPublish = async () => {
    try {
      const publishData = {
        source_id: null,
        source_values: {
          name: props?.source?.name || "New Source",
          type: props?.source?.type || "tig_acs",
        },
        viewMetadata: props?.viewMetadata,
        viewDependency: props?.viewDependency?.id,
        etlContextId: props?.etlContextId,
      };

      const res = await fetch(`${props?.damaServerPath}/gis-dataset/publish`, {
        method: "POST",
        body: JSON.stringify(publishData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const publishFinalEvent = await res.json();

      const {
        payload: { damaViewId, damaSourceId: finalSourceId, etlContextId },
      } = publishFinalEvent;

      if (damaViewId && finalSourceId && etlContextId) {
        navigate(`/source/${finalSourceId}`);
      }
    } catch (err) {
      console.error("new Error", err);
    }
  };
  runPublish();
};

export default function PublishAcs(props) {
  const navigate = useNavigate();
  return (
    <div>
      <button
        className={`cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded`}
        onClick={() => submitUpload(props, navigate)}
      >
        {"New Publish"}
      </button>
    </div>
  );
}
