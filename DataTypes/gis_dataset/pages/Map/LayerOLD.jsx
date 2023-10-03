import React from "react";
import { Legend } from "~/modules/avl-components/src";
import get from "lodash/get";

import { LayerContainer } from "~/modules/avl-maplibre/src";
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
    //   attributesf
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

class GISDatasetLayer extends LayerContainer {
  state = {
    showLegend: false,
  };

  legend = {
    type: "threshold",
    domain: [0, 150],
    range: [],
    format: ".2s",
    show: false,
    Title: "",
  };

  onHover = {
    layers: this.layers?.map((d) => d.id),
    callback: (layerId, features, lngLat) => {
      let feature = features[0];
      // console.log('hover feature',feature)

      let data = [feature.id, layerId];

      return data;
    },
    HoverComp: this.hoverComp || HoverComp,
  };

  infoBoxes = [
    {
      Component: () => {
        return (
          <div className="bg-white w-[320px] p-2">
            <div className="pb-1 text-sm font-medium">{this.legend.title}</div>
            <Legend {...this.legend} />
          </div>
        );
      },
      show: (layer) => {
        // console.log('show', layer, layer.state.showLegend)
        return layer.state.showLegend;
      },
    },
  ];

  init(map, falcor) {
    // console.log('init freight atlas layer', this.id, this.activeViewId, this)
  }

  getColorScale(domain, numBins = 5, color = "Reds") {
    return d3scale
      .scaleThreshold()
      .domain(ckmeans(domain, numBins))
      .range(getColorRange(numBins, color));
  }

  fetchData(falcor) {
    return Promise.resolve();
  }

  render(map) {
    const { filters, activeViewId, symbology } = this.props;

    this.legend = {
      type: "threshold",
      domain: [0, 150],
      range: [],
      format: ".2s",
      show: false,
      Title: "",
    };

    if (symbology) {
      (symbology?.sources || []).forEach((s) => {
        if (!map.getSource(s.id)) {
          map.addSource(s.id, s.source);
        }
      });

      (symbology?.layers || []).forEach((l) => {
        if (!map.getLayer(l.id)) {
          map.addLayer(l);
          // this.layers.push(map.getLayer(l.id))
        }
      });
    }

    const activeVariable = get(filters, "activeVar.value", "");
    console.log("renderLayer", activeViewId, activeVariable, symbology);

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

console.log("FOR EACH:", paintProperty, sym)

          if (sym.settings) {
            this.legend.domain = sym.settings.domain;
            this.legend.range = sym.settings.range;
            this.legend.title = sym.settings.title;
            this.legend.type = sym.type;
            this.legend.show = true;
            this.updateState({ showLegend: true });
          }
          // TODO: put it back as before...
          //  else {
          //   this.updateState({ showLegend: false });
          // }

          if (sym.value) {
            // console.log(
            //   "paintProperty",
            //   this.layers[0].id,
            //   paintProperty,
            //   sym.value
            // );
            const layer = layer_id || this.layers[0].id;
console.log("PAINT:", layer, paintProperty, sym.value)
            map.setPaintProperty(layer, paintProperty, sym.value);
          }
        });
      });
  }
}

const GISDatasetLayerFactory = (options = {}) => new GISDatasetLayer(options);
export default GISDatasetLayerFactory;

// function getPropertyByType (type) {
//   switch (type) {
//   case 'fill':
//       return 'fill-color';
//   case: 'line':
//     return 'line-color';
//   case:

//   }
// }