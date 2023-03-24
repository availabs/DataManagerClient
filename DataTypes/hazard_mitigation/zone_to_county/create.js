import React from 'react'


import { checkApiResponse, getDamaApiRoutePrefix } from "../../../utils/DamaControllerApi";
import {useNavigate} from "react-router-dom";
import { useSelector } from "react-redux";
import { selectPgEnv } from "../../../store";


const CallServer = async ({rtPfx, baseUrl, source, newVersion, navigate}) => {
    const url = new URL(
        `${rtPfx}/hazard_mitigation/zoneToCountyLoader`
    );

    url.searchParams.append("table_name", 'zone_to_county');
    url.searchParams.append("source_name", source.name);
    url.searchParams.append("existing_source_id", source.source_id);
    url.searchParams.append("version", newVersion);

    const stgLyrDataRes = await fetch(url);

    await checkApiResponse(stgLyrDataRes);

    const resJson = await stgLyrDataRes.json();

    console.log('res', resJson);

    navigate(`${baseUrl}/source/${resJson.payload.source_id}/versions`);
}

const Create =  ({ source, newVersion, baseUrl }) => {
    const navigate = useNavigate();
    const pgEnv = useSelector(selectPgEnv);
    const rtPfx = getDamaApiRoutePrefix(pgEnv);

    return (
        <div className='w-full'>
            <button
                className={`align-right p-2 border-2 border-gray-200`}
                onClick={() => CallServer({
                rtPfx, baseUrl, source, newVersion, navigate
            })}> Add New Source</button>
        </div>
    )
}

export default Create