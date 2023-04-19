import { scaleLinear, scaleOrdinal, scaleThreshold } from "d3-scale";
import get from "lodash.get";
//import center from "@turf/center";
import { LayerContainer } from "modules/avl-map/src";
import { getColorRange } from "modules/avl-components/src";
import ckmeans from "../../../../utils/ckmeans";
import { fnum } from "../../../../utils/macros"

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
    type: "threshold",
    format: "0.2s",
    domain: [],
    range: getColorRange(9, "Reds", false),
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
            ...this.filters.compare.domain
              .map(d => [d.label, fnum(get(record, d.key))])
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
    const pgEnv = 'hazmit_dama',
      source_id = 229,
      view_id = 511;
    return falcor.get(
      ['comparative_stats', pgEnv, 'byEalIds', 'source', source_id, 'view', view_id, 'byGeoid', 'all']
    ).then(d => {
      this.data = {
        byHaz: get(d, ["json", 'comparative_stats', pgEnv, 'byEalIds', 'source', source_id, 'view', view_id, 'byGeoid', 'all'], [])
      };

    });
  }

  getColorScale(domain) {
    if(!domain.length) domain = [0, 25, 50, 75, 100];

    if(this.props.paintKey === 'diff') domain = [-100, -50, 0, 50, 100, 200, 300, 500, 1000]
    this.legend.domain = ckmeans(domain,Math.min(domain.length,this.legend.range.length)).map(d => parseInt(d))
    
    // console.log("test 123", this.legend.domain, this.legend.range);
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
    
    const colorScale = this.getColorScale(
      this.data[this.dataSRC]
          .filter(d => hazard !== 'all' ? d.nri_category === hazard : true)
          .map((d) => d[paintKey])
          .filter(d => d)
    );
    let colors = {};

    this.data[this.dataSRC]
      .filter(d => hazard !== "all" ? d.nri_category === hazard : true)
      .forEach(d => {
        colors[d.geoid] = d[paintKey] ? colorScale(parseInt(d[paintKey])) : "rgb(0,0,0)";
      });


    map.setPaintProperty("counties", "fill-color",
      ["get", ["get", "geoid"], ["literal", colors]]);
  }

  render(map, falcor) {
    this.handleMapFocus(map);
    this.paintMap(map);
  }
}

export const EALFactory = (options = {}) => new EALChoroplethOptions(options);