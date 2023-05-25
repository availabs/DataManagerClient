import React from 'react'


import { checkApiResponse, getDamaApiRoutePrefix, getSrcViews } from "../../../utils/DamaControllerApi";
import {useNavigate} from "react-router-dom";

import { DamaContext } from "../../../store";
import { RenderVersions } from "../../../utils/macros";

const CallServer = async ({rtPfx, baseUrl, source, table, newVersion, navigate, viewUSDA, viewDDS}) => {
    const viewMetadata = [viewUSDA.view_id, viewDDS.view_id];
    
    const url = new URL(
        `${rtPfx}/hazard_mitigation/usda_enhanced`
    );

    url.searchParams.append("table_name", table);
    url.searchParams.append("source_name", source.name);
    url.searchParams.append("existing_source_id", source.source_id);
    url.searchParams.append("view_dependencies", JSON.stringify(viewMetadata));
    url.searchParams.append("version", newVersion);

    url.searchParams.append("usda_schema", viewUSDA.table_schema);
    url.searchParams.append("usda_table", viewUSDA.table_name);
    url.searchParams.append("dds_schema", viewDDS.table_schema);
    url.searchParams.append("dds_table", viewDDS.table_name);
    
    const stgLyrDataRes = await fetch(url);

    await checkApiResponse(stgLyrDataRes);

    const resJson = await stgLyrDataRes.json();

    console.log('res', resJson);

    navigate(`${baseUrl}/source/${resJson.payload.source_id}/versions`);
}

const Create =  ({ source, newVersion, baseUrl })=> {
    const navigate = useNavigate();
    const { pgEnv } = React.useContext(DamaContext)
    const rtPfx = getDamaApiRoutePrefix(pgEnv);

    const [viewUSDA, setViewUSDA] = React.useState();
    const [viewDDS, setViewDDS] = React.useState();
    const [versionsUSDA, setVersionsUSDA] = React.useState({sources:[], views: []});
    const [versionsDDS, setVersionsDDS] = React.useState({sources:[], views: []});

    React.useEffect(() => {
        async function fetchData() {
            await getSrcViews({rtPfx, setVersions: setVersionsUSDA, type: 'usda_crop_insurance_cause_of_loss'});
            await getSrcViews({rtPfx, setVersions: setVersionsDDS, type: 'disaster_declarations_summaries_v2'});

        }
        fetchData()
    }, [rtPfx]);
    
    return (
        <div className='w-full'>
            {RenderVersions({value: viewUSDA, setValue: setViewUSDA, versions: versionsUSDA, type: 'USDA'})}
            {RenderVersions({value: viewDDS, setValue: setViewDDS, versions: versionsDDS, type: 'Disaster Declarations Summary'})}
            <button
                className={`align-right p-2 border-2 border-gray-200`}
                onClick={() => CallServer({
                rtPfx, baseUrl, source, table: 'usda_crop_insurance_cause_of_loss_enhanced', newVersion, navigate,
                    viewUSDA: versionsUSDA.views.find(v => v.view_id === parseInt(viewUSDA)),
                    viewDDS: versionsDDS.views.find(v => v.view_id === parseInt(viewDDS)),
                })}> Add New Source</button>
        </div>
    )
}

export default Create