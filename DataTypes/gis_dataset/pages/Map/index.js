// https://docs.mapbox.com/mapbox-gl-js/style-spec/
// https://docs.mapbox.com/mapbox-gl-js/style-spec/sources/#tiled-sources

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";

import _ from "lodash";

import { useFalcor, Button } from "modules/avl-components/src";

import { selectPgEnv } from "pages/DataManager/store";

import config from "config.json";
import { AvlMap } from "modules/avl-map/src";

import { getDamaTileServerUrl } from "../../utils/api";
import GisDatasetLayer from "../../GisDatasetLayer";

// const PRODUCTION_TILESERVER_URL = "https://tiles.availabs.org/";

const mapboxConfigPaintStylePath = ["layers", 0, "paint"];

function Map({ layers }) {
  const mapOptions = {
    zoom: 6.2,
    center: [-75.95, 42.89],
    logoPosition: "bottom-right",
    styles: [
      {
        name: "Light",
        style: "mapbox://styles/am3081/ckm86j4bw11tj18o5zf8y9pou",
      },
      {
        name: "Blank Road Labels",
        style: "mapbox://styles/am3081/cl0ieiesd000514mop5fkqjox",
      },
      {
        name: "Dark",
        style: "mapbox://styles/am3081/ckm85o7hq6d8817nr0y6ute5v",
      },
    ],
  };

  const map_layers = useMemo(() => {
    return layers.map((l) => GisDatasetLayer(l));
  }, [layers]);

  return (
    <div className="w-full h-full">
      <AvlMap
        accessToken={config.MAPBOX_TOKEN}
        mapOptions={mapOptions}
        layers={map_layers}
        CustomSidebar={() => <div />}
      />
    </div>
  );
}

export const ViewSelector = ({ damaViewIds, damaViewId, setDamaViewId }) => {
  if (!Array.isArray(damaViewIds) || damaViewIds.length === 0) {
    return "";
  }

  let viewRow;

  if (damaViewIds.length === 1) {
    if (!damaViewId) {
      // FIXME: Momentarily renders row with undefined Layer Name
      setDamaViewId(damaViewIds[0]);
    }

    viewRow = (
      <tr>
        <td className="py-4 text-left">View ID</td>
        <td className="py-4 text-center">{damaViewId}</td>
      </tr>
    );
  } else {
    viewRow = (
      <tr>
        <td className="py-4 text-left">Select Layer</td>
        <td className="py-4 text-center">
          <select
            className="text-center w-1/2 bg-white p-2 shadow bg-grey-50 focus:bg-blue-100 border-gray-300"
            value={damaViewId || ""}
            onChange={(e) => setDamaViewId(e.target.value)}
          >
            {[...damaViewIds].map((v) => (
              <option key={v} value={v}>
                View {v}
              </option>
            ))}
          </select>
        </td>
      </tr>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "inline-block",
          width: "100%",
          marginTop: "10px",
          textAlign: "center",
          paddingBottom: "20px",
          fontSize: "20px",
          fontWeight: "bold",
        }}
      ></div>

      <table className="w-full">
        <tbody>{viewRow}</tbody>
      </table>
    </div>
  );
};

const saveNewMapboxConfigToDatabase = async ({
  falcor,
  pgEnv,
  damaViewId,
  mapboxConfiguration,
}) => {
  const jsonGraph = {
    dama: {
      [pgEnv]: {
        viewId: {
          [damaViewId]: {
            mapboxConfiguration: JSON.stringify(mapboxConfiguration),
          },
        },
      },
    },
  };

  try {
    await falcor.set({
      // "dama[{keys:pgEnvs}].viewId[{keys:damaViewIds}].mapboxConfiguration"
      paths: [["dama", pgEnv, "viewId", damaViewId, "mapboxConfiguration"]],
      jsonGraph,
    });
  } catch (error) {}
};

const isValidJSON = (string) => {
  try {
    JSON.parse(string);
    return true;
  } catch (err) {
    return false;
  }
};

function ConfigurationEditor({ startValue, updateValue }) {
  const [value, setValue] = useState(startValue);

  const inputEl = useRef(null);

  useEffect(() => {
    setValue(startValue);
  }, [startValue]);

  useEffect(() => {
    inputEl.current.style.height = `${inputEl.current.scrollHeight}px`;
  }, [value]);

  const configChanged =
    value &&
    isValidJSON(value) &&
    (!isValidJSON(startValue) ||
      !_.isEqual(JSON.parse(startValue), JSON.parse(value)));

  const bgColor = isValidJSON(value) ? "blue" : "red";
  const className = `flex-1 px-2 shadow text-base focus:ring-${bgColor}-700 focus:border-${bgColor}-500  border-gray-300 rounded-none rounded-l-md`;

  const validConfig = isValidJSON(value);

  const style = validConfig
    ? { backgroundColor: "rgb(147 197 253)" }
    : { backgroundColor: "rgb(252 165 165)" };

  const buttons = configChanged ? (
    <div>
      <Button
        themeOptions={{ size: "sm" }}
        style={{
          backgroundColor: configChanged
            ? "rgb(219 234 254)"
            : "rgb(228 228 231)",
        }}
        disabled={!configChanged}
        onClick={() => updateValue(value)}
      >
        {" "}
        Preview{" "}
      </Button>

      <Button
        themeOptions={{ size: "sm", color: "cancel" }}
        onClick={() => setValue(startValue)}
      >
        {" "}
        Reset{" "}
      </Button>
    </div>
  ) : (
    ""
  );

  return (
    <div className="w-full">
      <div className="w-full flex">
        <textarea
          ref={inputEl}
          className={className}
          style={style}
          value={value}
          onChange={({ target: { value: v } }) => {
            setValue(v);
          }}
        />
      </div>
      {buttons}
    </div>
  );
}

