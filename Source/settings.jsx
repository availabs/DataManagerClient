import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import get from "lodash/get";
import SourcesLayout from "./layout";
import { useParams } from "react-router";
import { DamaContext } from "~/pages/DataManager/store";
import { SourceAttributes, ViewAttributes, getAttributes } from "./attributes";
import {makeLexicalFormat} from "../DataTypes/default/Overview.jsx";
import {dmsColumnTypes} from "~/modules/dms/src"

const Settings = () => {
    const {pgEnv, baseUrl, falcor, falcorCache} = React.useContext(DamaContext);
    const [search, setSearch] = useState('');
    const [addingStatus, setAddingStatus] = useState(false);

    const setSettings = React.useCallback(settings => {
        setAddingStatus(true);
        falcor.set({
            paths: [
                ['dama-info', pgEnv, 'settings']
            ],
            jsonGraph: {
                ["dama-info"]: {
                    [pgEnv]: {
                        settings: JSON.stringify({
                            filtered_categories: settings.filteredCategories
                        })
                    }
                }
            }
        }).then(() => setAddingStatus(false))
    }, [pgEnv]);

    useEffect(() => {
        async function fetchData() {
            const lengthPath = ["dama", pgEnv, "sources", "length"];
            const resp = await falcor.get(lengthPath);

            await falcor.get([
                "dama", pgEnv, "sources", "byIndex",
                { from: 0, to: get(resp.json, lengthPath, 0) - 1 },
                "attributes", Object.values(SourceAttributes)
            ], ["dama-info", pgEnv, "settings"]);
        }

        fetchData();
    }, [falcor, pgEnv]);

    const sources = useMemo(() => {
        return Object.values(get(falcorCache, ["dama", pgEnv, "sources", "byIndex"], {}))
            .map(v => getAttributes(get(falcorCache, v.value, { "attributes": {} })["attributes"]));
    }, [falcorCache, pgEnv]);

    const filteredCategories = useMemo(() => {
        return get(falcorCache, ["dama-info", pgEnv, "settings", "value", "filtered_categories"], []);
    }, [falcorCache, pgEnv]);

    const categories = [...new Set(
        sources
            .filter(source => {
                return (
                    !source.categories?.find(cat => filteredCategories.find(filteredCategory => cat.includes(filteredCategory))))
            })
            .reduce((acc, s) => [...acc, ...(s.categories?.map(s1 => s1[0]) || [])], []))].sort()

    const categoriesCount = [...new Set(sources.reduce((acc, s) => [...acc, ...(s.categories?.map(s1 => s1[0]) || [])], []))].reduce((acc, cat) => {
        acc[cat] = sources.filter(source => {
            return source.categories?.find(category => category.includes(cat))
        })?.length
        return acc;
    }, {})

    return (

        <SourcesLayout baseUrl={baseUrl}>
            <input
                value={search}
                className={'my-4 w-full text-lg p-2 border border-gray-300 '}
                placeholder={'Start typing or click on a category to filter categories...'}
                onChange={e => {
                    setSearch(e.target.value)
                }}
                onKeyDown={e => {
                    const match = categories.find(c => c.toLowerCase() === e.target.value.toLowerCase());
                    if (e.key === 'Enter' && match) {
                        setSettings({filteredCategories: [...filteredCategories, match]})
                        setSearch('')
                    }
                }}
            />
            <div className={'flex flex-wrap'}>
                <div className={'w-full sm:w-1/2 border-2 p-1 my-1 bg-slate-200 rounded-md'}>
                    <label className={'text-gray-800 text-sm'}>Available Categories<span
                        className={'text-xs italic mx-1'}>(click to filter...)</span></label>
                    <div className={'flex flex-row'}>
                        <div className={'w-full flex flex-wrap p-1 max-h-[80dvh] overflow-auto scrollbar-sm'}>
                            {(categories || [])
                                .filter(cat => !search || cat.toLowerCase().includes(search.toLowerCase()))
                                .sort((a, b) => a.localeCompare(b))
                                .map(cat => (
                                    <button
                                        key={cat}
                                        className={`bg-white hover:bg-blue-50 p-2 m-1 rounded-md flex items-center`}
                                        onClick={e => setSettings({filteredCategories: [...filteredCategories, cat]})}
                                    >
                                        <i className={'fa fa-category'}/> {cat}
                                        <div
                                            className={'bg-blue-200 text-blue-600 text-xs w-5 h-5 ml-2 shrink-0 grow-0 rounded-lg flex items-center justify-center border border-blue-300'}>{categoriesCount[cat]}</div>
                                    </button>
                                ))
                            }
                        </div>
                    </div>
                </div>
                <div className={'w-full sm:w-1/2 border-2 p-1 my-1 bg-slate-200 rounded-md'}>
                    <label className={'text-gray-800 text-sm'}>Filtered Categories <span
                        className={'text-xs italic mx-1'}>(click to un-filter...)</span></label>
                    <div className={'w-full flex flex-wrap items-center p-1 max-h-[20dvh] overflow-auto scrollbar-sm'}>
                        {filteredCategories?.length ?
                            filteredCategories
                                .filter(cat => !search || cat.toLowerCase().includes(search.toLowerCase()))
                                .sort((a, b) => a.localeCompare(b))
                                .map(cat => (
                                    <button
                                        key={cat}
                                        className={`bg-white hover:bg-blue-50 p-2 m-1 rounded-md flex items-center`}
                                        onClick={e => setSettings({filteredCategories: filteredCategories.filter(c => c !== cat)})}
                                    >
                                        <i className={'fa fa-category'}/> {cat}
                                        <div
                                            className={'bg-blue-200 text-blue-600 text-xs w-5 h-5 ml-2 shrink-0 grow-0 rounded-lg flex items-center justify-center border border-blue-300'}>{categoriesCount[cat]}</div>
                                    </button>
                                )) :
                            <div className={'text-gray-800'}>No categories have been filtered.</div>
                        }
                    </div>
                </div>
            </div>
        </SourcesLayout>

    );
};

