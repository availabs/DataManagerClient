import React from "react";

const submitUpload = (props) => {
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
      console.log("publishFinalEvent", publishFinalEvent);

      const {
        payload: { damaViewId, damaSourceId: finalSourceId },
      } = publishFinalEvent;

      console.log("published view id", damaViewId);
    } catch (err) {}
  };
  runPublish();
};

export default function PublishAcs(props) {
  return (
    <div>
      <button
        className={`cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded`}
        onClick={() => submitUpload(props)}
      >
        {"New Publish"}
      </button>
    </div>
  );
}
