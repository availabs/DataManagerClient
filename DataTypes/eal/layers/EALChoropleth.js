import { scaleLinear, scaleOrdinal, scaleThreshold } from "d3-scale";
import get from "lodash.get";
import center from "@turf/center";
import { LayerContainer } from "modules/avl-map/src";
import { getColorRange } from "modules/avl-components/src";

class EALChoroplethOptions extends LayerContainer {
  constructor(props) {
    super(props);
  }

  // setActive = !!this.viewId
  name = "EAL Percent Difference";
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
        "all", "avalanche", "coastal", "coldwave", "drought", "earthquake", "hail", "heatwave", "hurricane", "icestorm", "landslide", "lightning", "riverine", "tornado", "tsunami", "volcano", "wildfire", "wind", "winterweat"
      ]
    },

    compare: {
      name: "compare",
      type: "dropdown",
      multi: false,
      value: "avail_eal_vs_swd_annual_buildings_percent",
      domain: [
        { key: "avail_eal_vs_swd_annual_buildings_percent", label: "Avail EAL vs SWD Annualized - Buildings" },
        { key: "avail_eal_vs_swd_annual_crop_percent", label: "Avail EAL vs SWD Annualized - Crop" },

        { key: "avail_eal_vs_nri_buildings_percent", label: "Avail EAL vs NRI EAL - Buildings" },
        { key: "avail_eal_vs_nri_crop_percent", label: "Avail EAL vs NRI EAL - Crop" }
      ],
      valueAccessor: d => d.key,
      accessor: d => d.label
    }
  };

  legend = {
    Title: ({ layer }) => get(layer.filters.attribute, "value", "").replace(/_/g, " "),
    type: "linear",
    domain: [-100, -75, -50, -25, 0, 25, 50, 75, 100],
    range: getColorRange(10, "RdYlGn", true),
    show: true
  };

  onHover = {
    layers: ["counties", "events"],
    HoverComp: ({ data, layer }) => {
      return (
        <div style={{ maxHeight: "300px" }} className={`rounded relative px-1 overflow-auto scrollbarXsm`}>
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
                d.raw_swd_nri_category === this.filters.hazard.value && d.geoid === feature.properties.geoid :
                d.geoid === feature.properties.geoid),
          response = [
            [this.filters.compare.domain.find(d => d.key === this.filters.compare.value).label, get(record, this.filters.compare.value)]

          ];
        console.log(record);
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


  init(map, falcor) {
    map.fitBounds([-125.0011, 24.9493, -66.9326, 49.5904]);
  }

  onFilterChange(filterName, newValue, prevValue) {
    switch (filterName) {
      case "hazard": {
        this.dataSRC = newValue === "all" ? "allHaz" : "byHaz";
      }
    }

  }

  fetchData(falcor) {
    return falcor.get(
      ["per_basis", "percentdiff", "byGeo", "byHaz"],
      ["per_basis", "percentdiff", "byGeo", "allHaz"]
    ).then(d => {
      this.data = {
        allHaz: get(d, ["json", "per_basis", "percentdiff", "byGeo", "allHaz"], []),
        byHaz: get(d, ["json", "per_basis", "percentdiff", "byGeo", "byHaz"], [])
      };
      console.log("d?", d.json.per_basis.percentdiff.byGeo, this.data);

    });//.then((r) => r.length && falcor.get(['geo', r , 'name']).then(names => this.geoNames = get(names, ['json', 'geo'], {})))
  }

  getColorScale(domain) {
    console.log("test 123", this.legend.domain, this.legend.range);
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
      // this.data[this.dataSRC]
      //     .filter(d => this.filters.hazard.value !== 'all' ? d.raw_swd_nri_category === this.filters.hazard.value : true)
      //     .map((d) => d[this.filters.compare.value])
      //     .filter(d => d)
    );
    console.log("cs?", colorScale(-77), colorScale(77), colorScale.range(), colorScale.domain());
    let colors = {};

    this.data[this.dataSRC]
      .filter(d => this.filters.hazard.value !== "all" ? d.raw_swd_nri_category === this.filters.hazard.value : true)
      .forEach(d => {
        console.log("d?", parseInt(d[this.filters.compare.value]), colorScale(parseInt(d[this.filters.compare.value])));
        colors[d.geoid] = d[this.filters.compare.value] ? colorScale(parseInt(d[this.filters.compare.value])) : "rgb(0,0,0)";
      });

    console.log(colors);
    map.setPaintProperty("counties", "fill-color",
      ["get", ["get", "geoid"], ["literal", colors]]);
  }

  render(map, falcor) {
    console.log(this.legend);
    this.handleMapFocus(map);
    this.paintMap(map);
  }
}

export const EALFactory = (options = {}) => new EALChoroplethOptions(options);