export default Settings;


// import React, { useEffect } from "react";
// import { useSelector, useDispatch } from "react-redux";

// import { useFalcor } from "~/modules/avl-components/src";

// import get from 'lodash/get'

// import { queryPgEnvs, setPgEnv, selectPgEnv } from "../store";

// const Settings = () => {
//   const { falcor, falcorCache } = useFalcor();
//   const dispatch = useDispatch();

//   const { pgEnv } = React.useContext(DamaContext)
//   const pgEnvs = React.useMemo(() => {
//     return get(falcorCache, ["dama-info", "pgEnvs", "value"], []);
//   },[falcorCache]);

//   useEffect(() => {
//     (async () => {
//       falcor.get(queryPgEnvs());
//     })();
//   }, [falcor]);

//   if (!pgEnvs) {
//     return (
//       <div>
//         <span>Awaiting available Postgres Environments List</span>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-6xl mx-auto">
//       <div className="p-4 font-medium"> DataManager Settings </div>

//       <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
//         <dl className="sm:divide-y sm:divide-gray-200">
//           <div className="flex justify-between group">
//             <div className="flex-1 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
//               <dt className="text-sm font-medium text-gray-500 py-5">
//                 Postgres Database
//               </dt>
//               <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
//                 <div className="pt-3 pr-8">
//                   <select
//                     className="w-full bg-white p-3 flex-1 shadow bg-grey-50 focus:bg-blue-100  border-gray-300"
//                     value={pgEnv}
//                     onChange={(e) => {
//                       dispatch(setPgEnv(e.target.value));
//                     }}
//                   >
//                     <option value="" disabled>
//                       Select your Postgres Environment
//                     </option>
//                     {pgEnvs.map((k) => (
//                       <option key={k} value={k} className="p-2">
//                         {k}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </dd>
//             </div>
//           </div>
//         </dl>
//       </div>
//     </div>
//   );
// };


// export default Settings;
