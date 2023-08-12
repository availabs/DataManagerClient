import React from "react";
import get from "lodash/get.js";
import {DisplaySelector} from "./DisplaySelector.jsx";
import {Edit} from "./Edit.jsx";
import {DamaContext} from "../../../../store/index.js";
import {ManageMetaLookup} from "./MetadataLookup.jsx";
import {AddCalculatedColumn} from "./AddCalculatedColumn.jsx";
import {RemoveCalculatedColumn} from "./RemoveCalculatedColumn.jsx";

export const MetadataTable = ({source, ...props}) => {
    const {user} = React.useContext(DamaContext);
    const [metadata, setMetadata] = React.useState([]);
    const [editing, setEditing] = React.useState(null);

    const {authLevel} = user;
    const gridCols = authLevel < 5 ? "grid-cols-3" : "grid-cols-4";

    React.useEffect(() => {
        const md = JSON.parse(JSON.stringify(get(source, "metadata", [])));
        if (Array.isArray(md)) {
            const MD = md.map(d => ({
                display: "", ...d
            }));
            setMetadata(MD);
        } else {
            setMetadata([]);
        }
        ;
    }, [source]);

    if (!metadata || !metadata.map || metadata.length === 0) return <div> Metadata Not Available </div>

    return (<div className="overflow-hidden">
        {authLevel > 5 && <AddCalculatedColumn sourceId={source.source_id} metadata={metadata} setMetadata={setMetadata}/>}
        <div className={`py-4 sm:py-2 sm:grid sm:${gridCols} sm:gap-4 sm:px-6 border-b-2`}>
            <dt className="text-sm font-medium text-gray-600">
                Column
            </dt>
            <dd className="text-sm font-medium text-gray-600 ">
                Description
            </dd>
            <dd className="text-sm font-medium text-gray-600">
                Type
            </dd>
            {authLevel < 5 ? null : <dd className="text-sm font-medium text-gray-600">
                Display
            </dd>}
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">

                {metadata
                    .map((col, i) => (
                        <div key={i} className={`py-4 sm:py-5 sm:grid sm:${gridCols} sm:gap-4 sm:px-6`}>
                            <dt className="text-sm text-gray-900">
                                <div className={'flex flex-row justify-between group'}>
                                    {editing === `${col.name}-columnName` ? <div className='pt-3 pr-8'>
                                        <Edit
                                            metadata={metadata}
                                            setMetadata={setMetadata}
                                            col={col.name}
                                            startValue={get(col, 'name') || 'No Display Name'}
                                            attr={'name'}
                                            sourceId={source.source_id}
                                            setEditing={setEditing}
                                            cancel={() => setEditing(null)}
                                        />
                                    </div> : <div className='pt-3 pr-8'>{get(col, 'name') || 'No Name'}</div>}

                                    {user.authLevel > 5 && col.display === 'calculated-column'?
                                        <div className='hidden group-hover:block text-blue-500 cursor-pointer'
                                             onClick={e => setEditing(`${col.name}-columnName`)}>
                                            <i className="fad fa-pencil absolute -ml-12 p-2 pt-3 hover:bg-blue-500 rounded focus:bg-blue-700 hover:text-white "/>
                                        </div> : ''}
                                </div>

                                <div className={'flex flex-row justify-between group'}>
                                    {editing === `${col.name}-displayName` ? <div className='pt-3 pr-8'>
                                        <Edit
                                            metadata={metadata}
                                            setMetadata={setMetadata}
                                            col={col.name}
                                            startValue={get(col, 'display_name') || 'No Display Name'}
                                            attr={'display_name'}
                                            sourceId={source.source_id}
                                            setEditing={setEditing}
                                            cancel={() => setEditing(null)}
                                        />
                                    </div> : <div className='pt-3 pr-8 font-bold'>{get(col, 'display_name') || 'No Display Name'}</div>}

                                    {user.authLevel > 5 ?
                                        <div className='hidden group-hover:block text-blue-500 cursor-pointer'
                                             onClick={e => setEditing(`${col.name}-displayName`)}>
                                            <i className="fad fa-pencil absolute -ml-12 p-2 pt-3 hover:bg-blue-500 rounded focus:bg-blue-700 hover:text-white "/>
                                        </div> : ''}
                                </div>


                            </dt>

                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 flex flex-row justify-between group">
                                {editing === `${col.name}-description` ? <div className='pr-8'>
                                    <Edit
                                        sourceId={source.source_id}
                                        metadata={metadata}
                                        setMetadata={setMetadata}
                                        col={col.name}
                                        startValue={get(col, 'desc') || 'No Description'}
                                        attr={'desc'}
                                        setEditing={setEditing}
                                        cancel={() => setEditing(null)}
                                    />
                                </div> : <div className='pr-8'>{get(col, 'desc') || 'No Description'}</div>}

                                {user.authLevel > 5 ?
                                    <div className='hidden group-hover:block text-blue-500 cursor-pointer'
                                         onClick={e => setEditing(`${col.name}-description`)}>
                                        <i className="fad fa-pencil absolute -ml-12 p-2 pt-0 hover:bg-blue-500 rounded focus:bg-blue-700 hover:text-white "/>
                                    </div> : ''}
                            </dd>


                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 ">
                                <div className='text-gray-400 italic'>{col.type}</div>
                            </dd>


                            {authLevel > 5 &&
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0">
                                    {col.display !== 'calculated-column' &&
                                        <DisplaySelector
                                            sourceId={source.sourceId}
                                            metadata={metadata}
                                            setMetadata={setMetadata}
                                            col={col.name}
                                            value={col.display}
                                        />}
                                    {
                                       col.display === 'calculated-column' &&
                                        <RemoveCalculatedColumn
                                            col={col.name}
                                            sourceId={source.source_id}
                                            metadata={metadata}
                                            setMetadata={setMetadata}
                                        />
                                    }
                                    {
                                        ['meta-variable', 'geoid-variable'].includes(col.display) &&
                                            <ManageMetaLookup
                                                sourceId={source.source_id}
                                                metadata={metadata}
                                                setMetadata={setMetadata}
                                                col={col.name}
                                                startValue={get(col, 'meta_lookup') || 'No Meta Lookup Available'}
                                                attr={'meta_lookup'}
                                                setEditing={setEditing}
                                                cancel={() => setEditing(null)}
                                            />
                                    }
                                </dd>
                            }

                        </div>))}

            </dl>
        </div>
    </div>)
}