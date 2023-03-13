import { scaleLinear, scaleOrdinal, scaleThreshold } from "d3-scale";
import get from "lodash.get";
import center from "@turf/center";
import { LayerContainer } from "modules/avl-map/src";
import { getColorRange } from "modules/avl-components/src";
import ckmeans from "../../../utils/ckmeans";

const fnum = (number) => parseInt(number).toLocaleString();
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
      value: "avail_swd_eal",
      domain: [
        { key: "avail_swd_eal", label: "Avail EAL" },
      ],
      valueAccessor: d => d.key,
      accessor: d => d.label
    }
  };

  legend = {
    Title: ({ layer }) => get(layer.filters.attribute, "value", "").replace(/_/g, " "),
    type: "linear",
    domain: [],
    range: getColorRange(10, "RdYlGn", true),
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

        let record = this.data[this.dataSRC]
            .find(d =>
              this.filters.hazard.value !== "all" ?
                d.nri_category === this.filters.hazard.value && d.geoid === feature.properties.geoid :
                d.geoid === feature.properties.geoid),
          response = [
            [this.filters.compare.domain.find(d => d.key === this.filters.compare.value).label, fnum(get(record, this.filters.compare.value))]

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
      view_id = 305;
    return falcor.get(
      ['comparative_stats', pgEnv, 'byEalIds', 'source', source_id, 'view', view_id, 'byGeoid']
    ).then(d => {
      console.log('data?', d.json)
      this.data = {
        byHaz: get(d, ["json", 'comparative_stats', pgEnv, 'byEalIds', 'source', source_id, 'view', view_id, 'byGeoid'], [])
      };

    });
  }

  getColorScale(domain) {
    this.legend.domain = ckmeans(domain,10).map(d => parseInt(d))
    // console.log("test 123", this.legend.domain, this.legend.range);
    return scaleThreshold()
      .domain(this.legend.domain)
      .range(this.legend.range);
  }

  handleMapFocus(map) {
    if (this.mapFocus) {
      try {
        map.flyTo(
          {
            center: get(center(JSON.parse(this.mapFocus)), ["geometry", "coordinates"]),
            zoom: 9
          });
      } catch (e) {
        map.fitBounds([-125.0011, 24.9493, -66.9326, 49.5904]);
      }
    } else {
      map.fitBounds([-125.0011, 24.9493, -66.9326, 49.5904]);
    }
  }

  paintMap(map) {
    const colorScale = this.getColorScale(
      this.data[this.dataSRC]
          .filter(d => this.filters.hazard.value !== 'all' ? d.nri_category === this.filters.hazard.value : true)
          .map((d) => d[this.filters.compare.value])
          .filter(d => d)
    );
    console.log("cs?", colorScale(-77), colorScale(77), colorScale.range(), colorScale.domain());
    let colors = {};
    console.log('this.data', this.data)
    this.data[this.dataSRC]
      .filter(d => this.filters.hazard.value !== "all" ? d.nri_category === this.filters.hazard.value : true)
      .forEach(d => {
        console.log("d?", parseInt(d[this.filters.compare.value]), colorScale(parseInt(d[this.filters.compare.value])));
        colors[d.geoid] = d[this.filters.compare.value] ? colorScale(parseInt(d[this.filters.compare.value])) : "rgb(0,0,0)";
      });

    // console.log(colors);
    map.setPaintProperty("counties", "fill-color",
      ["get", ["get", "geoid"], ["literal", colors]]);
  }

  render(map, falcor, props) {
    this.handleMapFocus(map);
    this.paintMap(map);
  }
}

export const EALFactory = (options = {}) => new EALChoroplethOptions(options);