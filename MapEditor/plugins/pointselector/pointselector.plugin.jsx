import { useState, useEffect, useMemo, createContext, useRef } from "react";
import mapboxgl from "mapbox-gl";
import get from "lodash/get";
import set from "lodash/set";
import { Button } from "~/modules/avl-components/src";

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

const PLUGIN_ID = "pointselector";
let MARKERS = [];
export const PointselectorPlugin = {
  id: PLUGIN_ID,
  type: "plugin",
  mapRegister: (map, state, setState) => {
    console.log("map register hello world pointselctor");

    let pluginDataPath = "";

    //state.symbologies indicates that the map context is DMS
    if (state.symbologies) {
      const symbName = Object.keys(state.symbologies)[0];
      const pathBase = `symbologies['${symbName}']`;
      pluginDataPath = `${pathBase}.symbology.pluginData.${PLUGIN_ID}`;
    } else {
      pluginDataPath = `symbology.pluginData.${PLUGIN_ID}`;
    }

    resetPointsAndMarkers({ setState, pluginDataPath });

    const MAP_CLICK = (e) => {
      console.log("map was clicked, e::", e);
      setState((draft) => {
        set(draft, `${pluginDataPath}['new-point']`, e.lngLat);
      });
    };

    map.on("click", MAP_CLICK);
  },
  dataUpdate: (map, state, setState) => {
    let pluginDataPath = "";
    let symbologyDataPath = "";
    if (state.symbologies) {
      const symbName = Object.keys(state.symbologies)[0];
      const pathBase = `symbologies['${symbName}']`;
      pluginDataPath = `${pathBase}.symbology.pluginData.${PLUGIN_ID}`;
      symbologyDataPath = `${pathBase}.symbology.layers`;
    } else {
      pluginDataPath = `symbology.pluginData.${PLUGIN_ID}`;
      symbologyDataPath = `symbology.layers`;
    }
    const newPoint = get(state, `${pluginDataPath}['new-point']`, null);

    if (newPoint) {
      const marker = new mapboxgl.Marker().setLngLat(newPoint).addTo(map);

      setState((draft) => {
        set(draft, `${pluginDataPath}['new-point']`, null);
        const curPoints = get(draft, `${pluginDataPath}['points']`, []);
        curPoints.push(newPoint);

        MARKERS.push(marker)
        set(draft, `${pluginDataPath}['points']`, curPoints);
      });
    }
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

    return [];
  },
  externalPanel: ({ state, setState }) => {
    return [];
  },
  comp: ({ state, setState }) => {
    let symbologyLayerPath = "";
    let symbPath = "";
    if (state.symbologies) {
      const symbName = Object.keys(state.symbologies)[0];
      const pathBase = `symbologies['${symbName}']`;
      symbologyLayerPath = `${pathBase}.symbology.layers`;

      symbPath = `${pathBase}.symbology`;
    } else {
      symbologyLayerPath = `symbology.layers`;
      symbPath = `symbology`;
    }

    const pluginDataPath = `${symbPath}['pluginData']['${PLUGIN_ID}']`;
    const { points } = useMemo(() => {
      return {
        points: get(state, `${pluginDataPath}['points']`, []),
      };
    }, [state]);

    return (
      <div
        className="flex flex-col pointer-events-auto drop-shadow-lg p-4 bg-white/75 items-center"
        style={{
          position: "absolute",
          bottom: "94px",
          left: "90px",
          color: "black",
          width: "318px",
          maxHeight: "325px",
        }}
      >
        <div className="text-lg">Selected Points:</div>
        <div>
          {points.map((point) => (
            <div className="text-sm">
              {precisionRound(point.lng, 4)}, {precisionRound(point.lat, 4)}
            </div>
          ))}
        </div>
        <Button
          disabled={points.length < 2}
          themeOptions={{ color: "transparent" }}
          //className='bg-white hover:bg-cool-gray-700 font-sans text-sm text-npmrds-100 font-medium'
          onClick={(e) => {
            console.log("sending points to API!");
            console.log({ points });
            resetPointsAndMarkers({ setState, pluginDataPath });
          }}
          style={{ width: "75%", marginTop: "10px" }}
        >
          Send to Routing API
        </Button>
      </div>
    );
  },
  cleanup: (map, state, setState) => {
    //map.off("click", "point-selector");
  },
};

const precisionRound = (number, precision = 0) => {
  if (number === null) {
    return null;
  }
  if (!Number.isFinite(+number)) {
    return NaN;
  }

  const factor = 10 ** precision;

  return Math.round(+number * factor) / factor;
};

const resetPointsAndMarkers = ({ setState, pluginDataPath }) => {
  setState((draft) => {
    MARKERS.forEach((mark) => {
      mark?.remove && mark?.remove();
    });
    MARKERS = [];
    set(draft, `${pluginDataPath}['points']`, []);
  });
};
