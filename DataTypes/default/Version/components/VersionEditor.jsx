import React, {useContext, useState} from "react";
import {DamaContext} from "../../../../store/index.js";
import {RenderAttribute} from "./RenderAttribute.jsx";
import {getValue} from "../utils.js";
import { ViewAttributes } from '~/pages/DataManager/Source/attributes'
import {ViewControls} from "./ViewControls.jsx";


export const VersionEditor = ({view, columns = [], flexDir = 'col', showControls=false}) => {
    const [editing, setEditing] = useState(null);
    const {user} = useContext(DamaContext);
    const dateOptions = {year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "numeric"}
    const createdTimeStamp = new Date(getValue(view['_created_timestamp']?.value)).toLocaleDateString(undefined, dateOptions);
    const updatedTimeStamp = new Date(getValue(view['_modified_timestamp']?.value)).toLocaleDateString(undefined, dateOptions);
    const highlightedValueClass = 'text-blue-600 font-semibold'

    return (
        <div className="overflow-hidden">
            <div className="flex justify-between border-t border-gray-200 px-4 py-5 sm:p-0">
                <div className={`w-full flex flex-${flexDir}`}>
                    {Object.keys(ViewAttributes)
                        .filter(d => !columns?.length || columns.includes(d))
                        .filter(d =>
                            !['view_id', 'source_id', 'description', 'statistics', 'category', 'table_schema',
                                'table_name', 'data_table', 'tiles_url', 'last_updated', 'view_dependencies', 'start_date',
                                'end_date', 'download_url', 'user_id', 'etl_context_id', '_created_timestamp', '_modified_timestamp',
                                'metadata'
                            ].includes(d))
                        .map((attr, i) => {
                            let val = getValue(view[attr])

                            return <RenderAttribute key={i} attr={attr} val={val} editing={editing}
                                                    setEditing={setEditing} view={view} user={user}/>
                        })
                    }
                </div>
                <div className={'w-fit flex flex-col space-between'}>
                    {
                        (!columns.length || columns.includes('_created_timestamp')) &&
                        <RenderAttribute
                            attr={'_created_timestamp'}
                            val={createdTimeStamp}
                            view={view}
                            user={user}
                            display={'col'}
                            valueClass={highlightedValueClass}
                        />
                    }
                    {
                        (!columns.length || columns.includes('_modified_timestamp')) &&
                        <RenderAttribute
                            attr={'_modified_timestamp'}
                            val={updatedTimeStamp}
                            view={view}
                            user={user}
                            display={'col'}
                            valueClass={highlightedValueClass}
                        />
                    }

                    {
                        showControls && <ViewControls view={view} />
                    }
                </div>
            </div>
        </div>
    )
}