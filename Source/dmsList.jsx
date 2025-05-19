import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import get from "lodash/get";
import SourcesLayout from "./layout";
import { useParams } from "react-router";
import { DamaContext } from "~/pages/DataManager/store";
import { SourceAttributes, ViewAttributes, getAttributes } from "./attributes";
import {makeLexicalFormat} from "../DataTypes/default/Overview.jsx";
import {dmsDataTypes} from "~/modules/dms/src"

export const RenderPagination = ({totalPages, pageSize, currentPage, setVCurrentPage}) => {
    const numNavBtns = Math.ceil(totalPages / pageSize);

    return (
        <div className={'float-right flex flex-col items-end p-1 text-sm font-gray-500'}>
            <div className={'text-xs italic'}>
                showing {Math.min(pageSize, totalPages)} of {isNaN(totalPages) ? 0 : parseInt(totalPages).toLocaleString()} rows
            </div>
            <div className={'flex flex-row items-center'}>
                <div className={'mx-1 cursor-pointer hover:text-gray-800'}
                     onClick={() => setVCurrentPage(currentPage > 0 ? currentPage - 1 : currentPage)}>{`<< prev`}</div>
                <select
                    className={'p-0.5 border-2 text-gray-800 hover:bg-blue-50 rounded-lg'}
                    value={currentPage}
                    onChange={e => setVCurrentPage(+e.target.value)}
                >
                    {
                        [...new Array(numNavBtns).keys()]
                            .map((i) =>
                                <option
                                    className={'p-2 border-2 text-gray-800 hover:bg-blue-50'}
                                    value={i} key={i}>{i + 1}
                                </option>)
                    }
                </select>
                <div className={'mx-1 cursor-pointer text-gray-500 hover:text-gray-800'}
                     onClick={() => setVCurrentPage(currentPage < totalPages ? currentPage + 1 : currentPage)}>{`next >>`}</div>
            </div>
        </div>)
}

const parseIfJson = str => {
    if(typeof str === "object") return str;

    try{
        return JSON.parse(str);
    }catch (e){
        return str;
    }
}

const stringifyIfObj = obj => typeof obj === "object" ? JSON.stringify(obj) : obj;

const formats = [
    {app: 'dms-site', type: 'docs-page', baseUrl: ""},
    {app: 'dms-site', type: 'docs-docs', baseUrl: "/docs"},
    {app: 'dms-site', type: 'docs-play', baseUrl: "/playground"}
]
const DmsList = () => {
    const {pgEnv, baseUrl, falcor, falcorCache} = React.useContext(DamaContext);
    const [req, setReq] = useState({app: 'dms-site', type: 'docs-page', baseUrl: ""});
    const [showSections, setShowSections] = useState(undefined);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const pageSize = 20;
    const limit = 10000000;

    useEffect(() => {
        async function load(){
            setLoading(true)
            const lenRes = await falcor.get(['dms', 'data', `${req.app}+${req.type}`, 'length']);
            const len = get(lenRes, ['json', 'dms', 'data', `${req.app}+${req.type}`, 'length'], 0);
            await falcor.get(["dms", "data", `${req.app}+${req.type}`, "byIndex", {from: 0, to: len - 1}, ["app", "type", "data"]]);
            setLoading(false);
        }

        load();
    }, [req, pgEnv]);

    const pages = useMemo(() =>
        Object.values(get(falcorCache, ["dms", "data", `${req.app}+${req.type}`, "byIndex"], {}))
            .map(v => get(falcorCache, v.value))
            .filter(page => !page?.data?.value?.template_id)
        , [falcorCache, pgEnv, req]);

    const sectionIds = useMemo(() => pages.reduce((acc, page) =>
        [...acc, ...get(page, ['data', 'value', 'sections'], []).map(s => s.id).filter(s => s)], []), [pages]);

    useEffect(() => {
        async function load(){
            if(!sectionIds.length) return;
            setLoading(true);
            await falcor.chunk(["dms", "data", "byId", sectionIds, ["data"]]);
            setLoading(false);
        }

        load();
    }, [pages]);

    const sections = useMemo(() =>
        sectionIds.reduce((acc, id) => ({...acc, [id]: get(falcorCache, ["dms", "data", "byId", id, "data", "value"])}), {}),
        [falcorCache, pgEnv, pages, sectionIds])

    return (
        <SourcesLayout baseUrl={baseUrl}>
            <select
                className={'p-4 bg-transparent font-bold'}
                value={JSON.stringify(req)}
                onChange={e => setReq(JSON.parse(e.target.value))}
            >
                {
                    formats.map(f => <option key={f} value={JSON.stringify(f)}>{JSON.stringify(f)}</option>)
                }
            </select>
            <div className={'font-bold max-h-[calc(100vh-150px)] grid grid-cols-2 divide-x divide-y overflow-auto scrollbar-sm'}
                 style={{gridTemplateColumns: '1fr 3fr'}}>
                <>
                    <div>Page</div>
                    <div>Sections</div>
                </>
            </div>
            <div className={'max-h-[calc(100vh-150px)] grid grid-cols-2 divide-x divide-y overflow-auto scrollbar-sm'}
                 style={{gridTemplateColumns: '1fr 3fr'}}>
                {
                    pages
                        .filter((p, pI) => pI >= currentPage * pageSize && pI < currentPage * pageSize + pageSize)
                        .map((page, pageI) => {
                            const currSections = get(page, ['data', 'value', 'sections'], [])
                                .filter(section => sections[section.id])
                                .map(section => {
                                    const element_data = parseIfJson(sections[section.id]?.element?.['element-data']);
                                    const src = stringifyIfObj(element_data?.dataSource || element_data?.ealSourceId);
                                    const version = stringifyIfObj(element_data?.version || element_data?.ealViewId);
                                    return (
                                        <div className={'p-2 hover:bg-blue-300'}>
                                            <Link className={'w-full justify-between'}
                                                  to={`${req.baseUrl}/${get(page, ['data', 'value', 'url_slug'])}#${section.id}`}>
                                                {sections[section.id]?.title}
                                                <span
                                                    className={'px-4 italic text-blue-300 hover: text-blue-600 text-sm'}>view</span>
                                            </Link>
                                            <div>type: {sections[section.id]?.element?.['element-type']}</div>
                                            <div className={'font-bold text-gray-900'}>source: {src}</div>
                                            <div className={'font-bold text-gray-900'}>version: {version}</div>
                                            {/*<div className={'h-12 overflow-auto scrollbar-sm'}>{JSON.stringify(sections[section.id], null, 2)}</div>*/}
                                        </div>)
                                });

                            return (
                                <React.Fragment>
                                    <div className={'p-2 w-full'}>
                                        <Link to={`${req.baseUrl}/${get(page, ['data', 'value', 'url_slug'])}`}>
                                            {get(page, ['data', 'value', 'title'])}
                                            <span
                                                className={'px-4 italic text-sm'}>{get(page, ['data', 'value', 'url_slug'])}</span>
                                        </Link>
                                    </div>
                                    <div className={'p-2 h-[250px] overflow-auto scrollbar-sm'}>{currSections}</div>
                                </React.Fragment>
                            )
                        })
                }
            </div>
            <RenderPagination pageSize={pageSize} totalPages={pages.length} currentPage={currentPage}
                              setVCurrentPage={setCurrentPage}/>

        </SourcesLayout>

    );
};

export default DmsList;


