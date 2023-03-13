import React, {useEffect, useState} from 'react';
import Create from './create'
import { Stats } from "./stats"
import { RenderMap } from "./map";

const NceiStormEventsConfig = {
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
