import React from 'react'
import {useNavigate} from "react-router-dom";


import { checkApiResponse, getDamaApiRoutePrefix, getSrcViews } from "../../../utils/DamaControllerApi";
import { RenderVersions } from "../../../utils/macros"
import { useSelector } from "react-redux";
import { selectPgEnv } from "../../../store";

const CallServer = async ({rtPfx, baseUrl, source, newVersion, navigate, startYear, endYear,
                              viewNCEI={},viewZTC={}, viewCousubs={}, viewCounty={}, viewState={}, viewTract={}}) => {
    const viewMetadata = [viewZTC.view_id, viewState.view_id,  viewCounty.view_id, viewCousubs.view_id, viewTract.view_id, viewNCEI.view_id];

    const url = new URL(
        `${rtPfx}/hazard_mitigation/enhanceNCEI`
    );
    
    url.searchParams.append("table_name", 'details_enhanced');
    url.searchParams.append("source_name", source.name);
    url.searchParams.append("existing_source_id", source.source_id);
    url.searchParams.append("view_dependencies", JSON.stringify(viewMetadata));
    url.searchParams.append("version", newVersion);
    url.searchParams.append("start_year", startYear);
    url.searchParams.append("end_year", endYear);
    
    url.searchParams.append("ncei_schema", viewNCEI.table_schema);
    url.searchParams.append("ncei_table", viewNCEI.table_name);
    url.searchParams.append("tract_schema", viewTract.table_schema);
    url.searchParams.append("tract_table", viewTract.table_name);
    url.searchParams.append("ztc_schema", viewZTC.table_schema);
    url.searchParams.append("ztc_table", viewZTC.table_name);
    url.searchParams.append("state_schema", viewState.table_schema);
    url.searchParams.append("state_table", viewState.table_name);
    url.searchParams.append("county_schema", viewCounty.table_schema);
    url.searchParams.append("county_table", viewCounty.table_name);
    url.searchParams.append("cousub_schema", viewCousubs.table_schema);
    url.searchParams.append("cousub_table", viewCousubs.table_name);

    const stgLyrDataRes = await fetch(url);

    await checkApiResponse(stgLyrDataRes);

    const resJson = await stgLyrDataRes.json();

    console.log('res', resJson);

    navigate(`${baseUrl}/source/${resJson.payload.source_id}/versions`);
};

const range = (start, end) => Array.from({length: (end - start)}, (v, k) => k + start);

const Create = ({ source, newVersion, baseUrl }) => {
    const navigate = useNavigate();
    const pgEnv = useSelector(selectPgEnv);

    const [startYear, setStartYear] = React.useState(1996);
    const [endYear, setEndYear] = React.useState(2019);
    const years = range(1996, 2022);

    // selected views/versions
    const [viewZTC, setViewZTC] = React.useState();
    const [viewCousubs, setViewCousubs] = React.useState();
    const [viewTract, setViewTract] = React.useState();
    const [viewState, setViewState] = React.useState();
    const [viewCounty, setViewCounty] = React.useState();
    const [viewNCEI, setViewNCEI] = React.useState();
    // all versions
    const [versionsZTC, setVersionsZTC] = React.useState({sources:[], views: []});
    const [versionsCousubs, setVersionsCousubs] = React.useState({sources:[], views: []});
    const [versionsTract, setVersionsTract] = React.useState({sources:[], views: []});
    const [versionsState, setVersionsState] = React.useState({sources:[], views: []});
    const [versionsCounty, setVersionsCounty] = React.useState({sources:[], views: []});
    const [versionsNCEI, setVersionsNCEI] = React.useState({sources:[], views: []});

    const rtPfx = getDamaApiRoutePrefix(pgEnv);

    React.useEffect(() => {
        async function fetchData() {
            await getSrcViews({rtPfx, setVersions: setVersionsZTC, type: 'zone_to_county'});
            await getSrcViews({rtPfx, setVersions: setVersionsCousubs, type: 'tl_cousub'});
            await getSrcViews({rtPfx, setVersions: setVersionsTract, type: 'tl_tract'});
            await getSrcViews({rtPfx, setVersions: setVersionsState, type: 'tl_state'});
            await getSrcViews({rtPfx, setVersions: setVersionsCounty, type: 'tl_county'});
            await getSrcViews({rtPfx, setVersions: setVersionsNCEI, type: 'ncei_storm_events'});
        }
        fetchData();
    }, [rtPfx])

    return (
        <div className='w-full'>
            {RenderVersions({value: startYear, setValue: setStartYear, versions: [startYear], type: 'Start Year'})}
            {RenderVersions({value: endYear, setValue: setEndYear, versions: years, type: 'End Year'})}
            {RenderVersions({value: viewNCEI, setValue: setViewNCEI, versions: versionsNCEI, type: 'NCEI Storm Events'})}
            {RenderVersions({value: viewZTC, setValue: setViewZTC, versions: versionsZTC, type: 'Zone to County'})}
            {RenderVersions({value: viewState, setValue: setViewState, versions: versionsState, type: 'State'})}
            {RenderVersions({value: viewCounty, setValue: setViewCounty, versions: versionsCounty, type: 'County'})}
            {RenderVersions({value: viewCousubs, setValue: setViewCousubs, versions: versionsCousubs, type: 'Cousubs'})}
            {RenderVersions({value: viewTract, setValue: setViewTract, versions: versionsTract, type: 'Tracts'})}
            <button
                className={`align-right p-2 border-2 border-gray-200`}
                onClick={() =>
                    CallServer(
                        {rtPfx, baseUrl, source,
                            startYear, endYear,
                            viewNCEI: versionsNCEI.views.find(v => v.view_id === parseInt(viewNCEI)),
                            viewZTC: versionsZTC.views.find(v => v.view_id === parseInt(viewZTC)),
                            viewState: versionsState.views.find(v => v.view_id === parseInt(viewState)),
                            viewCounty: versionsCounty.views.find(v => v.view_id === parseInt(viewCounty)),
                            viewCousubs: versionsCousubs.views.find(v => v.view_id === parseInt(viewCousubs)),
                            viewTract: versionsTract.views.find(v => v.view_id === parseInt(viewTract)),
                            newVersion, navigate
                        })}>
                Add New Source
            </button>
        </div>
    )
}

export default Create