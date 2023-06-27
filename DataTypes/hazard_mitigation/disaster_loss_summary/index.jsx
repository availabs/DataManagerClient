import React from 'react';
import Create from './create'



const NceiStormEventsConfig = {
    
    stats: {
        name: 'Stats',
        path: '/stats',
        component: () => <div> No stats </div>
    },
    sourceCreate: {
        name: 'Create',
        component: Create
    }

}

export default NceiStormEventsConfig
