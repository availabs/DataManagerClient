import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { get } from "lodash";
import { useFalcor } from "~/modules/avl-components/src";
import { withAuth } from "~/modules/avl-components/src";

import { DamaContext } from "~/pages/DataManager/store";

import ListUploads from "./list";
import Upload from "./view";

const UploadsPage = ({ source }) => {
  const [etlContextStatus, setEtlContextStatus] = useState("RUNNING");
  const {pgEnv} = React.useContext(DamaContext);
  const { viewId, page } = useParams();
  const { falcor, falcorCache } = useFalcor();

  let { source_id: sourceId } = source || {};
  
  if (page === "uploads" && viewId) {
    return <Upload ctxId={viewId} />;
  }

  useEffect(() => {
    async function getCtxs() {
      sourceId = Number(sourceId);

      await falcor.get([
        "dama",
        pgEnv,
        "etlContexts",
        "byDamaSourceId",
        sourceId,
        etlContextStatus,
      ]);
    }
    getCtxs();
  }, [falcor, pgEnv, sourceId, etlContextStatus]);

  const ctxs = useMemo(() => {
    return get(falcorCache, [
      "dama",
      pgEnv,
      "etlContexts",
      "byDamaSourceId",
      sourceId,
      etlContextStatus,
      "value",
    ]);
  }, [falcorCache, sourceId, etlContextStatus]);

  const getTabClass = (status) => {
    if (status) {
      return "inline-block px-4 py-3 text-white bg-blue-600 rounded-lg active cursor-pointer";
    }
    return "inline-block px-4 py-3 rounded-lg hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-white cursor-pointer";
  };

  return (
    <>
      <div className="flex">
        <div className="flex-1 pl-3 pr-4 py-2">Upload Views</div>

        <ul className="flex flex-wrap text-sm font-medium text-center text-gray-500 dark:text-gray-400">
          <li className="mr-2" onClick={() => setEtlContextStatus("RUNNING")}>
            <span
              className={
                etlContextStatus === "RUNNING"
                  ? getTabClass(true)
                  : getTabClass(false)
              }
            >
              Running
            </span>
          </li>
          <li className="mr-2" onClick={() => setEtlContextStatus("STOPPED")}>
            <span
              className={
                etlContextStatus === "STOPPED"
                  ? getTabClass(true)
                  : getTabClass(false)
              }
            >
              Stopped
            </span>
          </li>
        </ul>
      </div>
      <ListUploads uploads={ctxs} />
    </>
  );
};

export default withAuth(UploadsPage);
