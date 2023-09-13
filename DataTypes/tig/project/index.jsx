import React from 'react'
import MapPage from "../../gis_dataset/pages/Map";
import CreatePage from "../../gis_dataset/pages/Create";
import Table from "../../gis_dataset/pages/Table";
import cloneDeep from 'lodash/cloneDeep'
import isEqual from 'lodash/isEqual'
import get from 'lodash/get'

import { DamaContext } from "~/pages/DataManager/store"
// import Uploads from "./pages/Uploads";

// import { getAttributes } from 'pages/DataManager/components/attributes'

const ptypes = {
  "1": "Study",
  "2": "Highway",
  "3": "Ferry",
  "4": "Transit",
  "5": "Rail",
  "6": "Truck",
  "7": "Pedestrian",
  "8": "Bike",
  "10": "Bus",
  "9": "ITS",
  "12":  "Parking",
  "1772":  "Freight",
}

const ptypes_colors= {
  "1": "#004C73",
  "2": "#A80000",
  "3": "#D79E9E",
  "4": "#C19A6B",
  "5": "#9C9C9C",
  "6": "#149ECE",
  "7": "#70A800",
  "8": "#267300",
  "10": "#C19A6B",
  "9": "#FC921F",
  "12":  "Parking",
  "1772":  "#149ECE",
}




const styles = {
   "line": {
      "type": "line",
      "paint": {
         "line-color": ["get", ["to-string", ["get", "ptype_id"]], ["literal", ptypes_colors]],
         "line-width": 2
      },
      "filter": [
         "==",
         [
            "geometry-type"
         ],
         "LineString"
      ],
   },
   // "circle":{
   //    "type": "circle",
   //    'paint': {
   //      'circle-color': ["get", ["to-string", ["get", "ptype_id"]], ["literal", ptypes_colors]], // reference the image
   //      'circle-radius': 4
   //    },
   //    "filter": [
   //       "==",
   //       [
   //          "geometry-type"
   //       ],
   //       "Point"
   //    ],
   // },
   "circle":{
      "type": "symbol",
      'layout': {
        'icon-image': ["get", ["to-string", ["get", "ptype_id"]], ["literal", ptypes]], // reference the image
        'icon-size': 0.10,
        'icon-allow-overlap': true
      },
      "filter": [
         "==",
         [
            "geometry-type"
         ],
         "Point"
      ],
   },
   "fill": {
      "type": "fill",
      "paint": {
         "fill-color": ["get", ["to-string", ["get", "ptype_id"]], ["literal", ptypes_colors]],
         "fill-opacity": 0.5
      },
      "filter": [
         "==",
         [
            "geometry-type"
         ],
         "Polygon"
      ],
      
   }
}


const images = [
    {'id': 'Bike', url: '/mapIcons/bike.png'},
    {'id': 'Busx', url: '/mapIcons/transit.png'},
    {'id': 'Highway', url: '/mapIcons/highway.png'},
    {'id': 'Ferry', url: '/mapIcons/ferry.png'},
    {'id': 'Rail', url: '/mapIcons/rail.png'},
    {'id': 'Truck', url: '/mapIcons/truck.png'},
    {'id': 'Pedestrian', url: '/mapIcons/pedestrian.png'},
    {'id': 'ITS', url: '/mapIcons/its.png'},
    {'id': 'Parking', url: '/mapIcons/parking.png'},
    {'id': 'Freight', url: '/mapIcons/truck.png'},
    {'id': 'Transitx', url: '/mapIcons/transit.png'}
]

const ProjectMapFilter = ({
    source,
    metaData,
    filters,
    setFilters,
    setTempSymbology,
    tempSymbology,
    activeViewId,
    layer
  }) => { 

  const { falcor, falcorCache, pgEnv } = React.useContext(DamaContext)

  // console.log('ProjectMapFilter', tempSymbology, layer, source)
  let newSymbology  = cloneDeep(tempSymbology)

  const loadSourceData = async () => {
    
    const d = await falcor.get(['dama',pgEnv, 'viewsbyId' ,activeViewId, 'data', 'length'])
     
    let length = get(d,
      ['json', 'dama', pgEnv, 'viewsbyId' ,activeViewId, 'data', 'length'],
    0)

        // console.log('length',length)
    await falcor.chunk([
      'dama',
      pgEnv,
      'viewsbyId',
      activeViewId,
      'databyIndex',
      [...Array(length).keys()],
      ['ogc_fid','tip_id','wkb_geometry']
    ])

    const dataById = get(falcorCache,
      ['dama', pgEnv, 'viewsbyId', activeViewId, 'databyId'],
    {})

    console.log('databyId', dataById)
  }
  
      

  if(!newSymbology.source) {
    newSymbology.sources = metaData.tiles.sources
    const source_id = newSymbology.sources[0].id
    const source_layer = source_id.split('_')[1] + '_' +source_id.split('_')[2] 
    newSymbology.layers = ['line','circle','fill']
      .map(type => {
        return {
          id: `source_layer_${type}`,
          ...styles[type],
          source: source_id,
          "source-layer": source_layer
        }
      })
      //loadSourceData()
  }

  if(!newSymbology.images) {
    newSymbology.images = images
  }

  if(!isEqual(newSymbology, tempSymbology)){
    console.log('setting new newSymbology')
    setTempSymbology(newSymbology)
  }



}

const GisDatasetConfig = {
  map: {
    name: "Map",
    path: "/map",
    component: (props) => (
      <MapPage 
        {...props}
        MapFilter={ProjectMapFilter}
      />
    ),
  },
  table: {
    name: "Table",
    path: "/table",
    component: Table,
  },
  // This key is used to filter in src/pages/DataManager/Source/create.js
  sourceCreate: {
    name: "Create",
    component: (props) => (
      <CreatePage
        {...props}
        tippecanoeOptions={{flags: ['-b0']}}
      />
    )
  },
  // add_version: {
  //   name: "Add Version",
  //   path: "/add_version",
  //   component: CreatePage,
  // }
};

export default GisDatasetConfig;
