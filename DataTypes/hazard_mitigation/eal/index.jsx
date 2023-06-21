import React, {useEffect, useState} from 'react';
import Create from './create'
import { Stats } from "./stats"
import { MegaTable } from "./table"
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
    table: {
        name: 'Table',
        path: '/table',
        component: MegaTable
    },
    sourceCreate: {
        name: 'Create',
        component: Create
    }

}

export default NceiStormEventsConfig
