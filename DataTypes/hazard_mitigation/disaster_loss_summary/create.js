import React from 'react'
import { useNavigate } from "react-router-dom";
import { checkApiResponse, getDamaApiRoutePrefix, getSrcViews } from "../../../utils/DamaControllerApi";
import { RenderVersions } from "../../../utils/macros"
import { useSelector } from "react-redux";
import { selectPgEnv } from "../../../store";

const CallServer = async ({rtPfx, baseUrl, source, newVersion, navigate, 
                              viewPAFPD = {}, viewIHP = {}, 
                              viewDDS = {}, viewSBA = {}, 
                              viewNFIP = {}, viewUSDA = {}
                          }) => {
    const viewMetadata = [
        viewPAFPD.view_id, viewIHP.view_id,
        viewDDS.view_id, viewSBA.view_id,
        viewNFIP.view_id, viewUSDA.view_id
    ];

    const url = new URL(
        `${rtPfx}/hazard_mitigation/disasterLossSummaryLoader`
    );
    url.searchParams.append("source_name", source.name);
    url.searchParams.append("existing_source_id", source.source_id);
    url.searchParams.append("view_dependencies", JSON.stringify(viewMetadata));
    url.searchParams.append("version", newVersion);
    url.searchParams.append("table_name", 'disaster_loss_summary');


    url.searchParams.append("ofd_schema", viewPAFPD.table_schema);

    url.searchParams.append("pafpd_table", viewPAFPD.table_name);
    url.searchParams.append("pafpd_schema", viewPAFPD.table_schema);

    url.searchParams.append("ihp_table", viewIHP.table_name);
    url.searchParams.append("ihp_schema", viewIHP.table_schema);

    url.searchParams.append("dds_table", viewDDS.table_name);
    url.searchParams.append("dds_schema", viewDDS.table_schema);

    url.searchParams.append("sba_table", viewSBA.table_name);
    url.searchParams.append("sba_schema", viewSBA.table_schema);

    url.searchParams.append("nfip_table", viewNFIP.table_name);
    url.searchParams.append("nfip_schema", viewNFIP.table_schema);

    url.searchParams.append("usda_table", viewUSDA.table_name);
    url.searchParams.append("usda_schema", viewUSDA.table_schema);

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
    const [viewPAFPD, setViewPAFPD] = React.useState();
    const [viewIHP, setViewIHP] = React.useState();
    const [viewDDS, setViewDDS] = React.useState();
    const [viewSBA, setViewSBA] = React.useState();
    const [viewNFIP, setViewNFIP] = React.useState();
    const [viewUSDA, setViewUSDA] = React.useState();
    // all versions
    const [versionsPAFPD, setVersionsPAFPD] = React.useState({sources:[], views: []});
    const [versionsIHP, setVersionsIHP] = React.useState({sources:[], views: []});
    const [versionsDDS, setVersionsDDS] = React.useState({sources:[], views: []});
    const [versionsSBA, setVersionsSBA] = React.useState({sources:[], views: []});
    const [versionsNFIP, setVersionsNFIP] = React.useState({sources:[], views: []});
    const [versionsUSDA, setVersionsUSDA] = React.useState({sources:[], views: []});

    const rtPfx = getDamaApiRoutePrefix(pgEnv);

    React.useEffect(() => {
        async function fetchData() {
            await getSrcViews({rtPfx, setVersions: setVersionsPAFPD, type: 'public_assistance_funded_projects_details_v1'});
            await getSrcViews({rtPfx, setVersions: setVersionsIHP, type: 'individuals_and_households_program_valid_registrations_v1'});
            await getSrcViews({rtPfx, setVersions: setVersionsDDS, type: 'disaster_declarations_summaries_v2'});
            await getSrcViews({rtPfx, setVersions: setVersionsSBA, type: 'sba_disaster_loan_data_new'});
            await getSrcViews({rtPfx, setVersions: setVersionsNFIP, type: 'fima_nfip_claims_v1'});
            await getSrcViews({rtPfx, setVersions: setVersionsUSDA, type: 'usda_crop_insurance_cause_of_loss'});
        }
        fetchData();
    }, [rtPfx])

    return (
        <div className='w-full'>
            {RenderVersions({value: viewPAFPD, setValue: setViewPAFPD, versions: versionsPAFPD, type: 'public_assistance_funded_projects_details_v1'})}
            {RenderVersions({value: viewIHP, setValue: setViewIHP, versions: versionsIHP, type: 'individuals_and_households_program_valid_registrations_v1'})}
            {RenderVersions({value: viewDDS, setValue: setViewDDS, versions: versionsDDS, type: 'disaster_declarations_summaries_v2'})}
            {RenderVersions({value: viewSBA, setValue: setViewSBA, versions: versionsSBA, type: 'sba_disaster_loan_data_new'})}
            {RenderVersions({value: viewNFIP, setValue: setViewNFIP, versions: versionsNFIP, type: 'fima_nfip_claims_v1'})}
            {RenderVersions({value: viewUSDA, setValue: setViewUSDA, versions: versionsUSDA, type: 'usda_crop_insurance_cause_of_loss'})}
            <button
                className={`align-right p-2 border-2 border-gray-200`}
                onClick={() =>
                    CallServer(
                        {rtPfx, baseUrl, source, newVersion,
                            viewPAFPD: versionsPAFPD.views.find(v => v.view_id === parseInt(viewPAFPD)),
                            viewIHP: versionsIHP.views.find(v => v.view_id === parseInt(viewIHP)),
                            viewDDS: versionsDDS.views.find(v => v.view_id === parseInt(viewDDS)),
                            viewSBA: versionsSBA.views.find(v => v.view_id === parseInt(viewSBA)),
                            viewNFIP: versionsNFIP.views.find(v => v.view_id === parseInt(viewNFIP)),
                            viewUSDA: versionsUSDA.views.find(v => v.view_id === parseInt(viewUSDA)),
                            navigate
                        })}>
                Add New Source
            </button>
        </div>
    )
}

export default Create