import React from 'react';
import {MetadataTable} from "./components/MetadataTable.jsx";

const Index = ({source, views, ...props}) => {
    return (
        <div className="w-full flex-1 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <div className='col-span-3'>zz
                <MetadataTable source={source}/>
            </div>
        </div>
    )
}

export default Index
