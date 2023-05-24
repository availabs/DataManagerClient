import { scaleLinear, scaleOrdinal, scaleQuantile, scaleThreshold } from "d3-scale";
import get from "lodash.get";
//import center from "@turf/center";
import { LayerContainer } from "modules/avl-map/src";
import { getColorRange } from "modules/avl-components/src";
import ckmeans from "../../../../utils/ckmeans";
import { fnum } from "../../../../utils/macros"

const ealCols = ['avail_eal', 'nri_eal', 'diff']
const columnMeta = {
  ctype: {
    name: 'Consequence',
    format: d => d
  },
  geoid: {
    name: 'geoid',
    format: d => d
  },
  region: {
    name: 'region',
    format: d => d
  },
  nri_category: {
    name: 'Hazard',
    format: d => d
  },
  va_n: {
    name: 'National Variance',
    format: d => d?.toFixed(9)
  },
  va_r: {
    name: 'Regional Variance',
    format: d => d?.toFixed(9)
  },
  va_s: {
    name: 'Surrounding Variance',
    format: d => d?.toFixed(9)
  },
  va_c: {
    name: 'County Variance',
    format: d => d?.toFixed(9)
  },
  av_n: {
    name: 'National Average',
    format: d => d?.toFixed(9)
  },
  av_r: {
    name: 'Regional Average',
    format: d => d?.toFixed(9)
  },
  av_s: {
    name: 'Surrounding Average',
    format: d => d?.toFixed(9)
  },
  av_c: {
    name: 'County Average',
    format: d => d?.toFixed(9)
  },
  wt_n: {
    name: 'National Weight',
    format: d => d?.toFixed(9)
  },
  wt_r: {
    name: 'Regional Weight',
    format: d => d?.toFixed(9)
  },
  wt_s: {
    name: 'Surrounding Weight',
    format: d => d?.toFixed(9)
  },
  wt_c: {
    name: 'County Weight',
    format: d => d?.toFixed(9)
  },
  hlr_n: {
    name: 'National HLR',
    format: d => d?.toFixed(9)
  },
  hlr_r: {
    name: 'Regional HLR',
    format: d => d?.toFixed(9)
  },
  hlr_s: {
    name: 'Surrounding HLR',
    format: d => d?.toFixed(9)
  },
  hlr_c: {
    name: 'County HLR',
    format: d => d?.toFixed(9)
  },
  hlr: {
    name: 'HLR',
    format: d => d?.toFixed(9)
  },
  national_percent_hazard: {
    name: 'National %',
    format: d => d?.toFixed(3)
  },
  state_percent_hazard: {
    name: 'State %',
    format: d => d?.toFixed(3)
  },
  avail_eal: {
    name: 'AVAIL EAL',
    format: d => fnum(d)
  },
  nri_eal: {
    name: 'NRI EAL',
    format: d => fnum(d)
  },
  diff: {
    name: '% Differance (AVAIL vs NRI)',
    format: d => d?.toFixed(3)
  },
}
class EALChoroplethOptions extends LayerContainer {
  constructor(props) {
    super(props);
  }

  // setActive = !!this.viewId
  name = "EAL";
  id = "ealpd";
  data = [];
  dataSRC = "byHaz";
  filters = {
    hazard: {
      name: "Hazard",
      type: "dropdown",
      multi: false,
      value: "hurricane",
      domain: [
        // "all",
        "avalanche", "coastal", "coldwave", "drought", "earthquake", "hail", "heatwave", "hurricane", "icestorm", "landslide", "lightning", "riverine", "tornado", "tsunami", "volcano", "wildfire", "wind", "winterweat"
      ]
    },

    compare: {
      name: "compare",
      type: "dropdown",
      multi: false,
      value: "avail_eal",
      domain: [
        { key: "avail_eal", label: "Avail EAL" },
        { key: "nri_eal", label: "NRI EAL" },
        { key: "diff", label: "% Difference" },
      ],
      valueAccessor: d => d.key,
      accessor: d => d.label
    }
  };

