import React from 'react'


import { checkApiResponse, getDamaApiRoutePrefix } from "../../utils/DamaControllerApi";
import {useHistory} from "react-router-dom";
import { useSelector } from "react-redux";
import { selectPgEnv } from "../../store";

const CallServer = async ({rtPfx, baseUrl, source, table, newVersion, history}) => {
    const url = new URL(
        `${rtPfx}/hazard_mitigation/usdaLoader`
    );

    url.searchParams.append("table_name", table);
    url.searchParams.append("source_name", source.name);
    url.searchParams.append("existing_source_id", source.source_id);
    url.searchParams.append("version", newVersion);

    const stgLyrDataRes = await fetch(url);

    await checkApiResponse(stgLyrDataRes);

    const resJson = await stgLyrDataRes.json();

    console.log('res', resJson);

    history.push(`${baseUrl}/source/${resJson.payload.source_id}/versions`);
}

const Create =  ({ source, newVersion, baseUrl })=> {
    const history = useHistory();
    const pgEnv = useSelector(selectPgEnv);
    const rtPfx = getDamaApiRoutePrefix(pgEnv);

    return (
        <div className='w-full'>
            <button
                className={`align-right p-2 border-2 border-gray-200`}
                onClick={() => CallServer({
                rtPfx, baseUrl, source, table: 'usda_crop_insurance_cause_of_loss', newVersion, history
            })}> Add New Source</button>
        </div>
    )
}

export default Create