import React from "react";
import { Legend } from "~/modules/avl-components/src";
import get from "lodash/get";

import { AvlLayer } from "~/modules/avl-map-2/src";
import ckmeans from "../../../../utils/ckmeans";
import { getColorRange } from "../../../../utils/color-ranges";
import * as d3scale from "d3-scale";

import { DamaContext } from "~/pages/DataManager/store";

const HoverComp = ({ data, layer }) => {
  const { attributes, activeViewId } = layer;
  const { pgEnv, falcor, falcorCache } = React.useContext(DamaContext);
  const id = React.useMemo(() => get(data, "[0]", null), [data]);

  React.useEffect(() => {
    // console.log('hover falcor',[
    //   'dama',
    //   pgEnv,
    //   'viewsbyId',
    //   activeViewId,
    //   'databyId',
    //   id,
    //   attributes
    // ])
    falcor.get([
      "dama",
      pgEnv,
      "viewsbyId",
      activeViewId,
      "databyId",
      id,
      attributes,
    ]);
  }, [falcor, pgEnv, activeViewId, id, attributes]);

  const attrInfo = React.useMemo(() => {
    return get(
      falcorCache,
      ["dama", pgEnv, "viewsbyId", activeViewId, "databyId", id],
      {}
    );
  }, [id, falcorCache, activeViewId, pgEnv]);

  return (
    <div className="bg-white p-4 max-h-64 max-w-lg scrollbar-xs overflow-y-scroll">
      <div className="font-medium pb-1 w-full border-b ">
        {layer.source.display_name}
      </div>
      {Object.keys(attrInfo).length === 0 ? `Fetching Attributes ${id}` : ""}
      {Object.keys(attrInfo)
        .filter((k) => typeof attrInfo[k] !== "object")
        .map((k, i) => (
          <div className="flex border-b pt-1" key={i}>
            <div className="flex-1 font-medium text-sm pl-1">{k}</div>
            <div className="flex-1 text-right font-thin pl-4 pr-1">
              {attrInfo?.[k]}
            </div>
          </div>
        ))}
    </div>
  );
};

const GISDatasetRenderComponent = props => {
  const {
    layerProps,
    isLoaded,
    maplibreMap
  } = props;

  const {
    filters, activeViewId, symbology
  } = layerProps;

  const [legend, setLegend] = React.useState(null);

  React.useEffect(() => {
    if (!maplibreMap) return;
    const sources = get(symbology, "sources", []);
    if (Array.isArray(sources)) {
      sources.forEach(s => {
        if (!maplibreMap.getSource(s.id)) {
          maplibreMap.addSource(s.id, s.source);
        }
      })
    }
    const layers = get(symbology, "layers", []);
    if (Array.isArray(layers)) {
      layers.forEach(s => {
        if (!maplibreMap.getSource(s.id)) {
          maplibreMap.addSource(s.id, s.source);
        }
      })
    }
  }, [maplibreMap, symbology]);

  const activeVariable = get(filters, "activeVar.value", "");

  React.useEffect(() => {
    if (!maplibreMap) return;
    if (!isLoaded) return;

    (Object.keys(symbology || {}) || [])
      .forEach((layer_id) => {
        (
          Object.keys(symbology[layer_id] || {}).filter((paintProperty) => {
            const value =
              get(symbology, `[${paintProperty}][${activeVariable}]`, false) ||
              get(symbology, `[${paintProperty}][default]`, false) ||
              get(
                symbology,
                `[${layer_id}][${paintProperty}][${activeVariable}]`,
                false
              );
            return value;
          }) || []
        ).forEach((paintProperty) => {
          const sym =
            get(symbology, `[${paintProperty}][${activeVariable}]`, "") ||
            get(symbology, `[${paintProperty}][default]`, "") ||
            get(
              symbology,
              `[${layer_id}][${paintProperty}][${activeVariable}]`,
              ""
            );

          if (sym.settings) {
            setLegend({
              domain: sym.settings.domain,
              range: sym.settings.range,
              title: sym.settings.title,
              format: ",.2s",
              type: sym.type
            })
          }
          else {
            setLegend(null);
          }

          if (sym.value) {
            const layer = layer_id || this.layers[0].id;
            maplibreMap.setPaintProperty(layer, paintProperty, sym.value);
          }
        });
      });
  }, [maplibreMap, isLoaded, symbology, activeVariable]);

  return !legend ? null : (
    <div className="absolute top-0 left-0">
      <div className="bg-white w-80 rounded p-2">
        <div className="pb-1 text-sm font-medium">{ legend.title }</div>
        <Legend { ...legend }/>
      </div>
    </div>
  )
}

class GISDatasetLayer extends AvlLayer {
  onHover = {
    layers: this.layers?.map((d) => d.id),
    callback: (layerId, features, lngLat) => {
      let feature = features[0];

      let data = [feature.id, layerId];

      return data;
    },
    Component: this.hoverComp || HoverComp,
  };

  getColorScale(domain, numBins = 5, color = "Reds") {
    return d3scale
      .scaleThreshold()
      .domain(ckmeans(domain, numBins))
      .range(getColorRange(numBins, color));
  }

  RenderComponent = GISDatasetRenderComponent;
}

const GISDatasetLayerFactory = (options = {}) => new GISDatasetLayer(options);
export default GISDatasetLayerFactory;