  legend = {
    Title: ({ layer }) => `Estimated Annual Loss by ${get(layer.filters.hazard, "value", "").toUpperCase()} in $`,
    domain: [],
    range: getColorRange(9, "RdYlGn", false),
    show: true
  };

  onHover = {
    layers: ["counties", "events"],
    HoverComp: ({ data, layer }) => {
      return (
        <div style={{ maxHeight: "300px" }} className={`rounded relative px-1 overflow-auto scrollbarXsm bg-white`}>
          {
            data.map((row, i) =>
              <div key={i} className="flex">
                {
                  row.map((d, ii) =>
                    <div key={ii}
                      // style={{maxWidth: '200px'}}
                         className={`
                    ${ii === 0 ? "flex-1 font-bold" : "overflow-auto scrollbarXsm"}
                    ${row.length > 1 && ii === 0 ? "mr-4" : ""}
                    ${row.length === 1 && ii === 0 ? `border-b-2 text-lg ${i > 0 ? "mt-1" : ""}` : ""}
                    `}>
                      {d}
                    </div>
                  )
                }
              </div>
            )
          }
        </div>
      );
    },
    callback: (layerId, features, lngLat) => {
      return features.reduce((a, feature) => {
        let { hazard, paintKey } = this.props
        let record = this.data[this.dataSRC]
            .find(d =>
              hazard !== "all" ?
                d.nri_category === hazard && d.geoid === feature.properties.geoid :
                d.geoid === feature.properties.geoid),
           response = [
             [feature.properties.geoid, ''],
             ...Object.keys(record || {})
               .filter(key => columnMeta[key])
               .map(key => [columnMeta[key]?.name || key, columnMeta[key]?.format(get(record, key))])
          ];
        // console.log(record);
        return response;
      }, []);
    }
  };

  sources = [
    {
      id: "counties",
      source: {
        "type": "vector",
        "url": "mapbox://am3081.a8ndgl5n"
      }
    }
  ];

