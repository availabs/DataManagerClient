import React from "react";
// import { Legend } from "~/modules/avl-components/src";
import get from "lodash/get";
import cloneDeep from "lodash/cloneDeep"

import {
  AvlLayer,
  Legend,
  ActionButton,
  MultiLevelSelect,
  ColorRangesByType,
  ColorCategory,
  Input,
  Button,
  useTheme,
  getScale
} from "~/modules/avl-map-2/src";
import ckmeans from "../../../../utils/ckmeans";
import { getColorRange } from "../../../../utils/color-ranges";
import * as d3scale from "d3-scale";
import { extent as d3extent } from "d3-array"

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

export const LegendContainer = ({ name, title, children }) => {
  const theme = useTheme();
  return (
    <div className={ `p-1 rounded ${ theme.bg }` }>
      <div className={ `
          p-1 relative border rounded pointer-events-auto
          ${ theme.bgAccent2 } ${ theme.border }
        ` }
      >
        <div>{ name || title }</div>
        <div>{ children }</div>
      </div>
    </div>
  )
}

const calcDomain = (type, data, length) => {
  const values = data.map(d => +d.value);
  switch (type) {
    case "quantize":
      return d3extent(values);
    case "threshold":
      return ckmeans(values.filter(Boolean), length ? length - 1 : 6);
    default:
      return values;
  }
}
const calcRange = (type, length, color) => {
  switch (type) {
    case "quantize":
      return getColorRange(7, color);
    case "threshold":
      return getColorRange(length ? length + 1 : 7, color);
    default:
      return data;
  }
}

const GISDatasetRenderComponent = props => {
  const {
    layerProps,
    resourcesLoaded,
    maplibreMap
  } = props;

  const {
    filters,
    activeViewId,
    symbology,
    updateLegend
  } = layerProps;

  const [legend, setLegend] = React.useState(null);
  const [layerData, setLayerData] = React.useState(null);

  const createLegend = React.useCallback(settings => {

    const {
      domain = [],
      range = [],
      format = ".2s",
      name,
      type = "threshold",
      data = [],
      color = "BrBG"
    } = settings;

    const legend = {
      domain,
      range,
      format,
      name,
      type,
      data,
      color
    };

    if (!domain.length) {
      legend.domain = calcDomain(type, data, range.length);
    }
    if (!range.length) {
      legend.range = calcRange(type, domain.length, color);
    }

    setLegend(legend);
  }, []);

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

  const activeVariable = get(filters, ["activeVar", "value"], "");

  React.useEffect(() => {
    if (!maplibreMap) return;
    if (!resourcesLoaded) return;

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
            get(symbology, `[${layer_id}][${paintProperty}][${activeVariable}]`, "");

          console.log('map layer', sym, symbology)
          if (sym.settings) {
            createLegend(sym.settings);
            setLayerData({ layer_id, paintProperty, value: sym.value  });
          }
          else {
            setLegend(null);
            setLayerData(null);
          }
        });
      });
  }, [maplibreMap, resourcesLoaded, symbology, activeVariable]);

  React.useEffect(() => {
    if (!legend) return;
    if (!layerData) return;

    const { layer_id, paintProperty, value } = layerData;
    if(value) {
      maplibreMap.setPaintProperty(layer_id, paintProperty, value);
    } else { 
      const { type, domain, range, data } = legend;

      const scale = getScale(type, domain, range);

      const colors = data.reduce((a, c) => {
        a[c.id] = scale(c.value);
        return a
      }, {});

      const paint = ["get", ["to-string", ["get", "ogc_fid"]], ["literal", colors]];

      

      maplibreMap.setPaintProperty(layer_id, paintProperty, paint);
    }

  }, [legend, layerData]);

  return !legend ? null : (
    <div className="absolute top-0 left-0 w-96 grid grid-cols-1 gap-4">
      <div className="z-10">
        <LegendContainer { ...legend }>
          <Legend { ...legend }/>
        </LegendContainer>
      </div>

      <div className="z-0">
        <LegendControls legend={ legend }
          updateLegend={ updateLegend }/>
      </div>
    </div>
  )
}

const LegendControlsToggle = ({ toggle }) => {
  return (
    <ActionButton onClick={ toggle }>
      <span className="fa fa-plus"/>
    </ActionButton>
  )
}

const DomainItem = ({ value, remove }) => {
  const doRemove = React.useCallback(e => {
    remove(value);
  }, [value, remove]);
  return (
    <span onClick={ doRemove }
      className={ `
        fa-solid fa-remove px-2 flex items-center
        hover:bg-gray-400 rounded cursor-pointer
      ` }/>
  )
}

