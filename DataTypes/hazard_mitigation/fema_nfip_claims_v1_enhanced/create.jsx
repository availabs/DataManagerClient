import React from 'react'


import { checkApiResponse, getDamaApiRoutePrefix, getSrcViews } from "../../../utils/DamaControllerApi";
import {useNavigate} from "react-router-dom";

import { DamaContext } from "../../../store";
import { RenderVersions } from "../../../utils/macros";

const CallServer = async ({rtPfx, baseUrl, source, newVersion, navigate, viewNFIP, viewDDS, viewCounty}) => {
    const viewMetadata = [viewNFIP.view_id, viewDDS.view_id, viewCounty.view_id];

    const url = new URL(
        `${rtPfx}/hazard_mitigation/nfip_v1_enhanced`
    );

    url.searchParams.append("table_name", 'fima_nfip_claims_v1_enhanced');
    url.searchParams.append("source_name", source.name);
    url.searchParams.append("existing_source_id", source.source_id);
    url.searchParams.append("view_dependencies", JSON.stringify(viewMetadata));
    url.searchParams.append("version", newVersion);

    url.searchParams.append("nfip_schema", viewNFIP.table_schema);
    url.searchParams.append("nfip_table", viewNFIP.table_name);
    url.searchParams.append("dds_schema", viewDDS.table_schema);
    url.searchParams.append("dds_table", viewDDS.table_name);
    url.searchParams.append("county_schema", viewCounty.table_schema);
    url.searchParams.append("county_table", viewCounty.table_name);

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

    const [viewNFIP, setViewNFIP] = React.useState();
    const [viewDDS, setViewDDS] = React.useState();
    const [viewCounty, setViewCounty] = React.useState();
    const [versionsNFIP, setVersionsNFIP] = React.useState({sources:[], views: []});
    const [versionsDDS, setVersionsDDS] = React.useState({sources:[], views: []});
    const [versionsCounty, setVersionsCounty] = React.useState({sources:[], views: []});

    React.useEffect(() => {
        async function fetchData() {
            await getSrcViews({rtPfx, setVersions: setVersionsNFIP, type: 'fima_nfip_claims_v1'});
            await getSrcViews({rtPfx, setVersions: setVersionsDDS, type: 'disaster_declarations_summaries_v2'});
            await getSrcViews({rtPfx, setVersions: setVersionsCounty, type: 'tl_county'});
        }
        fetchData()
    }, [rtPfx]);

    return (
        <div className='w-full'>
            {RenderVersions({value: viewNFIP, setValue: setViewNFIP, versions: versionsNFIP, type: 'NFIP'})}
            {RenderVersions({value: viewDDS, setValue: setViewDDS, versions: versionsDDS, type: 'Disaster Declarations Summary'})}
            {RenderVersions({value: viewCounty, setValue: setViewCounty, versions: versionsCounty, type: 'County'})}
            <button
                className={`align-right p-2 border-2 border-gray-200`}
                onClick={() => CallServer({
                rtPfx, baseUrl, source, newVersion, navigate,
                    viewNFIP: versionsNFIP.views.find(v => v.view_id === parseInt(viewNFIP)),
                    viewDDS: versionsDDS.views.find(v => v.view_id === parseInt(viewDDS)),
                    viewCounty: versionsCounty.views.find(v => v.view_id === parseInt(viewCounty)),
            })}> Add New Source</button>
        </div>
    )
}

export default Create