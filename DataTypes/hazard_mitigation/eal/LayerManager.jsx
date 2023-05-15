import React, { useEffect, useMemo, useState, useContext } from "react";
import { useFalcor, SideNav } from "~/modules/avl-components/src";
import { useSelector } from "react-redux";

import get from "lodash/get";
//import {getDomain,getSubdomain} from 'utils'

// import Source from "./Source";

import {SourceAttributes, getAttributes } from '~/pages/DataManager/components/attributes'

import { LayerContext } from "./FreightMap";

import { selectPgEnv } from "~/pages/DataManager/store";

const LayerManager = ({ activeLayers, MapActions, ...rest }) => {
  // const SUBDOMAIN = getSubdomain(window.location.host)
  const { falcor, falcorCache } = useFalcor();
  const [displayLayer, setDisplayLayer] = useState(null);
  const [layerSearch, setLayerSearch] = useState("");
  const { layerList, toggleLayer } = useContext(LayerContext);

  const pgEnv = useSelector(selectPgEnv);

  useEffect(() => {
    const fetchData = async () => {
      const lengthPath = ["dama", pgEnv, "sources", "length"];
      const resp = await falcor.get(lengthPath);
      return await falcor.get([
        "dama",
        pgEnv,
        "sources",
        "byIndex",
        { from: 0, to: get(resp.json, lengthPath, 0) - 1 },
        "attributes",
        Object.values(SourceAttributes),
      ]);
    };
    fetchData();
  }, [falcor, pgEnv]);



  const sources = useMemo(() => {
    return Object.values(
      get(falcorCache, ["dama", pgEnv, "sources", "byIndex"], {})
    ).map((v) =>
      getAttributes(get(falcorCache, v.value, { attributes: {} })["attributes"])
    );
  }, [falcorCache, pgEnv]);


  const current_site = "Freight Atlas";
  // const current_filter = null
  let menuItems = useMemo(() => {
    return Object.values(
      sources
        .filter((d) =>
          (get(d, "categories", []) || [])
            .map((d) => d[0])
            .includes(current_site)
        )
        .filter((d) => {
          return (
            !layerSearch ||
            d.name
              .split("/")
              .pop()
              .split("_")
              .join(" ")
              .toLowerCase()
              .includes(layerSearch.toLowerCase())
          );
        })
        .reduce((a, b) => {
          b.categories.forEach((cat) => {
            if (cat[0] === current_site) {
              if (!a[cat[1]]) {
                a[cat[1]] = {
                  name: cat[1],
                  subMenus: [],
                };
              }
              a[cat[1]].subMenus.push({
                className: " ",
                name: (
                  <div
                    className={`flex p-2 hover:bg-blue-100 border-r-4 ${
                      b.source_id === displayLayer ? "border-blue-600" : "border-white"
                    }`}
                  >
                    <div
                      className="flex-1 pl-6 cursor-pointer text-sm"
                      onClick={() => setDisplayLayer(b.source_id)}
                    >
                      {b.display_name}
                    </div>
                    <div>
                      <i
                        onClick={(e) => {
                          toggleLayer(b.source_id);
                          if (
                            activeLayers.map((d) => d.layer_id).includes(b.source_id)
                          ) {
                            let removeLayer = activeLayers.filter(
                              (d) => d.layer_id === b.source_id
                            )[0];
                            MapActions.removeLayer(removeLayer);
                          }
                        }}
                        className={`${
                          layerList.includes(+b.source_id)
                            ? "fa fa-minus"
                            : "fa fa-plus"
                        } text-xs text-blue-700 cursor-pointer rounded-sm py-1 px-1.5 hover:bg-blue-400 hover:text-white`}
                      />
                    </div>
                  </div>
                ),
                //onClick: () => {}
              });
            }
          });
          return a;
        }, {})
    );
  }, [
    sources,
    displayLayer,
    layerSearch,
    layerList,
    activeLayers,
    MapActions,
    toggleLayer,
  ]);

  return (
    <div className="">
      <div className="px-4 py-2 border-b border-gray-300 font-medium text-lg">
        Layer Manager {JSON.stringify(layerList)}
      </div>
      <div className="flex h-[32rem]">
        <div className="w-72 border-r border-gray-300 h-full pb-[54px]">
          <div className="p-1">
            <input
              className="w-full text-lg p-2 border border-gray-300 "
              placeholder="Search for Layers"
              value={layerSearch}
              onChange={(e) => setLayerSearch(e.target.value)}
            />
          </div>
          <div className="h-full overflow-y-scroll scrollbar-xs overflow-x-hidden">
            <SideNav
              menuItems={menuItems}
              themeOptions={{ size: "full", responsive: "none" }}
            />
          </div>
        </div>
        <div className="flex-1 pl-6 py-6 h-full overflow-y-auto scrollbar-xs">
          {/*{displayLayer ? (*/}
          {/*  <Source sourceId={displayLayer} />*/}
          {/*) : (*/}
          {/*  <div className="w-full h-full text-center py-40">*/}
          {/*    Choose a Layer to view info*/}
          {/*  </div>*/}
          {/*)}*/}
        </div>
      </div>
    </div>
  );
};

export default LayerManager;