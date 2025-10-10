import { useState, useEffect, useMemo, createContext, useRef } from "react";
import get from "lodash/get";
import set from "lodash/set";


/**
 * Some ideas:
 * If user clicks button, `point selector` mode is enabled/disabled
 * If enabled, map click adds the lng/lat to state var
 * When user clicks `calculate route` button, it sends to "API"
 * 
 * EVENTUALLY -- will prob want to have internal panel control that can set activeLayer
 * And mapClick will only allow user to pick lng/lat that is in activeLayer
 * Perhaps it will snap to closest or something?
*/


export const PointselectorPlugin = {
  id: "pointselector",
  type: "plugin",
  mapRegister: (map, state, setState) => {
    console.log("map register hello world pointselctor");

    let pluginDataPath = '';

    //state.symbologies indicates that the map context is DMS
    if(state.symbologies) {
      const symbName = Object.keys(state.symbologies)[0];
      const pathBase = `symbologies['${symbName}']`
      pluginDataPath = `${pathBase}.symbology.pluginData.pointselector`
    } else {
      pluginDataPath = `symbology.pluginData.pointselector`;
    }


      const MAP_CLICK = (e) => {
        console.log("map was clicked, e::",e)
        setState(draft => {
          set(draft, `${pluginDataPath}['new-point']`, e.lngLat);
        })
      };


      map.on("click", MAP_CLICK);

  },
  dataUpdate: (map, state, setState) => {
    console.log("pointselector state data update::", state)
    let pluginDataPath = "";
    let symbologyDataPath = "";
    if (state.symbologies) {
      const symbName = Object.keys(state.symbologies)[0];
      const pathBase = `symbologies['${symbName}']`;
      pluginDataPath = `${pathBase}.symbology.pluginData.pointselector`;
      symbologyDataPath = `${pathBase}.symbology.layers`;
    } else {
      pluginDataPath = `symbology.pluginData.pointselector`;
      symbologyDataPath = `symbology.layers`;
    }
    const newPoint = get(state, `${pluginDataPath}['new-point']`, null);

    if(newPoint) {
      setState((draft) => {
        set(draft, `${pluginDataPath}['new-point']`, null);
        const curPoints = get(draft, `${pluginDataPath}['points']`, []);

        curPoints.push(newPoint)
        set(draft, `${pluginDataPath}['points']`, curPoints);
      })
    }
 
  //     const MAP_CLICK = (e) => {
  //       console.log("map was clicked, e::",e)


  //       setState(draft => {
  //   const curPoints = get(draft, `${pluginDataPath}['points']`, []);
  //       console.log(JSON.parse(JSON.stringify({curPoints})))
  //         curPoints.push(e.lngLat)
  //         set(draft, `${pluginDataPath}['points']`, curPoints);

  //       })
  //     };

  // map.off("click",MAP_CLICK);
  //     map.on("click", MAP_CLICK);



  },
  internalPanel: ({ state, setState }) => {
  const controls = [
    {
      label: "Select points",
      controls: [
        {
          type: "toggle",
          params: {
            options: [false, true],
            default: false,
          },
          path: `['select-enabled']`,
        },
      ],
    },
  ];

  return controls
  
  },
  externalPanel: ({ state, setState }) => {return []},
  comp: ({ state, setState }) => {},
  cleanup: (map, state, setState) => {
    //map.off("click", "point-selector");
  },
};
