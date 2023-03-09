import React from 'react'


import { checkApiResponse, getDamaApiRoutePrefix } from "../../utils/DamaControllerApi";
import {useHistory} from "react-router-dom";
import { useSelector } from "react-redux";
import { selectPgEnv } from "../../store";

const CallServer = async ({rtPfx, source,  table, newVersion, history}) => {
    const url = new URL(
        `${rtPfx}/hazard_mitigation/sbaLoader`
    );

    url.searchParams.append("table_name", table);
    url.searchParams.append("source_name", source.name);
    url.searchParams.append("existing_source_id", source.source_id);
    url.searchParams.append("version", newVersion);

    const stgLyrDataRes = await fetch(url);

    await checkApiResponse(stgLyrDataRes);

    const resJson = await stgLyrDataRes.json();

    console.log('res', resJson);

    history.push(`/source/${resJson.payload.source_id}/views`);
}

const Create = ({ source, user, newVersion }) => {
    const history = useHistory();
    const pgEnv = useSelector(selectPgEnv);
    const rtPfx = getDamaApiRoutePrefix(pgEnv);

    return (
        <div className='w-full'>
            <button
                className={`align-right p-2 border-2 border-gray-200`}
                onClick={() => CallServer({
                rtPfx, source, userId: user.id, table: 'sba_disaster_loan_data_new', newVersion, history
            })}> Add New Source</button>
        </div>
    )
}

export default Create