export default function MapPage() {
  const { sourceId } = useParams();

  const [damaTileServerUrl, setDamaTileServerUrl] = useState(null);
  const [damaViewId, setDamaViewId] = useState(null);

  const [mapboxConfiguration, setMapboxConfiguration] = useState(null);
  const [draftMapboxConfig, setDraftMapboxConfig] = useState(null);

  const [editing, setEditing] = React.useState(null);
  const { falcor, falcorCache } = useFalcor();

  const pgEnv = useSelector(selectPgEnv);

  React.useEffect(() => {
    (async () => {
      // dama[{keys:pgEnvs}].sources.byId[{keys:sourceIds}].views.length
      const viewsLenQuery = [
        "dama",
        pgEnv,
        "sources",
        "byId",
        sourceId,
        "views",
        "length",
      ];

      const viewsLenResp = await falcor.get(viewsLenQuery);

      const viewsLen = _.get(viewsLenResp, ["json", ...viewsLenQuery]);

      const viewsIdsQuery = [
        "dama",
        pgEnv,
        "sources",
        "byId",
        sourceId,
        "views",
        "byIndex",
        `0..${viewsLen - 1}`,
      ];

      await falcor.get(viewsIdsQuery);
    })();
  }, [falcor, pgEnv, sourceId]);

  React.useEffect(() => {
    (async () => {
      const url = await getDamaTileServerUrl();
      if (url) {
        setDamaTileServerUrl(url);
      }
    })();
  }, []);

  React.useEffect(() => {
    if (damaViewId) {
      falcor.get(["dama", pgEnv, "viewId", damaViewId, "mapboxConfiguration"]);
    }
  }, [falcor, pgEnv, damaViewId]);

  React.useEffect(() => {
    if (!damaViewId || !damaTileServerUrl) {
      setMapboxConfiguration(null);
    }

    const config = _.get(
      falcorCache,
      ["dama", pgEnv, "viewId", damaViewId, "mapboxConfiguration", "value"],
      null
    );

    if (!config) {
      setMapboxConfiguration(null);
      console.warn("No mapbox config from falcorCache");
    }

    const _config = _.cloneDeep(config);

    if (process.env.NODE_ENV === "development") {
      if (_config && _config.sources) {
        _config.sources[0].source.url = _config.sources[0].source.url.replace(
          "https://tiles.availabs.org",
          damaTileServerUrl
        );
      }
    }

    console.log("==> mapbox config from falcorCache:", config);

    setMapboxConfiguration(_config);
    setDraftMapboxConfig(_config);
  }, [falcorCache, pgEnv, damaViewId, damaTileServerUrl]);

  function updateDraftMapboxConfig(path, value) {
    const _draft = _.cloneDeep(draftMapboxConfig);

    _.set(_draft, path, value);

    setDraftMapboxConfig(_draft);
  }

  const damaViewIds = React.useMemo(() => {
    const viewsById = _.get(falcorCache, ["dama", pgEnv, "views", "byId"]);

    if (!viewsById) {
      return null;
    }

    const viewIds = Object.keys(viewsById).sort((a, b) => +b - +a);

    return viewIds;
  }, [falcorCache, pgEnv]);

  React.useEffect(() => {
    if (damaViewIds && damaViewId === null) {
      setDamaViewId(damaViewIds[0]);
    }

    if (!damaViewIds) {
      setDamaViewId(null);
    }
  }, [damaViewIds, damaViewId]);

  const draftPaintConfig = _.get(draftMapboxConfig, ["layers", 0, "paint"]);

  const configChanged = !_.isEqual(mapboxConfiguration, draftMapboxConfig);

  const saveNewConfigButton = configChanged ? (
    <Button
      themeOptions={{ size: "md" }}
      style={{
        backgroundColor: configChanged
          ? "rgb(219 234 254)"
          : "rgb(228 228 231)",
      }}
      disabled={!configChanged}
      onClick={() =>
        saveNewMapboxConfigToDatabase({
          falcor,
          pgEnv,
          damaViewId,
          mapboxConfiguration: draftMapboxConfig,
        })
      }
    >
      {" "}
      Save New Config{" "}
    </Button>
  ) : (
    ""
  );

  return (
    <div>
      Map View {/*{_.get(damaViewId,'id','')}*/}
      <div className="w-ful h-[700px]">
        <Map
          layers={[
            {
              name: damaViewId ? `dama_view_${damaViewId}` : "empty_map",
              sources: _.get(mapboxConfiguration, "sources", []),
              layers: _.get(mapboxConfiguration, "layers", []),
            },
          ]}
        />
      </div>
      <ViewSelector
        damaViewIds={damaViewIds}
        damaViewId={damaViewId}
        setDamaViewId={setDamaViewId}
      />
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">
          <div key="edit-paint-config" className="flex justify-between group">
            <div className="flex-1 sm:grid sm:grid-cols-5 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 py-5">
                Map Paint Style
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-4">
                <div className="pt-3 pr-8">
                  <ConfigurationEditor
                    startValue={JSON.stringify(draftPaintConfig, null, 4)}
                    updateValue={(value) =>
                      updateDraftMapboxConfig(
                        mapboxConfigPaintStylePath,
                        JSON.parse(value)
                      )
                    }
                  />
                </div>
              </dd>
            </div>
          </div>
        </dl>
      </div>
      {saveNewConfigButton}
    </div>
  );
}
