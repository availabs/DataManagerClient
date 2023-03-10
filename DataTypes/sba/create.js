import React from 'react'


import { checkApiResponse, getDamaApiRoutePrefix, getSrcViews } from "../../utils/DamaControllerApi";
import {useHistory} from "react-router-dom";
import { useSelector } from "react-redux";
import { selectPgEnv } from "../../store";
import { RenderVersions } from "../../utils/macros";

const CallServer = async ({rtPfx, baseUrl, source, viewCounty={}, viewState={}, table, newVersion, history}) => {
    const viewMetadata = [viewState.view_id,  viewCounty.view_id];

    const url = new URL(
        `${rtPfx}/hazard_mitigation/sbaLoader`
    );

    url.searchParams.append("table_name", table);
    url.searchParams.append("source_name", source.name);
    url.searchParams.append("existing_source_id", source.source_id);
    url.searchParams.append("view_dependencies", JSON.stringify(viewMetadata));
    url.searchParams.append("version", newVersion);

    url.searchParams.append("state_schema", viewState.table_schema);
    url.searchParams.append("state_table", viewState.table_name);
    url.searchParams.append("county_schema", viewCounty.table_schema);
    url.searchParams.append("county_table", viewCounty.table_name);

    const stgLyrDataRes = await fetch(url);

    await checkApiResponse(stgLyrDataRes);

    const resJson = await stgLyrDataRes.json();

    console.log('res', resJson);

    history.push(`${baseUrl}/source/${resJson.payload.source_id}/versions`);
}

const Create = ({ source, newVersion, baseUrl }) => {
    const history = useHistory();
    const pgEnv = useSelector(selectPgEnv);
    const rtPfx = getDamaApiRoutePrefix(pgEnv);

    const [viewState, setViewState] = React.useState();
    const [viewCounty, setViewCounty] = React.useState();

    const [versionsState, setVersionsState] = React.useState({sources:[], views: []});
    const [versionsCounty, setVersionsCounty] = React.useState({sources:[], views: []});

    React.useEffect(() => {
        async function fetchData() {
            await getSrcViews({rtPfx, setVersions: setVersionsState, type: 'tl_state'});
            await getSrcViews({rtPfx, setVersions: setVersionsCounty, type: 'tl_county'});
        }
        fetchData();
    }, [rtPfx])
    return (
        <div className='w-full'>
            {RenderVersions({value: viewState, setValue: setViewState, versions: versionsState, type: 'State'})}
            {RenderVersions({value: viewCounty, setValue: setViewCounty, versions: versionsCounty, type: 'County'})}
            <button
                className={`align-right p-2 border-2 border-gray-200`}
                onClick={() => CallServer({
                    rtPfx, baseUrl, source,
                    viewState: versionsState.views.find(v => v.view_id === parseInt(viewState)),
                    viewCounty: versionsCounty.views.find(v => v.view_id === parseInt(viewCounty)),
                    table: 'sba_disaster_loan_data_new', newVersion, history
            })}> Add New Source</button>
        </div>
    )
}

export default Create