import React from 'react';

import get from 'lodash.get'
import Create from './create'
const Table = ({source}) => {
  return <div> Table View </div>  
}

const tiger2017Config = {
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

export default tiger2017Config
