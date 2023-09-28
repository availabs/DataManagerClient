import React, {useMemo} from 'react'
import MapPage from "../../gis_dataset/pages/Map";
import CreatePage from "../../gis_dataset/pages/Create";
import Table from "../../gis_dataset/pages/Table";
import cloneDeep from 'lodash/cloneDeep'
import isEqual from 'lodash/isEqual'
import get from 'lodash/get'

import { Combobox } from '@headlessui/react'

import ProjectHoverComp from './MapHoverComp'

import { download as shpDownload } from "~/pages/DataManager/utils/shp-write"
import { DamaContext } from "~/pages/DataManager/store"
import Selector from './Selector'
// import Uploads from "./pages/Uploads";

// import { getAttributes } from 'pages/DataManager/components/attributes'



// const ptypes_colors= {
//   "Study": "#004C73",
//   "Highway": "#A80000",
//   "Bridge": "#A80000",
//   "Ferry": "#D79E9E",
//   "Transit": "#C19A6B",
//   "Rail": "#9C9C9C",
//   "Stations": "#9C9C9C",
//   "Truck": "#149ECE",
//   "Pedestrian": "#70A800",
//   "Bike": "#267300",
//   "Bus": "#C19A6B",
//   "ITS": "#FC921F",
//   "Parking":  "Parking",
//   "Freight":  "#149ECE",
// }

const ptypes_colors = {
"BIKE": "#38A800",
"BUS": "#0070FF",
"FERRY": "#D79E9E",
"HIGHWAY": "#FFF",  
"TRAFFIC": "#FFF",    
"HISTORIC": "#ffeb3b",
"ITS": "#FF00C5",
"PARKING": "#496bff",
"PEDESTRIAN": "#B1FF00",
"MOBILITY": "#B1FF00",
"RAIL": "#9C9C9C",
"STUDY": "#FFAA00",
"TRANSIT": "#00C5FF",
"TRUCK": "#000",
"NULL": "rgba(0,0,0,0)",
"": "rgba(0,0,0,0)"
}


