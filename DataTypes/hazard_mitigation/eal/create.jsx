import React from 'react'
import { useNavigate } from "react-router-dom";
import { checkApiResponse, getDamaApiRoutePrefix, getSrcViews } from "../../../utils/DamaControllerApi";
import { RenderVersions } from "../../../utils/macros"

import { DamaContext } from "../../../store";

const CallServer = async ({rtPfx, baseUrl, source, newVersion, navigate, viewHlr={}, viewNRI={}}) => {
    const viewMetadata = [viewHlr.view_id, viewNRI.view_id];

    const url = new URL(
        `${rtPfx}/hazard_mitigation/ealLoader`
    );

    url.searchParams.append("table_name", 'eal');
    url.searchParams.append("source_name", source.name);
    url.searchParams.append("existing_source_id", source.source_id);
    url.searchParams.append("view_dependencies", JSON.stringify(viewMetadata));
    url.searchParams.append("version", newVersion);

    url.searchParams.append("hlr_schema", viewHlr.table_schema);
    url.searchParams.append("hlr_table", viewHlr.table_name);
    url.searchParams.append("nri_schema", viewNRI.table_schema);
    url.searchParams.append("nri_table", viewNRI.table_name);

    const stgLyrDataRes = await fetch(url);

    await checkApiResponse(stgLyrDataRes);

    const resJson = await stgLyrDataRes.json();

    console.log('res', resJson);

    navigate(`${baseUrl}/source/${resJson.payload.source_id}/versions`);
}

const Create = ({ source, newVersion, baseUrl }) => {
    const navigate = useNavigate();
    const { pgEnv } = React.useContext(DamaContext)

    // selected views/versions
    const [viewHlr, setViewHlr] = React.useState();
    const [viewNRI, setViewNRI] = React.useState();
    // all versions
    const [versionsHlr, setVersionsHlr] = React.useState({sources:[], views: []});
    const [versionsNRI, setVersionsNRI] = React.useState({sources:[], views: []});

    const rtPfx = getDamaApiRoutePrefix(pgEnv);

    React.useEffect(() => {
        async function fetchData() {
            await getSrcViews({rtPfx, setVersions: setVersionsHlr, type: 'hlr'});
            await getSrcViews({rtPfx, setVersions: setVersionsNRI, type: 'nri'});
        }
        fetchData();
    }, [rtPfx])

    return (
        <div className='w-full'>
            {RenderVersions({value: viewHlr, setValue: setViewHlr, versions: versionsHlr, type: 'hlr'})}
            {RenderVersions({value: viewNRI, setValue: setViewNRI, versions: versionsNRI, type: 'NRI'})}
            <button
                className={`align-right p-2 border-2 border-gray-200`}
                onClick={() =>
                    CallServer(
                        {rtPfx, baseUrl, source, newVersion,
                            viewHlr: versionsHlr.views.find(v => v.view_id === parseInt(viewHlr)),
                            viewNRI: versionsNRI.views.find(v => v.view_id === parseInt(viewNRI)),
                            navigate
                        })}>
                Add New Source
            </button>
        </div>
    )
}

export default Create