import React from 'react';
import Create from './create'
const Table = ({source}) => {
  return <div> Table View </div>  
}

const ZoneToCountyConfig = {
  map: {
    name: 'Map',
    path: '/map',
    component: () => <div> No Map </div>
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

export default ZoneToCountyConfig
