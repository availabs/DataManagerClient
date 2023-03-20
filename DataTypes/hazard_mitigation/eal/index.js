import React, {useEffect, useState} from 'react';
import Create from './create'
import { Stats } from "./stats"
import { RenderMap } from "./map";
import AddVersion from "../../default/AddVersion";

const NceiStormEventsConfig = {
    add_version: {
        name: "Add Version",
        path: "/add_version",
        component: AddVersion
    },
    stats: {
        name: 'Stats',
        path: '/stats',
        component: Stats
    },
    map: {
        name: 'Map',
        path: '/map',
        component: RenderMap
    },
    sourceCreate: {
        name: 'Create',
        component: Create
    }

}

export default NceiStormEventsConfig
