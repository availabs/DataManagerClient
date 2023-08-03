import React, { useState, useContext } from "react";

import {
  checkApiResponse,
  getDamaApiRoutePrefix,
} from "../../../utils/DamaControllerApi";
import { useNavigate } from "react-router-dom";

import { DamaContext } from "../../../store";
const CallServer = async ({ rtPfx, source, newVersion, navigate }) => {
  const url = new URL(`${rtPfx}/hazard_mitigation/tigerFullDownloadAction`);

  url.searchParams.append("source_name", source.name);
  url.searchParams.append("existing_source_id", source.source_id);
  url.searchParams.append("version", newVersion);

  const stgLyrDataRes = await fetch(url);

  await checkApiResponse(stgLyrDataRes);

  const { etl_context_id, source_id } = await stgLyrDataRes.json();

  if (source_id && etl_context_id) {
    navigate(`/source/${source_id}/uploads/${etl_context_id}`);
  }
};

const Create = ({ source, newVersion, baseUrl }) => {
  const navigate = useNavigate();
  const { pgEnv } = useContext(DamaContext);

  const rtPfx = getDamaApiRoutePrefix(pgEnv);

  return (
    <div className="w-full">
      <button
        className={`align-right p-2 border-2 border-gray-200`}
        onClick={() =>
          CallServer({
            rtPfx,
            baseUrl,
            source,
            newVersion,
            navigate,
          })
        }
      >
        Add New Source
      </button>
    </div>
  );
};

export default Create;
