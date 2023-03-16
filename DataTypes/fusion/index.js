import React from 'react';
import Create from './create'
import AddVersion from "../default/AddVersion";


const NceiStormEventsConfig = {
    add_version: {
        name: "Add Version",
        path: "/add_version",
        component: AddVersion
    },
    sourceCreate: {
        name: 'Create',
        component: Create
    }

}

export default NceiStormEventsConfig
