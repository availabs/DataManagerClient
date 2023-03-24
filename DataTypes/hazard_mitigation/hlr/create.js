import React from 'react'
import { useNavigate } from "react-router-dom";


import { checkApiResponse, getDamaApiRoutePrefix, getSrcViews } from "../../../utils/DamaControllerApi";
import { RenderVersions } from "../../../utils/macros"
import { useSelector } from "react-redux";
import { selectPgEnv } from "../../../store";

const CallServer = async ({rtPfx, baseUrl, source, newVersion, navigate, startYear, endYear,
                              viewPB={}, viewNRI={}, viewState={}, viewCounty={}, viewNCEI={}}) => {
    const viewMetadata = [viewPB.view_id, viewNRI.view_id, viewState.view_id, viewCounty.view_id, viewNCEI.view_id];

    const url = new URL(
        `${rtPfx}/hazard_mitigation/hlrLoader`
    );
    url.searchParams.append("source_name", source.name);
    url.searchParams.append("existing_source_id", source.source_id);
    url.searchParams.append("view_dependencies", JSON.stringify(viewMetadata));
    url.searchParams.append("version", newVersion);
    url.searchParams.append("startYear", startYear);
    url.searchParams.append("endYear", endYear);
    url.searchParams.append("table_name", 'hlr');


    url.searchParams.append("pb_schema", viewPB.table_schema);
    url.searchParams.append("pb_table", viewPB.table_name);
    url.searchParams.append("nri_schema", viewNRI.table_schema);
    url.searchParams.append("nri_table", viewNRI.table_name);
    url.searchParams.append("state_schema", viewState.table_schema);
    url.searchParams.append("state_table", viewState.table_name);
    url.searchParams.append("county_schema", viewCounty.table_schema);
    url.searchParams.append("county_table", viewCounty.table_name);
    url.searchParams.append("ncei_schema", viewNCEI.table_schema);
    url.searchParams.append("ncei_table", viewNCEI.table_name);

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
    const [startYear, setStartYear] = React.useState(1996);
    const [endYear, setEndYear] = React.useState(2019);
    const years = range(1996, 2020);
    const [viewPB, setViewPB] = React.useState();
    const [viewNRI, setViewNRI] = React.useState();
    const [viewState, setViewState] = React.useState();
    const [viewCounty, setViewCounty] = React.useState();
    const [viewNCEI, setViewNCEI] = React.useState();
    // all versions
    const [versionsPB, setVersionsPB] = React.useState({sources:[], views: []});
    const [versionsNRI, setVersionsNRI] = React.useState({sources:[], views: []});
    const [versionsState, setVersionsState] = React.useState({sources:[], views: []});
    const [versionsCounty, setVersionsCounty] = React.useState({sources:[], views: []});
    const [versionsNCEI, setVersionsNCEI] = React.useState({sources:[], views: []});

    const rtPfx = getDamaApiRoutePrefix(pgEnv);

    React.useEffect(() => {
        async function fetchData() {
            await getSrcViews({rtPfx, setVersions: setVersionsPB, type: 'per_basis'});
            await getSrcViews({rtPfx, setVersions: setVersionsNRI, type: 'nri'});
            await getSrcViews({rtPfx, setVersions: setVersionsState, type: `tl_state`});
            await getSrcViews({rtPfx, setVersions: setVersionsCounty, type: 'tl_county'});
            await getSrcViews({rtPfx, setVersions: setVersionsNCEI, type: 'ncei_storm_events_enhanced'});
        }
        fetchData();
    }, [rtPfx])

    return (
        <div className='w-full'>
            {RenderVersions({value: startYear, setValue: setStartYear, versions: [startYear], type: 'Start Year'})}
            {RenderVersions({value: endYear, setValue: setEndYear, versions: years, type: 'End Year'})}
            {RenderVersions({value: viewPB, setValue: setViewPB, versions: versionsPB, type: 'PB Storm Events'})}
            {RenderVersions({value: viewNRI, setValue: setViewNRI, versions: versionsNRI, type: 'NRI'})}
            {RenderVersions({value: viewState, setValue: setViewState, versions: versionsState, type: 'State'})}
            {RenderVersions({value: viewCounty, setValue: setViewCounty, versions: versionsCounty, type: 'County'})}
            {RenderVersions({value: viewNCEI, setValue: setViewNCEI, versions: versionsNCEI, type: 'NCEI Storm Events'})}
            <button
                className={`align-right p-2 border-2 border-gray-200`}
                onClick={() =>
                    CallServer(
                        {rtPfx, baseUrl, source, newVersion,
                            startYear, endYear,
                            viewPB: versionsPB.views.find(v => v.view_id === parseInt(viewPB)),
                            viewNRI: versionsNRI.views.find(v => v.view_id === parseInt(viewNRI)),
                            viewState: versionsState.views.find(v => v.view_id === parseInt(viewState)),
                            viewCounty: versionsCounty.views.find(v => v.view_id === parseInt(viewCounty)),
                            viewNCEI: versionsNCEI.views.find(v => v.view_id === parseInt(viewNCEI)),
                            navigate
                        })}>
                Add New Source
            </button>
        </div>
    )
}

export default Create