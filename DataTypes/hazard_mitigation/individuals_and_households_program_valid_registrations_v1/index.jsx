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
  table: {
    name: 'Table',
    path: '/table',
    component: Table
  },
  sourceCreate: {
    name: 'Create',
    component: Create
  }

}

export default FreightAtlashShapefileConfig
