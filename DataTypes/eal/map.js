import React, { useMemo } from "react";
import { AvlMap } from "modules/avl-map/src";
import config from "config.json";
import { EALFactory } from "./layers/EALChoropleth";
import { CustomSidebar } from "./mapControls";

export const RenderMap = ({source, views}) => {
  const mapOptions = {
    zoom: 6.2,
    center: [
      -75.95,
      42.89
    ],
    logoPosition: "bottom-right",
    styles: [
      {
        name: "Light",
        style: "mapbox://styles/am3081/ckm86j4bw11tj18o5zf8y9pou"
      },
      {
        name: "Blank Road Labels",
        style: "mapbox://styles/am3081/cl0ieiesd000514mop5fkqjox"
      },
      {
        name: "Dark",
        style: "mapbox://styles/am3081/ckm85o7hq6d8817nr0y6ute5v"
      }
    ]
  };

  const map_layers = useMemo(() => {
    return [
      EALFactory()
    ]
  },[])

  const p = {
    [map_layers[0].id]: { key: "value" }
  }
  console.log('p?', p)
  return (

    <div className="w-full h-[700px]">
      <AvlMap
        accessToken={config.MAPBOX_TOKEN}
        mapOptions={mapOptions}
        layers={map_layers}
        CustomSidebar={CustomSidebar}
        layerProps={p}
      />
    </div>

  );
};