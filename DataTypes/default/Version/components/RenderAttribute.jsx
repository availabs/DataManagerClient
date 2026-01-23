import {Edit} from "./Edit.jsx";
import {Link} from "react-router";
import React from "react";

const attrNameMap = {
    'source_url': 'source url',
    '_created_timestamp': 'Created',
    '_modified_timestamp': 'Updated',
    'geography_version': 'Geography Version',
    'interval_version': 'Interval Version',
    'data_type': 'Data Type'
}

export const RenderAttribute = ({attr, editing, setEditing, user, val, view, display='row', valueClass='w-3/4 font-semibold'}) => (
    <div className='w-full flex justify-between group hover:bg-blue-50 rounded-lg items-middle'>
        <div className={`w-full flex flex-col sm:flex-${display} items-center pb-2 pt-5 px-1`}>
            <dt className="w-1/4 text-sm font-medium text-gray-500 capitalize">{attrNameMap[attr] || attr}</dt>
            <dd className="w-3/4 text-sm text-gray-900 sm:mt-0">
                {editing === attr ?
                    <div className='pt-3 pr-8'>
                        <Edit
                            startValue={val}
                            attr={attr}
                            viewId={view.view_id}
                            cancel={() => setEditing(null)}
                        />
                    </div> :
                    <div className={valueClass || 'w-3/4 font-semibold'}>{
                        attr === 'source_url' ? <Link to={val || '#'}>{val || 'N/A'}</Link> : val || 'N/A'
                    }</div>
                }
            </dd>
        </div>
        {user?.authLevel > 5 && setEditing ?
            <div className={`hidden group-hover:block text-blue-500 cursor-pointer p-2`}
                 onClick={e => editing === attr ? setEditing(null) : setEditing(attr)}>
                <i className="fad fa-pencil absolute p-2 -ml-4 rounded hover:bg-blue-500 hover:text-white "/>
            </div> : ''}
    </div>
)