  layers = [
    {
      "id": "counties",
      "source": "counties",
      "source-layer": "counties",
      "type": "fill"
    },
    {
      "id": "counties-line",
      "source": "counties",
      "source-layer": "counties",
      "type": "line",
      paint: {
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          4, 0,
          22, 0
        ],
        "line-color": "#ccc",
        "line-opacity": 0.5
      }
    }
  ];

  init(map, falcor, props) {
    map.fitBounds([-125.0011, 24.9493, -66.9326, 49.5904]);
  }

  onFilterChange(filterName, value, prevValue, props) {
    switch (filterName) {
      case "hazard": {
        this.dataSRC = value === "all" ? "allHaz" : "byHaz";
      }
    }

  }

  fetchData(falcor, props) {
    console.log('fetchData', this.props)
    const source_id = 229;
    let { hazard, paintKey, consequence, viewId: view_id, pgEnv } = this.props;

    const dependencyPath = ["dama", pgEnv, "viewDependencySubgraphs", "byViewId", view_id];
    const hlrDetailsAttributes = [
        'ctype', 'geoid', 'region', 'surrounding', 'nri_category',
        'va_n', 'av_n', 'va_r', 'av_r', 'va_c', 'av_c', 'va_s', 'av_s',
        'wt_n', 'hlr_n', 'wt_r', 'hlr_r', 'wt_c', 'hlr_c', 'wt_s', 'hlr_s',
        'hlr'
      ],
      hlrDetailsOptions = JSON.stringify({
        filter: {
          nri_category: [hazard], ctype: [consequence === 'All' ? 'buildings' : consequence]
        }
      }),
      hlrDetailsPath = view_id => ['dama', pgEnv,  "viewsbyId", view_id, "options", hlrDetailsOptions];

    return falcor.get(
      ['comparative_stats', pgEnv, 'byEalIds', 'source', source_id, 'view', view_id, 'byGeoid', 'all'],
      dependencyPath
    ).then(async (d) => {
      let hlrDetails = [];
      if(!ealCols.includes(paintKey)){
        if(consequence === 'All') consequence = 'buildings';
        console.log('fetching for', paintKey, consequence)
        const deps = get(d, ['json', ...dependencyPath, 'dependencies'], []);
        const hlrDep =  deps.find(d => d.type === 'hlr');

        const hlrDetailsLenRes = await falcor.get([...hlrDetailsPath(hlrDep.view_id), 'length']);
        const hlrDetailsLen = get(hlrDetailsLenRes, ['json', ...hlrDetailsPath(hlrDep.view_id), 'length']);

        if(hlrDetailsLen){
          const hlrDetailsRes = await falcor.get([...hlrDetailsPath(hlrDep.view_id), 'databyIndex', {from: 0, to: hlrDetailsLen - 1}, hlrDetailsAttributes]);
          hlrDetails = Object.values(get(hlrDetailsRes, ['json', ...hlrDetailsPath(hlrDep.view_id), 'databyIndex'], {}));
        }
        console.log('!!!', hlrDetails)
      }
      this.data = {
        byHaz: ealCols.includes(paintKey) ?
          get(d, ["json", 'comparative_stats', pgEnv, 'byEalIds', 'source', source_id, 'view', view_id, 'byGeoid', 'all'], [])
            .filter(d => d.nri_category === hazard)
          :
          hlrDetails
      };
    });
  }

  getColorScale(domain) {
    if(!domain.length) domain = [0, 25, 50, 75, 100];
    this.legend.range = getColorRange(9, "Oranges", false)

    if(this.props.paintKey === 'max_wt') {
      this.legend.domain = ['wt_n', 'wt_r', 'wt_s', 'wt_c']
      this.legend.range = getColorRange(4, "RdYlGn", false)
      this.legend.type = 'ordinal'
      this.legend.format = null

      return scaleOrdinal()
        .domain(this.legend.domain)
        .range(this.legend.range);
    }

    if(this.props.paintKey === 'diff') {
      this.legend.range = getColorRange(9, "RdYlGn", false)
      domain = [-100, -75, -50, -25, 0, 50, 100, 500, 1000]
    }

    this.legend.domain = ckmeans(domain,Math.min(domain.length,this.legend.range.length))
    this.legend.type = 'threshold'
    this.legend.format = "0.2s";

    return scaleThreshold()
      .domain(this.legend.domain)
      .range(this.legend.range);
  }

  handleMapFocus(map) {
    // if (this.mapFocus) {
    //   try {
    //     map.flyTo(
    //       {
    //         center: get(center(JSON.parse(this.mapFocus)), ["geometry", "coordinates"]),
    //         zoom: 9
    //       });
    //   } catch (e) {
    //     map.fitBounds([-125.0011, 24.9493, -66.9326, 49.5904]);
    //   }
    // } 
    //   else {
      map.fitBounds([-125.0011, 24.9493, -66.9326, 49.5904]);
    //}
  }

  paintMap(map) {
    let { hazard, paintKey } = this.props;
    const calcMaxWt = ({ wt_n, wt_r, wt_s, wt_c }) => Math.max(wt_n, wt_r, wt_s, wt_c);
    const getWtKey = (d, wt) =>
      Object.keys(d)
        .filter(key => ['wt_n', 'wt_r', 'wt_s', 'wt_c'].includes(key))
        .find(key => d[key] === wt);

    const paintFn = (d) => paintKey === 'max_wt' ? getWtKey(d, calcMaxWt(d)) : d[paintKey];

    const colorScale = this.getColorScale(
      this.data[this.dataSRC]
          .filter(d => hazard !== 'all' ? d.nri_category === hazard : true)
          .map((d) => paintFn(d))
          .filter(d => d)
    );
    let colors = {};

    this.data[this.dataSRC]
      .filter(d => hazard !== "all" ? d.nri_category === hazard : true)
      .forEach(d => {
        colors[d.geoid] = d[paintKey] || paintKey === 'max_wt' ? colorScale(paintFn(d)) : "rgb(0,0,0)";
      });
    console.log('painting...', colors)

    map.setPaintProperty("counties", "fill-color",
      ["get", ["get", "geoid"], ["literal", colors]]);
  }

  render(map, falcor) {
    this.handleMapFocus(map);
    this.paintMap(map);
  }
}

export const EALFactory = (options = {}) => new EALChoroplethOptions(options);