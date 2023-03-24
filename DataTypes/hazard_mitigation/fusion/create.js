import React from 'react'
import { useNavigate } from "react-router-dom";
import { checkApiResponse, getDamaApiRoutePrefix, getSrcViews } from "../../../utils/DamaControllerApi";
import { RenderVersions } from "../../../utils/macros"
import { useSelector } from "react-redux";
import { selectPgEnv } from "../../../store";

const CallServer = async ({rtPfx, baseUrl, source, newVersion, navigate, 
                              viewDL = {}, viewNCEIE = {}
                          }) => {
    const viewMetadata = [
        viewDL.view_id, viewNCEIE.view_id,
    ];

    const url = new URL(
        `${rtPfx}/hazard_mitigation/fusionLoader`
    );
    url.searchParams.append("source_name", source.name);
    url.searchParams.append("existing_source_id", source.source_id);
    url.searchParams.append("view_dependencies", JSON.stringify(viewMetadata));
    url.searchParams.append("version", newVersion);
    url.searchParams.append("table_name", 'fusion');
    
    url.searchParams.append("dl_table", viewDL.table_name);
    url.searchParams.append("dl_schema", viewDL.table_schema);

    url.searchParams.append("nceie_table", viewNCEIE.table_name);
    url.searchParams.append("nceie_schema", viewNCEIE.table_schema);

    const stgLyrDataRes = await fetch(url);

    await checkApiResponse(stgLyrDataRes);

    const resJson = await stgLyrDataRes.json();

    console.log('res', resJson);

    navigate(`${baseUrl}/source/${resJson.payload.source_id}/versions`);
}

const range = (start, end) => Array.from({length: (end - start)}, (v, k) => k + start);

const Create = ({ source, newVersion, baseUrl }) => {
    const navigate = useNavigate();
    const pgEnv = useSelector(selectPgEnv);

    // selected views/versions
    const [viewDL, setViewDL] = React.useState();
    const [viewNCEIE, setViewNCEIE] = React.useState();
    // all versions
    const [versionsDL, setVersionsDL] = React.useState({sources:[], views: []});
    const [versionsNCEIE, setVersionsNCEIE] = React.useState({sources:[], views: []});

    const rtPfx = getDamaApiRoutePrefix(pgEnv);

    React.useEffect(() => {
        async function fetchData() {
            await getSrcViews({rtPfx, setVersions: setVersionsDL, type: 'ofd'});
            await getSrcViews({rtPfx, setVersions: setVersionsNCEIE, type: 'ncei_storm_events_enhanced'});
        }
        fetchData();
    }, [rtPfx])

    return (
        <div className='w-full'>
            {RenderVersions({value: viewDL, setValue: setViewDL, versions: versionsDL, type: 'public_assistance_funded_projects_details_v1'})}
            {RenderVersions({value: viewNCEIE, setValue: setViewNCEIE, versions: versionsNCEIE, type: 'individuals_and_households_program_valid_registrations_v1'})}
            <button
                className={`align-right p-2 border-2 border-gray-200`}
                onClick={() =>
                    CallServer(
                        {rtPfx, baseUrl, source, newVersion,
                            viewDL: versionsDL.views.find(v => v.view_id === parseInt(viewDL)),
                            viewNCEIE: versionsNCEIE.views.find(v => v.view_id === parseInt(viewNCEIE)),
                            navigate
                        })}>
                Add New Source
            </button>
        </div>
    )
}

export default Create