const ThresholdEditor = ({ domain, range, updateLegend }) => {

  const removeDomain = React.useCallback(v => {
    updateLegend(domain.filter(d => d !== v));
  }, [domain, updateLegend]);

  const [value, setValue] = React.useState("");

  const addDomain = React.useCallback(e => {
    updateLegend([...domain, +value].sort((a, b) => a - b));
    setValue("");
  }, [domain, value, updateLegend]);

  const useCKMeans = React.useCallback(() => {
    updateLegend(undefined);
    setValue("");
  }, [updateLegend]);

  return (
    <div className="grid grid-cols-1 gap-1">
      <div className="border-b border-current">
        For theshold scales, the number of values in the domain must be one less than the number of values in the range.
      </div>
      <div className="flex">
        <div className="flex-1">Number of values in domain:</div>
        <div className="pr-4">{ domain.length }</div>
      </div>
      <div className="flex border-b border-current">
        <div className="flex-1">Number of values in range:</div>
        <div className="pr-4">{ range.length }</div>
      </div>
      <div>Domain:</div>
      { domain.map((d, i) => (
          <div key={ d } className="flex hover:bg-gray-300 px-2 py-1 rounded">
            <div className="w-8 mr-1">({ i + 1 })</div>
            <div className="flex-1">{ d }</div>
            <DomainItem remove={ removeDomain } value={ d }/>
          </div>
        ))
      }
      <div className="flex">
        <Input type="number" placeholder="enter a threshold value..."
          onChange={ setValue }
          value={ value }
          className="px-2 py-1 mr-1 flex-1"/>
        <Button onClick={ addDomain }>
          Add
        </Button>
      </div>
      <div>
        <Button className="buttonBlock" onClick={ useCKMeans }>
          Reset with 6 bins
        </Button>
      </div>
    </div>
  )
}

const LegendControls = ({ legend, updateLegend }) => {

  const [isOpen, setIsOpen] = React.useState(false);
  const toggle = React.useCallback(e => {
    setIsOpen(o => !o);
  }, []);

  const updateLegendType = React.useCallback(type => {
    updateLegend({ ...legend, type, domain: undefined });
  }, [legend, updateLegend]);

  const updateLegendRange = React.useCallback((range, color) => {
    updateLegend({ ...legend, range, color, domain: undefined });
  }, [legend, updateLegend]);

  const updateLegendDomain = React.useCallback((domain, range = undefined) => {
    updateLegend({ ...legend, domain, range });
  }, [legend, updateLegend]);

  const [open, setOpen] = React.useState(-1);

  return !isOpen ? (
    <LegendControlsToggle toggle={ toggle }/>
  ) : (
    <div className="bg-gray-100 p-1 pointer-events-auto rounded w-96 relative">
      <div className="border rounded border-current relative">
        <div onClick={ toggle }
          className={ `
            p-1 bg-gray-300 border-b border-current
            rounded-t flex cursor-pointer font-bold
          ` }
        >
          <div className="flex-1">
            Legend Controls
          </div>
          <div className="flex-0">
            <span className="px-2 py-1">
              <span className="fa fa-minus"/>
            </span>
          </div>
        </div>
        <div className="p-1 grid grid-cols-1 gap-1">
          <TypeSelector { ...legend }
            updateLegend={ updateLegendType }/>

          { Object.keys(ColorRangesByType).map((type, i) => (
              <ColorCategory key={ type } type={ type }
                startSize={ legend.range.length }
                colors={ ColorRangesByType[type] }
                updateLegend={ updateLegendRange }
                isOpen={ open === i }
                setOpen={ setOpen }
                index={ i }
                current={ legend.range }/>
            ))
          }
        </div>
      </div>

      { legend.type !== "threshold" ? null :
        <div className="w-96 absolute left-full top-0"
          style={ { left: "CALC(100% + 1rem)" } }
        >
          <div className="bg-gray-100 p-1 pointer-events-auto rounded w-96">
            <div className="border rounded border-current relative">
              <div className={ `
                  p-1 bg-gray-300 border-b border-current rounded-t flex font-bold
                ` }
              >
                Threshold Editor
              </div>
              <div className="p-1">
                <ThresholdEditor { ...legend }
                  updateLegend={ updateLegendDomain }/>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  )
}

const LegendTypes = [
  { value: "quantize", name: "Quantize" },
  { value: "quantile", name: "Quantile" },
  { value: "threshold", name: "Threshold" },
  { value: "ordinal", name: "Ordinal" }
]

const TypeSelector = ({ type, updateLegend }) => {
  const onChange = React.useCallback(t => {
    updateLegend(t);
  }, [updateLegend]);
  return (
    <div className="flex items-center p-1">
      <div className="flex-0 mr-1">Type:</div>
      <div className="flex-1">
        <MultiLevelSelect
          removable={ false }
          options={ LegendTypes }
          displayAccessor={ t => t.name }
          valueAccessor={ t => t.value }
          onChange={ onChange }
          value={ type }/>
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