const styles = {
   "line": {
      "type": "line",
      "paint": {
         "line-color": ["get", ["upcase",["to-string", ["get", "ptype"]]], ["literal", ptypes_colors]],
         "line-width": 3
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
        'icon-image': ["upcase",["get", "ptype"]], // reference the image
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
         "fill-color": ["get", ["upcase",["to-string", ["get", "ptype"]]], ["literal", ptypes_colors]],
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
    {'id': 'BIKE', url: '/mapIcons/bike.png'},
    {'id': 'BUS', url: '/mapIcons/transit.png'},
    {'id': 'HIGHWAY', url: '/mapIcons/highway.png'},
    {'id': 'BRIDGE', url: '/mapIcons/highway.png'},
    {'id': 'FERRY', url: '/mapIcons/ferry.png'},
    {'id': 'RAIL', url: '/mapIcons/rail.png'},
    {'id': 'STATIONS', url: '/mapIcons/rail.png'},
    {'id': 'TRUCK', url: '/mapIcons/truck.png'},
    {'id': 'PEDESTRIAN', url: '/mapIcons/pedestrian.png'},
    {'id': 'ITS', url: '/mapIcons/its.png'},
    {'id': 'PARKING', url: '/mapIcons/parking.png'},
    {'id': 'FREIGHT', url: '/mapIcons/truck.png'},
    {'id': 'TRANSIT', url: '/mapIcons/transit.png'}
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
  let activeVar = useMemo(() => get(filters, "activeVar.value", ""), [filters]);
  let year = useMemo(
    () => (typeof activeVar === "string" ? activeVar.slice(-1) : "0"),
    [activeVar]
  );

  console.log("what is the value of the activeVar: ", activeVar);

  let projectKey = (source?.metadata || []).map(d => d.name).includes('rtp_id') ? 'rtp_id' : 'tip_id'
  let newSymbology  = cloneDeep(tempSymbology)
 
  React.useEffect(() => {
    const loadSourceData = async () => {
    
      const d = await falcor.get(['dama',pgEnv, 'viewsbyId' ,activeViewId, 'data', 'length'])
       
      let length = get(d,
        ['json', 'dama', pgEnv, 'viewsbyId' ,activeViewId, 'data', 'length'],
      0)

          // console.log('length',length)
      await falcor.get([
        'dama',
        pgEnv,
        'viewsbyId',
        activeViewId,
        'databyIndex',
        [...Array(length).keys()],
        ['ogc_fid',projectKey,'mpo', 'sponsor', 'ptype', 'wkb_geometry']
      ])
    
    }
    loadSourceData()
  },[pgEnv,activeViewId,source])

  const filterData = React.useMemo(() => {
    const dataById = get(falcorCache,
      ['dama', pgEnv, 'viewsbyId', activeViewId, 'databyId'],
    {})

    return {
      [projectKey] :  ['', ...new Set(Object.values(dataById || {})
        .map(d => d?.[projectKey] )
        .filter(d => d))],
      'mpos' : Object.values(dataById || {})
        .reduce((out,curr) => {
          if(!out.includes(curr.mpo)){
            out.push(curr.mpo)
          }
          return out
        },['']),
      'sponsors' : Object.values(dataById || {})
      .reduce((out,curr) => {
        if(!out.includes(curr.sponsor)){
          out.push(curr.sponsor)
        }
        return out
      },['']),
      'ptypes' : Object.values(dataById || {})
        .reduce((out,curr) => {
          if(!out.includes(curr.ptype)){
            out.push(curr.ptype)
          }
          return out
        },[''])
    }
  },[falcorCache])

  React.useEffect(() => {
    const dataById = get(falcorCache,
      ['dama', pgEnv, 'viewsbyId', activeViewId, 'databyId'],
    {})
    
    const keys = Object.keys(dataById);
    const shownData = keys.reduce((acc, key) => {
      let currentData = dataById[key];

      if(filters[projectKey] && dataById[key].tip_id != filters[projectKey]) {
        currentData = null;
      }

      if(filters['mpo'] && dataById[key].mpo != filters['mpo']) {
        currentData = null;
      }

      if(filters['sponsor'] && dataById[key].sponsor != filters['sponsor']) {
        currentData = null;
      }

      if(filters['ptype'] && dataById[key].ptype != filters['ptype']) {
        currentData = null;
      }

      if(currentData) {
        acc.push(currentData);
      }

      return acc;
    }, []);
    // filter this down to array of values which 
    // match data in filter object
    
    console.log('Num Values: ' + Object.values(shownData).length);
  },[filters, falcorCache])

  if(!newSymbology?.source) {
    newSymbology.sources = metaData?.tiles?.sources || []
    const source_id = newSymbology?.sources?.[0]?.id || '0'
    const source_layer = `s${source.source_id}_v${activeViewId}` 
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


  return (
    <div style={{display:"flex"}}>
      <div>
        <Selector 
          onChange={(v) => setFilters({...filters, [projectKey]: v })} 
          options={filterData[projectKey]}
        />
      </div>
      <div style={{display:"flex"}}>
        <span className="align-middle">Mpo:</span> 
        <Selector 
          onChange={(v) => setFilters({...filters, ['mpo']: v })} 
          options={filterData['mpos']}
        />
      </div>
      <div style={{display:"flex"}}>
        <span className="align-middle">Sponsor:</span> 
        <Selector 
          onChange={(v) => setFilters({...filters, ['sponsor']: v })} 
          options={filterData['sponsors']}
        />
      </div>
      <div style={{display:"flex"}}>
        <span className="align-middle">Ptype:</span> 
        <Selector 
          onChange={(v) => setFilters({...filters, ['ptype']: v })} 
          options={filterData['ptypes']}
        />
      </div>
      <div>
        <MapDataDownloader
          activeViewId={ activeViewId }
          year={ get(metaData, ["years", year]) }/>
      </div>
    </div>
  )
}

const MapDataDownloader = ({ activeViewId, year }) => {
  
  const { pgEnv, falcor, falcorCache  } = React.useContext(DamaContext);

  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    
    const loadData = async () => {
      await falcor.chunk([
        'dama',
        pgEnv,
        'viewsbyId',
        activeViewId,
        'databyIndex',
        [...Array(length).keys()],
        ['ogc_fid',projectKey,'mpo', 'sponsor', 'ptype', 'wkb_geometry']
      ]);
    }

    loadData();

    setLoading(true);

    if (!(pgEnv && activeViewId)) return;
  }, [falcor, pgEnv, activeViewId]);

  const data = get(falcorCache,
    ['dama', pgEnv, 'viewsbyId', activeViewId, 'databyId'],
  {})

  
  const downloadData = React.useCallback(() => {
    // const length = get(falcorCache, ['dama', pgEnv, 'viewsbyId', activeViewId, 'data', 'length'], 0);
    // const path = ["dama", pgEnv, "viewsbyId", activeViewId, "databyId"];
    // const collection = {
    //   type: "FeatureCollection",
    //   features: d3range(0, length).map(id => {
    //     const data = get(falcorCache, [...path, id], {});
    //     console.log("what is the value of data: ", data);
    //     const value = get(data, null);
    //     const county = get(data, "county", "unknown");
    //     const geom = get(data, "wkb_geometry", "");
    //     console.log('geom', geom, data)
    //     return {
    //       type: "Feature",
    //       properties: {
    //         [variable]: value,
    //         county,
    //         year
    //       },
    //       geometry: JSON.parse(geom)
    //     }
    //   })
    // }
    // const options = {
    //   folder: "shapefiles",
    //   file: variable,
    //   types: {
    //     point: 'points',
    //     polygon: 'polygons',
    //     line: 'lines'
    //   }
    // }
    // shpDownload(collection, options);
  }, [falcorCache, pgEnv, activeViewId, year]);

  return (
    <div>
      <Button themeOptions={{size:'sm', color: 'primary'}}
        onClick={ downloadData }
        disabled={ loading }
      >
        Download
      </Button>
    </div>
  )
}


const GisDatasetConfig = {
  map: {
    name: "Map",
    path: "/map",
    component: (props) => (
      <MapPage 
        {...props}
        MapFilter={ProjectMapFilter}
        HoverComp={{Component: ProjectHoverComp, isPinnable: true}}
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
