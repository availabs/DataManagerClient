import React from 'react';

import Create from './create'
import AddVersion from "../../default/AddVersion";

const Table = ({source}) => {
  return <div> Table View </div>  
}



const FreightAtlashShapefileConfig = {
  add_version: {
    name: 'Add Version',
    path: '/add_version',
    component: AddVersion
  },
  stats: {
    name: 'Stats',
    path: '/stats',
    component: () => <> Stats go here</>
  },
  sourceCreate: {
    name: 'Create',
    component: Create
  }

}

export default FreightAtlashShapefileConfig
