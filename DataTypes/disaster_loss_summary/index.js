import React from 'react';
import Create from './create'
import {useFalcor} from "modules/avl-components/src";
import get from "lodash.get";
import { useSelector } from "react-redux";
import { selectPgEnv } from "../../store";
import AddVersion from "../default/AddVersion";



const NceiStormEventsConfig = {
    add_version: {
        name: "Add Version",
        path: "/add_version",
        component: AddVersion
    },
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
