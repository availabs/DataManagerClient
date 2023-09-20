import React, {useState} from 'react'


import {checkApiResponse, getDamaApiRoutePrefix, getSrcViews} from "../../../utils/DamaControllerApi";
import { useNavigate } from "react-router-dom";

import { DamaContext } from "../../../store";
import {RenderVersions} from "../../../utils/macros.jsx";
const CallServer = async ({rtPfx, baseUrl, source, newVersion, navigate, viewPa, viewDDS}) => {
    const viewMetadata = [viewPa.view_id, viewDDS.view_id];


    const url = new URL(
        `${rtPfx}/hazard_mitigation/pa_v1_enhanced`
    );

    url.searchParams.append("table_name", 'pa_funded_projects_enhanced');
    url.searchParams.append("source_name", source.name);
    url.searchParams.append("existing_source_id", source.source_id);
    url.searchParams.append("view_dependencies", JSON.stringify(viewMetadata));
    url.searchParams.append("version", newVersion);

    url.searchParams.append("ofd_schema", viewPa.table_schema);
    url.searchParams.append("pa_table", viewPa.table_name);
    url.searchParams.append("dds_table", viewDDS.table_name);

    const stgLyrDataRes = await fetch(url);

    await checkApiResponse(stgLyrDataRes);

    const resJson = await stgLyrDataRes.json();

    console.log('res', resJson);

    navigate(`${baseUrl}/source/${resJson.payload.source_id}/versions`);
}

const Create = ({ source, newVersion, baseUrl }) => {
    const navigate = useNavigate();
    const { pgEnv } = React.useContext(DamaContext)
    const rtPfx = getDamaApiRoutePrefix(pgEnv);

    const [viewPa, setViewPa] = useState();
    const [viewDDS, setViewDDS] = useState();

    const [versionsPa, setVersionsPa] = React.useState({sources:[], views: []});
    const [versionsDDS, setVersionsDDS] = React.useState({sources:[], views: []});

    React.useEffect(() => {
        async function fetchData() {
            await getSrcViews({rtPfx, setVersions: setVersionsPa,  type: 'public_assistance_funded_projects_details_v1'});
            await getSrcViews({rtPfx, setVersions: setVersionsDDS,  type: 'disaster_declarations_summaries_v2'});
        }
        fetchData();
    }, [rtPfx])

    return (
        <div className='w-full'>
            {RenderVersions({value: viewPa, setValue: setViewPa, versions: versionsPa, type: 'PA'})}
            {RenderVersions({value: viewDDS, setValue: setViewDDS, versions: versionsDDS, type: 'Disaster Declarations Summary'})}

            <button
                className={`align-right p-2 border-2 border-gray-200`}
                onClick={() => CallServer({
                rtPfx, baseUrl, source, newVersion, navigate,
                    viewPa: versionsPa.views.find(v => v.view_id === parseInt(viewPa)),
                    viewDDS: versionsDDS.views.find(v => v.view_id === parseInt(viewDDS)),
                })}> Add New Source</button>
        </div>
    )
}

export default Create